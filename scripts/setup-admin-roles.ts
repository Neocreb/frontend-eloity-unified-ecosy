import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAILS = [
  'admin@eloity.com',
  'eloityhq@gmail.com',
  'jeresoftblog@gmail.com',
];

async function setupAdminRoles() {
  console.log('Setting up admin roles...');

  try {
    // Get all users with admin emails
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('email', ADMIN_EMAILS);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users?.length || 0} admin users`);

    // Create or update user_roles for each admin
    for (const user of users || []) {
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: user.id,
            role: 'admin',
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error(`Error updating role for ${user.email}:`, error);
      } else {
        console.log(`✓ Admin role assigned to ${user.email}`);
      }
    }

    console.log('Admin roles setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupAdminRoles();

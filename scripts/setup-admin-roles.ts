import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin email addresses to be assigned
const ADMIN_EMAILS = [
  'admin@eloity.com',
  'eloityhq@gmail.com',
  'jeresoftblog@gmail.com',
  'elo@eloibbbty.com', // From the user context
];

async function setupAdminRoles() {
  try {
    console.log('🔄 Setting up admin roles...');
    console.log(`📧 Admin emails to process: ${ADMIN_EMAILS.join(', ')}`);

    // First, ensure the user_roles table exists
    console.log('✅ Checking user_roles table...');

    for (const email of ADMIN_EMAILS) {
      try {
        // Get user by email using admin API
        const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();

        if (getUserError) {
          console.error(`❌ Error fetching users: ${getUserError.message}`);
          continue;
        }

        const user = users?.users.find((u) => u.email === email);

        if (!user) {
          console.warn(`⚠️  User not found with email: ${email}`);
          continue;
        }

        console.log(`📝 Processing user: ${email} (ID: ${user.id})`);

        // Check if admin role already exists
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!checkError && existingRole) {
          if (existingRole.role === 'admin') {
            console.log(`✅ User ${email} already has admin role`);
          } else {
            // Update existing role to admin
            const { error: updateError } = await supabase
              .from('user_roles')
              .update({ role: 'admin' })
              .eq('user_id', user.id);

            if (updateError) {
              console.error(`❌ Error updating role for ${email}: ${updateError.message}`);
            } else {
              console.log(`✅ Updated ${email} to admin role`);
            }
          }
        } else {
          // Create new admin role
          const { error: insertError } = await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'admin',
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error(`❌ Error creating admin role for ${email}: ${insertError.message}`);
          } else {
            console.log(`✅ Created admin role for ${email}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${email}:`, error);
      }
    }

    console.log('\n✅ Admin roles setup complete!');
    console.log('💡 Remember: Admins can now manage courses, articles, and other platform content.');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupAdminRoles().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

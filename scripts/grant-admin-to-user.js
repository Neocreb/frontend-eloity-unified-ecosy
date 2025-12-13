#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL and Service Role Key are required');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantAdminToUser(userId, email) {
  console.log(`\n🚀 Granting super admin privileges to user: ${email}\n`);

  try {
    // Step 1: Verify the user exists
    console.log('📋 Step 1: Verifying user exists...');
    const { data: publicUser } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (publicUser) {
      console.log(`✅ Found user: ${publicUser.email} (${publicUser.full_name || 'No name'})`);
    } else {
      console.log(`⚠️  User ${userId} not found in users table (will still grant admin access)`);
    }

    // Step 2: Check if admin record already exists
    console.log('\n📋 Step 2: Checking if admin record already exists...');
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('⚠️  Admin record already exists for this user');
      console.log(`   Roles: ${(existingAdmin.roles || []).join(', ')}`);
      console.log(`   Active: ${existingAdmin.is_active}`);

      // Update to ensure it has super_admin role
      if (!existingAdmin.roles?.includes('super_admin')) {
        console.log('\n📝 Updating roles to include super_admin...');
        const newRoles = [...(existingAdmin.roles || []), 'super_admin'];
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            roles: newRoles,
            is_active: true,
          })
          .eq('id', existingAdmin.id);

        if (updateError) {
          console.error('❌ Error updating admin roles:', updateError.message);
          process.exit(1);
        }
        console.log('✅ Roles updated');
      }
    } else {
      // Step 3: Create admin record
      console.log('\n📝 Step 3: Creating admin_users record...');
      const adminData = {
        user_id: userId,
        email: email,
        name: publicUser?.full_name || email.split('@')[0],
        avatar_url: publicUser?.avatar_url || null,
        roles: ['super_admin'],
        permissions: [
          'admin.all',
          'users.all',
          'content.all',
          'marketplace.all',
          'crypto.all',
          'freelance.all',
          'financial.all',
          'settings.all',
          'moderation.all',
          'analytics.all',
          'system.all',
        ],
        is_active: true,
      };

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert(adminData)
        .select();

      if (insertError) {
        console.error('❌ Error creating admin record:', insertError.message);
        process.exit(1);
      }

      console.log('✅ Admin record created successfully');
    }

    // Step 4: Verify the user can login
    console.log('\n📋 Step 4: Verifying admin access setup...');
    const { data: finalAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (finalAdmin) {
      console.log('✅ Admin record verified');
      console.log(`   Email: ${finalAdmin.email}`);
      console.log(`   Roles: ${finalAdmin.roles?.join(', ')}`);
      console.log(`   Active: ${finalAdmin.is_active}`);
      console.log(`   Permissions: ${(finalAdmin.permissions || []).length} granted`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS: Super admin privileges granted!');
    console.log('='.repeat(60));
    console.log(`\n📧 User Email: ${email}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`\n🌐 Access admin dashboard at: /admin/login`);
    console.log(`\n📝 The user can login with their regular credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: (their existing password)\n`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

const userId = process.argv[2] || '293caea5-0e82-4b2d-9642-67f3cdbd95fb';
const email = process.argv[3] || 'jeresoftblog@gmail.com';

if (!userId || !email) {
  console.error('❌ User ID and email are required');
  console.log('\nUsage: node scripts/grant-admin-to-user.js <user-id> <email>');
  console.log('Example: node scripts/grant-admin-to-user.js 293caea5-0e82-4b2d-9642-67f3cdbd95fb jeresoftblog@gmail.com');
  process.exit(1);
}

grantAdminToUser(userId, email).catch(console.error);

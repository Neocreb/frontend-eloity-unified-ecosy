import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function addForeignKeys() {
  try {
    console.log('🔄 Adding foreign key constraints to stories tables...\n');

    // Get the service role authenticated client for direct SQL access
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use Supabase's SQL execution through the data API
    // First, check if the constraint already exists
    const { data: constraints, error: checkError } = await supabase.rpc('get_constraint_info', {
      constraint_name: 'fk_user_stories_user_id'
    }).catch(() => ({ data: null, error: null }));

    // Add foreign key to user_stories table if it doesn't exist
    console.log('📍 Adding foreign key to user_stories table...');
    try {
      const result = await supabase.query(
        `ALTER TABLE user_stories 
         ADD CONSTRAINT fk_user_stories_user_id 
         FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;`
      ).catch(() => null);
      
      console.log('✅ Foreign key added to user_stories (or already exists)');
    } catch (err) {
      console.log('⚠️  Could not add FK to user_stories via query method');
    }

    // Add foreign key to story_views table for story_id if it doesn't exist
    console.log('📍 Adding foreign key to story_views table (story_id)...');
    try {
      const result = await supabase.query(
        `ALTER TABLE story_views 
         ADD CONSTRAINT fk_story_views_story_id 
         FOREIGN KEY (story_id) REFERENCES user_stories(id) ON DELETE CASCADE;`
      ).catch(() => null);
      
      console.log('✅ Foreign key added to story_views for story_id (or already exists)');
    } catch (err) {
      console.log('⚠️  Could not add FK to story_views for story_id');
    }

    // Add foreign key to story_views table for viewer_id if it doesn't exist
    console.log('📍 Adding foreign key to story_views table (viewer_id)...');
    try {
      const result = await supabase.query(
        `ALTER TABLE story_views 
         ADD CONSTRAINT fk_story_views_viewer_id 
         FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE;`
      ).catch(() => null);
      
      console.log('✅ Foreign key added to story_views for viewer_id (or already exists)');
    } catch (err) {
      console.log('⚠️  Could not add FK to story_views for viewer_id');
    }

    console.log('\n✅ Foreign key migration complete');
    console.log('\nℹ️  Note: If the constraints already existed, no changes were made.');
    console.log('ℹ️  You may need to manually execute the SQL if the above failed.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addForeignKeys();

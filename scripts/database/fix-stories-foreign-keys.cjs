const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixStoriesForeignKeys() {
  let pgClient;
  
  try {
    console.log('🔄 Fixing stories table foreign keys...\n');
    
    // Connect using the direct database URL
    pgClient = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Drop existing constraints if they exist (ignore errors if they don't)
    const constraintsToDrop = [
      'fk_user_stories_user_id',
      'fk_story_views_story_id',
      'fk_story_views_viewer_id'
    ];

    for (const constraint of constraintsToDrop) {
      try {
        await pgClient.query(
          `ALTER TABLE IF EXISTS user_stories DROP CONSTRAINT IF EXISTS ${constraint};`
        );
        console.log(`✓ Dropped constraint ${constraint} (if it existed)`);
      } catch (err) {
        // Ignore errors
      }

      try {
        await pgClient.query(
          `ALTER TABLE IF EXISTS story_views DROP CONSTRAINT IF EXISTS ${constraint};`
        );
        console.log(`✓ Dropped constraint ${constraint} from story_views (if it existed)`);
      } catch (err) {
        // Ignore errors
      }
    }

    console.log('\n📍 Adding foreign key constraints...\n');

    // Add foreign key: user_stories.user_id -> profiles.id
    try {
      await pgClient.query(
        `ALTER TABLE user_stories 
         ADD CONSTRAINT fk_user_stories_user_id 
         FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;`
      );
      console.log('✅ Added foreign key: user_stories.user_id -> profiles.id');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('❌ Failed to add FK to user_stories:', err.message);
      } else {
        console.log('ℹ️  Foreign key user_stories.user_id already exists');
      }
    }

    // Add foreign key: story_views.story_id -> user_stories.id
    try {
      await pgClient.query(
        `ALTER TABLE story_views 
         ADD CONSTRAINT fk_story_views_story_id 
         FOREIGN KEY (story_id) REFERENCES user_stories(id) ON DELETE CASCADE;`
      );
      console.log('✅ Added foreign key: story_views.story_id -> user_stories.id');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('❌ Failed to add FK to story_views (story_id):', err.message);
      } else {
        console.log('ℹ️  Foreign key story_views.story_id already exists');
      }
    }

    // Add foreign key: story_views.viewer_id -> profiles.id
    try {
      await pgClient.query(
        `ALTER TABLE story_views 
         ADD CONSTRAINT fk_story_views_viewer_id 
         FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE;`
      );
      console.log('✅ Added foreign key: story_views.viewer_id -> profiles.id');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('❌ Failed to add FK to story_views (viewer_id):', err.message);
      } else {
        console.log('ℹ️  Foreign key story_views.viewer_id already exists');
      }
    }

    console.log('\n📍 Verifying foreign keys...\n');

    // Verify the constraints were added
    const result = await pgClient.query(
      `SELECT constraint_name, table_name, column_name
       FROM information_schema.key_column_usage
       WHERE table_name IN ('user_stories', 'story_views')
       AND constraint_name LIKE 'fk%';`
    );

    if (result.rows.length > 0) {
      console.log('✅ Foreign keys verified:');
      result.rows.forEach(row => {
        console.log(`   - ${row.constraint_name} on ${row.table_name}.${row.column_name}`);
      });
    } else {
      console.log('⚠️  No foreign keys found. Constraints may not have been created.');
    }

    console.log('\n✅ Foreign key migration complete!');
    console.log('ℹ️  Supabase REST API should now recognize story relationships.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pgClient) {
      await pgClient.end();
    }
  }
}

fixStoriesForeignKeys();

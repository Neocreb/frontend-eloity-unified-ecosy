const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

async function fixStoriesForeignKeys() {
  let pgClient;
  
  try {
    console.log('🔄 Fixing stories table foreign keys...\n');
    
    pgClient = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    console.log('📍 Adding foreign key constraints...\n');

    // Add foreign key: user_stories.user_id -> profiles.user_id
    try {
      await pgClient.query(
        `ALTER TABLE user_stories 
         ADD CONSTRAINT fk_user_stories_user_id 
         FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;`
      );
      console.log('✅ Added foreign key: user_stories.user_id -> profiles.user_id');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Foreign key user_stories.user_id already exists');
      } else {
        console.error('❌ Failed to add FK to user_stories:', err.message);
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
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Foreign key story_views.story_id already exists');
      } else {
        console.error('❌ Failed to add FK to story_views (story_id):', err.message);
      }
    }

    // Add foreign key: story_views.user_id -> profiles.user_id
    try {
      await pgClient.query(
        `ALTER TABLE story_views 
         ADD CONSTRAINT fk_story_views_user_id 
         FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;`
      );
      console.log('✅ Added foreign key: story_views.user_id -> profiles.user_id');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Foreign key story_views.user_id already exists');
      } else {
        console.error('❌ Failed to add FK to story_views (user_id):', err.message);
      }
    }

    console.log('\n📍 Verifying foreign keys...\n');

    // Verify the constraints were added
    const result = await pgClient.query(
      `SELECT
         tc.constraint_name,
         kcu.table_name,
         kcu.column_name,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND kcu.table_name IN ('user_stories', 'story_views')
       ORDER BY kcu.table_name, kcu.column_name;`
    );

    if (result.rows.length > 0) {
      console.log('✅ Foreign keys verified:');
      result.rows.forEach(row => {
        console.log(`   ${row.constraint_name}:`);
        console.log(`     ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      console.log('⚠️  No foreign keys found. Something may have gone wrong.');
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

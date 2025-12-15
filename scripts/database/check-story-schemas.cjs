const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

async function checkSchemas() {
  let pgClient;
  
  try {
    pgClient = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Check user_stories columns
    console.log('📋 user_stories table columns:');
    const userStoriesResult = await pgClient.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'user_stories'
       ORDER BY ordinal_position;`
    );
    userStoriesResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check story_views columns
    console.log('\n📋 story_views table columns:');
    const storyViewsResult = await pgClient.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'story_views'
       ORDER BY ordinal_position;`
    );
    storyViewsResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check profiles columns
    console.log('\n📋 profiles table columns:');
    const profilesResult = await pgClient.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'profiles'
       ORDER BY ordinal_position;`
    );
    profilesResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check existing constraints
    console.log('\n📋 Existing foreign key constraints:');
    const constraintsResult = await pgClient.query(
      `SELECT constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
       FROM information_schema.key_column_usage
       WHERE table_schema = 'public'
       AND table_name IN ('user_stories', 'story_views')
       AND referenced_table_name IS NOT NULL;`
    );
    
    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach(row => {
        console.log(`   ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.referenced_table_name}.${row.referenced_column_name}`);
      });
    } else {
      console.log('   (no foreign keys found)');
    }

    console.log('\n✅ Schema check complete');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pgClient) {
      await pgClient.end();
    }
  }
}

checkSchemas();

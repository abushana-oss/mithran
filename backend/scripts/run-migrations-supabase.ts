import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('✓ Connected to Supabase');

  // Read migration files
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  // Run migration 026
  const migration026Path = path.join(migrationsDir, '026_process_planning_redesign.sql');
  const migration027Path = path.join(migrationsDir, '027_seed_user_roles.sql');

  try {
    console.log('\n→ Running 026_process_planning_redesign.sql...');
    const migration026 = fs.readFileSync(migration026Path, 'utf-8');

    const { error: error026 } = await supabase.rpc('exec_sql', { sql: migration026 });

    if (error026) {
      console.error('✗ Error running migration 026:');
      console.error(error026.message);
      console.log('\n⚠️  Please run this migration manually in Supabase SQL Editor');
      console.log(`   File: ${migration026Path}`);
    } else {
      console.log('✓ Completed 026_process_planning_redesign.sql');
    }

    console.log('\n→ Running 027_seed_user_roles.sql...');
    const migration027 = fs.readFileSync(migration027Path, 'utf-8');

    const { error: error027 } = await supabase.rpc('exec_sql', { sql: migration027 });

    if (error027) {
      console.error('✗ Error running migration 027:');
      console.error(error027.message);
      console.log('\n⚠️  Please run this migration manually in Supabase SQL Editor');
      console.log(`   File: ${migration027Path}`);
    } else {
      console.log('✓ Completed 027_seed_user_roles.sql');
    }

    console.log('\n✓ Migration process completed');
    console.log('\nNOTE: If any migrations failed, please run them manually in Supabase SQL Editor:');
    console.log('  1. Go to your Supabase dashboard');
    console.log('  2. Click SQL Editor in the sidebar');
    console.log('  3. Copy and paste the migration SQL');
    console.log('  4. Click Run');

  } catch (error: any) {
    console.error('\n✗ Error:', error.message);
    console.log('\n⚠️  Please run migrations manually in Supabase SQL Editor');
  }
}

runMigrations();

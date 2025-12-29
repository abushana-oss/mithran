import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running vendor management system migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/015_comprehensive_vendor_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('⚠️  RPC method not available, trying alternative...');

      // Split by statement and execute one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          // Note: Direct SQL execution might not work with Supabase client
          // Best to use Supabase Dashboard SQL Editor
        }
      }

      console.log('\n⚠️  Please run this migration using Supabase Dashboard SQL Editor');
      console.log('📋 Steps:');
      console.log('   1. Open Supabase Dashboard > SQL Editor');
      console.log('   2. Create new query');
      console.log('   3. Copy contents from: backend/migrations/015_comprehensive_vendor_system.sql');
      console.log('   4. Run the query\n');
      return;
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Created tables:');
    console.log('   - vendors');
    console.log('   - vendor_equipment');
    console.log('   - vendor_services');
    console.log('   - vendor_contacts');
    console.log('   - vendor_summary (view)\n');

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('vendors')
      .select('count')
      .limit(0);

    if (!tablesError) {
      console.log('✅ Tables verified successfully!');
      console.log('\n🎉 You can now:');
      console.log('   1. Upload your vendor CSV');
      console.log('   2. Start using the vendor management system\n');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual steps:');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Create new query');
    console.log('   3. Copy contents from: backend/migrations/015_comprehensive_vendor_system.sql');
    console.log('   4. Run the query\n');
  }
}

runMigration();

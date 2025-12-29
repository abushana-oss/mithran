#!/usr/bin/env ts-node

/**
 * Run migrations via Supabase Client
 * This script runs migrations using the Supabase JS client instead of direct PostgreSQL connection
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('🚀 Running migration via Supabase client...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '../migrations/014_create_raw_materials.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file: 014_create_raw_materials.sql');
    console.log('🔧 Executing SQL...\n');

    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If the RPC function doesn't exist, we need to use a different approach
      console.log('⚠️  RPC method not available, trying direct SQL execution...\n');

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', {
            query: statement + ';'
          });

          if (execError) {
            console.error('❌ Error executing statement:', execError);
            throw execError;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n💡 The raw_materials table has been created.');
    console.log('   You can now reload your application to use the raw materials feature.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/_/sql\n');
    process.exit(1);
  }
}

runMigration();

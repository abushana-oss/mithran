import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Migration {
  filename: string;
  number: number;
  content: string;
}

async function runMigrations() {
  // Parse Supabase connection string
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && !supabaseUrl) {
    console.error('Error: DATABASE_URL or SUPABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Create PostgreSQL client
  const client = new Client({
    connectionString: databaseUrl || `${supabaseUrl}/db/postgres`,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_number INTEGER UNIQUE NOT NULL,
        migration_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Get already executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT migration_number FROM schema_migrations ORDER BY migration_number'
    );
    const executedNumbers = new Set(executedMigrations.map((row) => row.migration_number));

    // Read all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir);

    const migrations: Migration[] = files
      .filter((file) => file.endsWith('.sql') && /^\d{3}_/.test(file))
      .map((filename) => {
        const match = filename.match(/^(\d{3})_/);
        const number = match ? parseInt(match[1], 10) : 0;
        const content = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');
        return { filename, number, content };
      })
      .sort((a, b) => a.number - b.number);

    console.log(`Found ${migrations.length} migration files`);

    // Run pending migrations
    let executed = 0;
    for (const migration of migrations) {
      if (executedNumbers.has(migration.number)) {
        console.log(`⊘ Skipping ${migration.filename} (already executed)`);
        continue;
      }

      console.log(`→ Running ${migration.filename}...`);

      try {
        // Execute migration
        await client.query(migration.content);

        // Record successful migration
        await client.query(
          'INSERT INTO schema_migrations (migration_number, migration_name) VALUES ($1, $2)',
          [migration.number, migration.filename]
        );

        console.log(`✓ Completed ${migration.filename}`);
        executed++;
      } catch (error: any) {
        console.error(`✗ Error running ${migration.filename}:`);
        console.error(error.message);

        // Continue with next migration instead of stopping
        console.log('Continuing with next migration...\n');
      }
    }

    if (executed === 0) {
      console.log('✓ No new migrations to run');
    } else {
      console.log(`\n✓ Successfully executed ${executed} migration(s)`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function resetMigrations() {
  console.log('WARNING: This will drop all tables and reset the database!');
  console.log('This operation cannot be undone.');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Drop migrations table
    await client.query('DROP TABLE IF EXISTS schema_migrations CASCADE');
    console.log('✓ Reset migrations tracking table');

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'migrate') {
  runMigrations();
} else if (command === 'reset') {
  resetMigrations();
} else {
  console.log('Usage:');
  console.log('  npm run db:migrate       - Run pending migrations');
  console.log('  npm run db:migrate:reset - Reset migrations table');
  process.exit(1);
}

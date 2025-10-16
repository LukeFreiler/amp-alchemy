#!/usr/bin/env node
/**
 * Migration runner script
 * Usage: node scripts/run-migration.js <migration-file.sql>
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const sqlPath = path.join(process.cwd(), migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log(`✓ Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file.sql>');
  process.exit(1);
}

runMigration(migrationFile);

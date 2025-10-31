#!/usr/bin/env node
/**
 * Check section keys in database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

async function checkKeys() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const result = await client.query(
      'SELECT id, title, key FROM sections ORDER BY created_at DESC LIMIT 20'
    );

    console.log('Recent sections:');
    console.log('─'.repeat(80));
    result.rows.forEach((row) => {
      console.log(`ID: ${row.id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Key: ${row.key || '❌ MISSING'}`);
      console.log('─'.repeat(80));
    });

    const missingKeys = await client.query(
      'SELECT COUNT(*) as count FROM sections WHERE key IS NULL'
    );
    console.log(`\nSections without keys: ${missingKeys.rows[0].count}`);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkKeys();

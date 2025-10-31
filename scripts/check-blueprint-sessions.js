#!/usr/bin/env node
/**
 * Check blueprint sessions
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
        const value = valueParts
          .join('=')
          .replace(/^['"']/g, '')
          .replace(/['"']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

async function checkSessions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const result = await client.query(`
      SELECT
        b.name as blueprint_name,
        b.id as blueprint_id,
        b.status,
        COUNT(s.id)::int as session_count
      FROM blueprints b
      LEFT JOIN sessions s ON s.blueprint_id = b.id
      GROUP BY b.id, b.name, b.status
      ORDER BY session_count DESC, b.name
    `);

    console.log('Blueprints and their session counts:');
    console.log('─'.repeat(80));
    result.rows.forEach((row) => {
      console.log(`Blueprint: ${row.blueprint_name} (${row.status})`);
      console.log(`  ID: ${row.blueprint_id}`);
      console.log(`  Sessions: ${row.session_count}`);
      console.log('─'.repeat(80));
    });

    // Also show all sessions with their blueprint names
    const sessions = await client.query(`
      SELECT
        s.id,
        s.name as session_name,
        s.status,
        b.name as blueprint_name,
        s.created_at
      FROM sessions s
      JOIN blueprints b ON b.id = s.blueprint_id
      ORDER BY s.created_at DESC
    `);

    console.log('\nAll sessions:');
    console.log('─'.repeat(80));
    sessions.rows.forEach((row) => {
      console.log(`Session: ${row.session_name} (${row.status})`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Blueprint: ${row.blueprint_name}`);
      console.log(`  Created: ${new Date(row.created_at).toLocaleString()}`);
      console.log('─'.repeat(80));
    });
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSessions();

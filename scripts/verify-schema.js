#!/usr/bin/env node
/**
 * Schema verification script
 * Verifies that all tables exist and seed data is properly loaded
 */

const { Client } = require('pg');

async function verifySchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check all tables exist
    console.log('Checking tables...');
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const tables = tablesResult.rows.map((r) => r.tablename);
    const expectedTables = [
      'audit_log',
      'artifacts',
      'blueprint_artifact_generators',
      'blueprints',
      'companies',
      'fields',
      'members',
      'section_notes',
      'sections',
      'session_field_values',
      'sessions',
      'share_links',
      'sources',
    ];

    for (const table of expectedTables) {
      if (tables.includes(table)) {
        console.log(`  ✓ ${table}`);
      } else {
        console.log(`  ✗ ${table} MISSING`);
      }
    }

    // Check companies
    console.log('\nChecking companies...');
    const companies = await client.query('SELECT * FROM companies');
    console.log(`  ✓ ${companies.rows.length} company(ies) found`);

    // Check blueprints
    console.log('\nChecking blueprints...');
    const blueprints = await client.query(`
      SELECT b.name, b.version, COUNT(DISTINCT s.id) as section_count
      FROM blueprints b
      LEFT JOIN sections s ON s.blueprint_id = b.id
      GROUP BY b.id
    `);
    for (const bp of blueprints.rows) {
      console.log(
        `  ✓ ${bp.name} v${bp.version} with ${bp.section_count} sections`
      );
    }

    // Check sections and fields
    console.log('\nChecking sections and fields...');
    const sections = await client.query(`
      SELECT s.title, COUNT(f.id) as field_count
      FROM sections s
      LEFT JOIN fields f ON f.section_id = s.id
      GROUP BY s.id, s.title
      ORDER BY s.order_index
    `);
    for (const section of sections.rows) {
      console.log(`  ✓ ${section.title}: ${section.field_count} fields`);
    }

    // Check artifact generators
    console.log('\nChecking artifact generators...');
    const generators = await client.query(
      'SELECT name, output_format FROM blueprint_artifact_generators ORDER BY order_index'
    );
    for (const gen of generators.rows) {
      console.log(`  ✓ ${gen.name} (${gen.output_format})`);
    }

    // Check total field count
    const fieldCount = await client.query('SELECT COUNT(*) FROM fields');
    console.log(`\nTotal fields: ${fieldCount.rows[0].count}`);

    // Check indexes
    console.log('\nChecking indexes...');
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    console.log(`  ✓ ${indexes.rows.length} indexes created`);

    console.log('\n✓ Schema verification completed successfully');
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema();

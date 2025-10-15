/**
 * Database connection pool using pg driver
 *
 * This module provides a singleton connection pool for PostgreSQL.
 * The pool automatically manages connections and handles reconnection.
 */

import { Pool } from 'pg';
import { logger } from '@/lib/logger';

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create singleton pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if no connection available
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', {
    error: err.message,
  });
});

// Log when pool is successfully connected (dev only)
pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Get the database pool instance
 *
 * @example
 * ```ts
 * import { getPool } from '@/lib/db/pool';
 *
 * const pool = getPool();
 * const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 * ```
 */
export function getPool(): Pool {
  return pool;
}

/**
 * Close all database connections
 * Call this during graceful shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

/**
 * Database query helpers
 *
 * Typed helper functions for common database operations.
 * All queries use parameterized statements to prevent SQL injection.
 */

import { getPool } from './pool';
import { logger } from '@/lib/logger';

/**
 * Execute a SQL query and return all rows
 *
 * @example
 * ```ts
 * const users = await query<User>(
 *   'SELECT * FROM users WHERE active = $1',
 *   [true]
 * );
 * ```
 */
export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const pool = getPool();

  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    logger.error('Database query failed', {
      error: error instanceof Error ? error.message : String(error),
      sql: sql.substring(0, 100), // Log first 100 chars of SQL
    });
    throw error;
  }
}

/**
 * Execute a SQL query and return a single row (or null)
 *
 * @example
 * ```ts
 * const user = await queryOne<User>(
 *   'SELECT * FROM users WHERE id = $1',
 *   [userId]
 * );
 * ```
 */
export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return affected row count
 *
 * @example
 * ```ts
 * const count = await execute(
 *   'UPDATE users SET last_login = NOW() WHERE id = $1',
 *   [userId]
 * );
 * ```
 */
export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  const pool = getPool();

  try {
    const result = await pool.query(sql, params);
    return result.rowCount ?? 0;
  } catch (error) {
    logger.error('Database execution failed', {
      error: error instanceof Error ? error.message : String(error),
      sql: sql.substring(0, 100),
    });
    throw error;
  }
}

/**
 * Execute a query within a transaction
 *
 * @example
 * ```ts
 * await transaction(async (client) => {
 *   await client.query('INSERT INTO users ...', []);
 *   await client.query('INSERT INTO profiles ...', []);
 * });
 * ```
 */
export async function transaction<T>(
  callback: (client: {
    query: (
      sql: string,
      params?: unknown[]
    ) => Promise<{ rows: unknown[]; rowCount: number | null }>;
  }) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed and was rolled back', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    client.release();
  }
}

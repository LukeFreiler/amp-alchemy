# Database Utilities

PostgreSQL database utilities using the native `pg` driver (no ORM).

## Setup

Ensure `DATABASE_URL` is set in your environment:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

## Usage

### Simple Queries

```typescript
import { query, queryOne } from '@/lib/db/query';

// Get all rows
const users = await query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Get single row
const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
```

### Insert/Update/Delete

```typescript
import { execute } from '@/lib/db/query';

const rowCount = await execute('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

console.log(`Updated ${rowCount} rows`);
```

### Transactions

```typescript
import { transaction } from '@/lib/db/query';

await transaction(async (client) => {
  await client.query('INSERT INTO users (name, email) VALUES ($1, $2)', [
    'John',
    'john@example.com',
  ]);

  await client.query('INSERT INTO profiles (user_id, bio) VALUES ($1, $2)', [
    userId,
    'Hello world',
  ]);
});
```

### Direct Pool Access

For advanced use cases, access the pool directly:

```typescript
import { getPool } from '@/lib/db/pool';

const pool = getPool();
const result = await pool.query('SELECT NOW()');
```

## Type Safety

Always provide a type parameter for query results:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

const users = await query<User>('SELECT * FROM users');
// users is typed as User[]
```

## Error Handling

All query errors are:

1. Logged automatically with sanitization (no sensitive data in logs)
2. Re-thrown for you to handle in your route

```typescript
try {
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
  if (!user) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } };
  }
  return { ok: true, data: user };
} catch (error) {
  // Database errors are logged automatically
  return { ok: false, error: { code: 'DB_ERROR', message: 'Database error' } };
}
```

## Security

✅ **Always use parameterized queries** (the `$1`, `$2` syntax)
❌ **Never concatenate user input** into SQL strings

```typescript
// ✅ Good - parameterized
await query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Bad - SQL injection risk
await query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Connection Pool

The pool is configured with:

- **Max connections:** 20
- **Idle timeout:** 30 seconds
- **Connection timeout:** 2 seconds

The pool automatically:

- Reconnects on connection loss
- Logs errors
- Manages connection lifecycle

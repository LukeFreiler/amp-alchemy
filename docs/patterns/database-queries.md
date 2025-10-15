# Database Query Patterns

**Reference when:** Writing database code

**Documentation:** See `/src/lib/db/README.md`

---

## Import Helpers

```typescript
import { query, queryOne, execute, transaction } from '@/lib/db/query';
```

## Select Queries

```typescript
// Multiple rows
const users = await query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Single row
const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);

// With JOIN
const posts = await query<PostWithAuthor>(
  `SELECT p.*, u.name as author_name
   FROM posts p
   JOIN users u ON p.user_id = u.id
   WHERE p.published = $1`,
  [true]
);
```

## Insert/Update/Delete

```typescript
// Insert and return row
const newUser = await queryOne<User>(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  [name, email]
);

// Update (returns affected count)
const count = await execute('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

// Delete
await execute('DELETE FROM items WHERE id = $1', [itemId]);
```

## Transactions

Use transactions for multi-step operations that must succeed or fail together:

```typescript
await transaction(async (client) => {
  // Insert user
  const user = await client.query('INSERT INTO users (email) VALUES ($1) RETURNING *', [email]);

  // Insert profile
  await client.query('INSERT INTO profiles (user_id, bio) VALUES ($1, $2)', [user.rows[0].id, bio]);

  // Both succeed or both rollback
});
```

## Type Safety

Always provide type parameters:

```typescript
type User = {
  id: string;
  name: string;
  email: string;
};

const users = await query<User>('SELECT * FROM users');
// users is now typed as User[]
```

## Security Rules

✅ **Always use parameterized queries:**

```typescript
await query('SELECT * FROM users WHERE email = $1', [email]);
```

❌ **Never concatenate user input:**

```typescript
await query(`SELECT * FROM users WHERE email = '${email}'`); // SQL INJECTION!
```

## Error Handling

Database errors are automatically logged. Catch and handle in your route:

```typescript
try {
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
  if (!user) throw new NotFoundError('User');
  return { ok: true, data: user };
} catch (error) {
  return handleError(error);
}
```

## Connection Pool

The pool is automatically managed:

- Max 20 connections
- 30 second idle timeout
- Auto-reconnect on failure
- See `/src/lib/db/pool.ts` for configuration

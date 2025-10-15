# API Route Patterns

**Reference when:** Building API endpoints

**Example:** See `/src/app/api/v1/_example/route.ts`

---

## Response Envelope (Required)

All API responses must use this envelope:

```typescript
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

## Basic GET Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/query';
import { handleError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const items = await query<Item>('SELECT * FROM items');

    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    return handleError(error);
  }
}
```

## POST with Validation

```typescript
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      throw new ValidationError('Name is required');
    }

    const item = await queryOne<Item>('INSERT INTO items (name) VALUES ($1) RETURNING *', [
      body.name,
    ]);

    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## Query Parameters

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  const items = await query<Item>('SELECT * FROM items LIMIT $1 OFFSET $2', [limit, offset]);

  return NextResponse.json({ ok: true, data: items });
}
```

## Error Handling

Use typed error classes:

```typescript
import { ValidationError, NotFoundError, AuthenticationError, handleError } from '@/lib/errors';

// Throw specific errors
if (!userId) throw new AuthenticationError();
if (!item) throw new NotFoundError('Item');
if (!body.email) throw new ValidationError('Email is required');

// Or use handleError to catch all
try {
  // ... your code
} catch (error) {
  return handleError(error); // Automatically formats response
}
```

## REST Patterns

```
GET    /api/v1/items           - List all items
POST   /api/v1/items           - Create item
GET    /api/v1/items/[id]      - Get single item
PUT    /api/v1/items/[id]      - Update item
DELETE /api/v1/items/[id]      - Delete item
GET    /api/v1/items/[id]/tags - Get item's tags (nested resource)
```

## Type Safety

Always type your responses:

```typescript
type SuccessResponse<T> = { ok: true; data: T };
type ErrorResponse = { ok: false; error: { code: string; message: string } };

return NextResponse.json<SuccessResponse<Item>>({ ok: true, data: item });
```

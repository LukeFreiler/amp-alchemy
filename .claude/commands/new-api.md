---
description: Create CRUD API routes for a resource
args:
  - name: resource_name
    description: Name of the resource in kebab-case (e.g., users, products, blog-posts)
    required: true
---

Create API routes for the resource `{{resource_name}}` at `src/app/api/v1/{{resource_name}}/`

## Files to Create

1. **route.ts** - Main CRUD operations (GET list, POST create)
2. **[id]/route.ts** - Single resource operations (GET, PUT, DELETE)

## Requirements

**Use the response envelope pattern:**

```typescript
// Success
{ ok: true, data: { ... } }

// Error
{ ok: false, error: { code: 'ERROR_CODE', message: '...' } }
```

**Reference the example:** `/src/app/api/v1/_example/route.ts`

**Import utilities:**

```typescript
import { query, queryOne, execute } from '@/lib/db/query';
import { ValidationError, NotFoundError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';
```

## Routes to Implement

### `route.ts` (collection)

- `GET /api/v1/{{resource_name}}` - List all (with pagination)
- `POST /api/v1/{{resource_name}}` - Create new

### `[id]/route.ts` (single resource)

- `GET /api/v1/{{resource_name}}/[id]` - Get by ID
- `PUT /api/v1/{{resource_name}}/[id]` - Update by ID
- `DELETE /api/v1/{{resource_name}}/[id]` - Delete by ID

## Checklist

After creating the files:

- [ ] Verify response envelope is used
- [ ] Add input validation with typed errors
- [ ] Use parameterized queries (never concatenate user input)
- [ ] Include proper error handling with handleError()
- [ ] Run type-check: `pnpm type-check`
- [ ] Test endpoints with curl or Postman

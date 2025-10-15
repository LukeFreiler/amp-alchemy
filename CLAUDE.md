# Centercode Next.js Starter - AI Instructions

> **This file is the Centercode standard for Next.js projects. It should not change between projects.**

## Read Order

After reading this file, read the following in order:

1. **PROJECT.md** - Project-specific domain model, business rules, and requirements
2. **DESIGN.md** - UI design system, components, and visual standards
3. **STARTER.md** - Enhancement roadmap (if working on the starter itself)

## Precedence

- **CLAUDE.md** (this file) defines the technical foundation and must not change between projects
- **DESIGN.md** provides UI standards and can evolve per project, but cannot contradict CLAUDE.md
- **PROJECT.md** describes core application in detail
- **STARTER.md** is a roadmap for completing the starter template (delete after completion)
- **Conflict resolution:** CLAUDE.md > DESIGN.md > PROJECT.md for technical standards; PROJECT.md wins for business logic

## Tech Stack (Strict)

- **Frontend:** Next.js 15+ (latest stable) with Turbo + React 19+ (latest stable)
- **UI:** shadcn/ui + Tailwind v3.4.18
- **Icons:** lucide-react only
- **Database:** Postgres 17 on Neon
- **Database Driver:** `pg` (no ORM)
- **User Auth:** NextAuth.js 4+ (latest stable)
- **AI:** OpenAI GPT-4o
- **Email:** Resend
- **Hosting:** Vercel
- **Package Manager:** pnpm (never npm or yarn)
- **Language:** TypeScript with `strict` mode enabled
- **Lint/Format:** ESLint + Prettier

## TypeScript Standards

- Strict mode enabled at all times
- **NEVER use `any`** - it will cause build failures
- Prefer explicit types over inference for public APIs
- Use strict null checks
- Domain-driven types with clear interfaces
- Prefer explicit enums over string unions

## Naming Conventions

- **Files:** kebab-case (e.g., `user-profile.tsx`)
- **Components:** PascalCase (e.g., `UserProfile`)
- **Functions:** verb-noun (e.g., `getUserData`, `validateEmail`)
- **Booleans:** `is`, `has`, `can`, `should` prefix
- **All exports:** named exports only (no default exports)

## Folder Structure

```
/
├── .claude/                   # AI agent configuration
│   ├── commands/              # Slash commands
│   ├── CLAUDE-USER.md         # Global AI instructions
│   └── example.PROJECT.md     # PROJECT.md template
├── docs/                      # Product documentation
├── prompts/                   # AI prompts (for agents and app features)
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── api/v1/            # Versioned REST API routes
│   │   │   └── _example/      # Example API route (reference)
│   │   ├── (routes)/          # Page routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/ui/         # shadcn/ui components
│   ├── features/              # Feature-based modules
│   │   └── <feature>/
│   │       ├── components/    # Feature-specific components
│   │       ├── hooks/         # Feature-specific hooks
│   │       ├── types/         # Feature-specific types
│   │       └── utils/         # Feature-specific utilities
│   ├── lib/
│   │   ├── db/                # Database utilities
│   │   │   ├── pool.ts        # pg connection pool
│   │   │   ├── query.ts       # Query helpers (query, queryOne, etc.)
│   │   │   └── README.md      # Database usage guide
│   │   ├── errors.ts          # Error classes and handlers
│   │   ├── logger.ts          # Logger with sanitization
│   │   └── utils.ts           # Shared utilities (cn, etc.)
│   └── styles/
│       └── globals.css        # Tailwind + custom CSS
├── working/                   # Human/AI collaboration scratch space
├── CLAUDE.md                  # Tech stack standards (this file)
├── DESIGN.md                  # Design system
├── PROJECT.md                 # Project-specific domain model
├── STARTER.md                 # Enhancement roadmap (complete before production)
└── tailwind.config.ts         # Tailwind configuration
```

## Import Conventions

- Use `@/` for all absolute imports
- **Import order** (with blank lines between groups):
  1. External packages
  2. Internal `@/` imports
  3. Relative imports

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { validateInput } from './utils';
```

## API-First Architecture

All data flows through versioned REST endpoints under `/app/api/v1/`:

- **Route handlers own all data access**
- React components **never import database code**
- Accept and return JSON only (no GraphQL, no RPC)
- **See example:** `/src/app/api/v1/_example/route.ts` for full implementation pattern

### Response Envelope

**All API responses** must use this envelope format:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### Route Patterns

```
GET    /api/v1/resources
POST   /api/v1/resources
GET    /api/v1/resources/[id]
PUT    /api/v1/resources/[id]
DELETE /api/v1/resources/[id]
GET    /api/v1/resources/[id]/nested
```

## Database Access

- Use `pg` driver directly (no ORM)
- All database code lives in `/src/lib/db/`
- Use prepared statements or parameterized queries
- **Never** concatenate user input into SQL
- Connection pooling handled by `pg.Pool`

### Database Utilities

Use the provided helpers from `/src/lib/db/`:

```typescript
import { query, queryOne, execute, transaction } from '@/lib/db/query';

// Get multiple rows
const users = await query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Get single row
const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);

// Insert/Update/Delete
const count = await execute('UPDATE users SET name = $1 WHERE id = $2', [name, id]);

// Transactions
await transaction(async (client) => {
  await client.query('INSERT INTO users ...', [...]);
  await client.query('INSERT INTO profiles ...', [...]);
});
```

See `/src/lib/db/README.md` for complete documentation.

## Logging

- **ALWAYS** use `logger` from `/src/lib/logger` for all server-side logging
- **NEVER** use `console.log`, `console.error`, `console.warn`, or `console.info`
- The logger provides structured JSON output with automatic sensitive data sanitization
- See `/src/lib/logger.ts` for usage examples and philosophy

## Error Handling

Use standard error classes from `/src/lib/errors.ts`:

```typescript
import { ValidationError, NotFoundError, handleError } from '@/lib/errors';

// Throw typed errors
if (!email) throw new ValidationError('Email is required');
if (!user) throw new NotFoundError('User');

// Handle any error
try {
  // ... your code
} catch (error) {
  return handleError(error); // Automatically formats response
}
```

Available error classes:

- `ValidationError` (400) - Input validation failures
- `AuthenticationError` (401) - Authentication required
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflicts
- `ApiError` - Base class for custom errors

## React Patterns

- **No `loading.tsx` files** or `Suspense` in pages/layouts
- Server components fetch data and await completion before render
- Client components marked with `'use client'`
- Use React Server Components by default
- Client components only when needed (forms, interactivity, browser APIs)

## Development Workflow

1. **TODO lists:** Use and update TODO lists for all non-trivial tasks
2. **Dev server:** Keep `pnpm dev` running on port 3000, monitor logs (kill port if necessary to use it)
3. **Type safety:** Fix all TypeScript errors before committing
4. **Pattern reuse:** Search for existing patterns before creating new ones
5. **Stack adherence:** Fix issues within the stack (no library swapping)
6. **Documentation:** Document all non-obvious code
7. **Git:** Local Git, GitHub CLI for remote operations

## Scripts

Keep all commands in `package.json` scripts. Common scripts:

```bash
pnpm dev --turbo  # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
```

## Testing and Validation

- **No Jest or Playwright** in this stack
- Validate with CLI tools:
  - `curl` for API endpoint testing
  - `jq` for JSON parsing and validation
  - Server logs for runtime verification
- If validation requires browser testing, request manual verification

---

**This is the Centercode Next.js standard. Copy this file as-is to new projects.**

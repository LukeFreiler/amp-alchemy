# Component Composition Patterns

**Reference when:** Building UI components

**See also:** DESIGN.md "Component Reuse" section

---

## Rule: Reuse Before Create

Before creating ANY component:

1. ✅ Search `src/components/ui/` - can you use an existing component?
2. ✅ Check shadcn registry - does shadcn have it?
3. ✅ Compose from existing - can you combine existing components?

## Pattern 1: Compose shadcn Components

Build new components by combining existing ones:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ✅ Good - composes existing components
export function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
        <Button>Edit</Button>
      </CardContent>
    </Card>
  );
}
```

```tsx
// ❌ Bad - reinvents Card styling
export function UserCard({ user }: UserCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

## Pattern 2: Use Semantic Tokens

Always use semantic tokens from Tailwind config:

```tsx
// ✅ Good - semantic tokens
<div className="bg-card text-card-foreground border border-border" />

// ❌ Bad - utility classes
<div className="bg-gray-950 text-gray-50 border border-gray-800" />
```

## Pattern 3: Extend with Props, Not New Components

Add variants through props, not new components:

```tsx
// ✅ Good - variant prop
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// ❌ Bad - separate components
<DeleteButton>Delete</DeleteButton>
<CancelButton>Cancel</CancelButton>
```

## Pattern 4: Feature-Specific Components

Put feature-specific components in feature folders:

```
src/
├── components/ui/          # Generic, reusable components
│   ├── button.tsx
│   └── card.tsx
└── features/
    └── user-profile/
        └── components/     # Feature-specific components
            ├── user-avatar.tsx
            └── user-profile-card.tsx
```

```tsx
// ✅ Good - feature-specific component uses generic components
import { Card } from '@/components/ui/card';

export function UserProfileCard({ user }: Props) {
  return <Card>{/* User profile specific layout */}</Card>;
}
```

## When to Create a New Base Component

Only create a new component in `src/components/ui/` when:

1. ✅ It's a **new UI primitive** not in shadcn
2. ✅ It will be **reused 3+ times** across different features
3. ✅ It **composes existing primitives** (doesn't reinvent them)

Examples of when to create:

- A project-specific data table with your filters
- A custom file uploader (if used across features)
- A specialized form field pattern

Examples of when NOT to create:

- One-off layouts (compose inline)
- Feature-specific cards (put in feature folder)
- Variants of existing components (use props)

## Loading States

Use provided loading components:

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingButton } from '@/components/ui/loading-button';

// Spinner
<LoadingSpinner size="sm" />

// Button with loading state
<LoadingButton loading={isSubmitting}>Submit</LoadingButton>
```

## Gradient Borders

Use `gradient` prop on Card and Separator:

```tsx
<Card gradient>...</Card>
<Separator gradient />
```

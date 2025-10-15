# Example Feature Module

This is a reference implementation showing how to structure a feature module.

**Delete this entire `_example` folder** once you understand the pattern.

## Structure

```
_example/
├── components/     # Feature-specific UI components
├── hooks/          # Feature-specific React hooks
├── types/          # Feature-specific TypeScript types
├── utils/          # Feature-specific utility functions
└── README.md       # This file
```

## When to Create a Feature Module

Create a feature module when you have:

- **Related functionality** that belongs together (e.g., "user-profile", "checkout", "admin-dashboard")
- **3+ components** that are specific to this feature
- **Shared types or utilities** within the feature
- **Business logic** that shouldn't be in components

## Naming Conventions

- **Folder name:** `kebab-case` matching the feature domain (e.g., `user-profile`, `product-catalog`)
- **Components:** `PascalCase` with feature context (e.g., `UserProfileCard`, `UserAvatar`)
- **Hooks:** `use` prefix with feature context (e.g., `useUserProfile`, `useUserSettings`)
- **Types:** `PascalCase` (e.g., `UserProfile`, `UserSettings`)
- **Utils:** `verb-noun` (e.g., `formatUserName`, `validateUserInput`)

## Example: User Profile Feature

```
user-profile/
├── components/
│   ├── user-avatar.tsx
│   ├── user-profile-card.tsx
│   └── user-settings-form.tsx
├── hooks/
│   ├── use-user-profile.ts
│   └── use-user-settings.ts
├── types/
│   └── user.ts
├── utils/
│   └── format-user-name.ts
└── README.md
```

## Integration with Pages

Pages import from features, not the other way around:

```tsx
// ✅ Good - page imports from feature
import { UserProfileCard } from '@/features/user-profile/components/user-profile-card';

export default function ProfilePage() {
  return <UserProfileCard userId="123" />;
}
```

```tsx
// ❌ Bad - feature imports from page
// Features should be self-contained
```

## When NOT to Create a Feature Module

Don't create a feature module if:

- ❌ You only have 1-2 components - just put them in `src/components`
- ❌ Components are generic/reusable - they belong in `src/components/ui`
- ❌ It's a single page with no shared logic - keep it colocated with the page

## See the Implementation

Check the example files in this folder to see the pattern in action.

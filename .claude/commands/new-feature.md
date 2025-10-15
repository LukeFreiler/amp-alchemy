---
description: Scaffold a new feature module with components, hooks, types, and utils
args:
  - name: feature_name
    description: Name of the feature in kebab-case (e.g., user-profile, product-catalog)
    required: true
---

Create a new feature module at `src/features/{{feature_name}}/` with the following structure:

## Files to Create

1. **README.md** - Feature documentation
2. **components/** directory with example component
3. **hooks/** directory with example hook
4. **types/** directory with example types
5. **utils/** directory (empty, ready for utilities)

## Requirements

- Use kebab-case for folder name: `{{feature_name}}`
- Use PascalCase for component names based on feature (e.g., if feature is "user-profile", components might be "UserProfile", "UserAvatar")
- Follow the pattern from `/src/features/_example/`
- Import shared components from `@/components/ui`
- Use design system colors and components (no custom styling)

## Checklist

After creating the files:

- [ ] Verify all imports work
- [ ] Run type-check: `pnpm type-check`
- [ ] Follow naming conventions from CLAUDE.md
- [ ] Document feature in the README.md

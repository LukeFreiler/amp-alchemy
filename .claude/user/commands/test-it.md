# Execute mandatory pre-deploy validation and fixes

Commands to run in sequence:

- pnpm type-check
- pnpm lint:fix
- pnpm format
- pnpm build

Requirements:

- ALL commands MUST return exit code 0 with ZERO warnings or errors
- Auto-fix all linting and formatting issues using the fix commands
- Any remaining TypeScript errors or build failures after auto-fixes are DEPLOYMENT-BLOCKING

Restrictions:

- Do NOT suggest workarounds or reduced strictness
- Report any unfixable failures as blocking issues requiring manual resolution
- This is non-negotiable for Vercel production deployment

Provide a brief bulleted summary of your results.

Execute this systematic quality assurance and commit process using the TodoWrite tool to track progress.

# Phase 1: Pre-Commit Quality Checks

Run all quality checks in parallel to identify issues:

- pnpm typecheck - TypeScript type checking (must use exact command)
- pnpm lint - ESLint code quality validation
- pnpm format:check - Prettier formatting verification

# Phase 2: Issue Resolution Protocol

If ANY issues are detected:

TypeScript Errors:

- Fix all type errors using proper typing (NEVER use any, @ts-ignore, or @ts-expect-error)
- Use proper type definitions, interfaces, or generics
- If encountering third-party library issues, add proper type definitions
- Group similar errors and fix systematically across the codebase

ESLint Violations:

- Fix all linting errors following the existing rules
- NEVER disable rules with eslint-disable comments unless documenting with TODO and reason
- Apply fixes consistently across all similar code patterns
- Maintain existing code conventions

Formatting Issues:

- Run pnpm format to auto-fix all formatting
- Verify no manual formatting overrides conflict with Prettier

# Phase 3: Verification Loop

After fixing issues:

- Re-run ALL three checks: pnpm typecheck && pnpm lint && pnpm format:check
- If any check fails, return to Phase 2
- Repeat until ALL checks pass with zero errors/warnings

# Phase 4: Git Commit Process

Only proceed when all checks pass:

1. Run parallel git status checks:

- git status - View untracked/modified files
- git diff - Review unstaged changes
- git log --oneline -5 - Check commit style

2. Stage changes: git add .
3. Create commit with descriptive message:

- Use present tense, imperative mood
- First line: concise summary (50 chars max)
- Body: explain what and why (if needed)
- Include Claude Code attribution

# Phase 5: GitHub Push

1. Verify commit: git status
2. Push to remote: git push origin main
3. Confirm push succeeded

# Phase 6: Summary Report

Provide detailed summary including:

- TypeScript Issues: Count resolved (specify types: missing types, incorrect types, etc.)
- ESLint Issues: Count resolved (categorize: unused vars, formatting, best practices)
- Formatting Issues: Files auto-formatted
- Commit Details: Hash, message, files changed
- GitHub Status: Push confirmation with repository URL

⚠️ CRITICAL RULES

1. PRODUCTION STANDARDS: This is production code - no shortcuts, workarounds, or quality compromises
2. FIX, DON'T SUPPRESS: Resolve root causes, never suppress or ignore errors
3. ZERO TOLERANCE: Do not commit until ALL checks pass cleanly
4. BEST PRACTICES ONLY: Follow TypeScript/JavaScript best practices strictly
5. ATOMIC COMMITS: Each commit should be complete and not break the build

🔴 FAILURE CONDITIONS

STOP and request help if:

- Build errors persist after 3 fix attempts
- Conflicting rule requirements discovered
- Missing dependencies or configuration issues
- Git conflicts or push failures

# Phase 7: Summary Report

If this was not pushed to main, ask the user if they want a PR created in Github. If they say use, create a brief but clear pull request in Github.

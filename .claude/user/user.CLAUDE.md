# AI Agent Instructions - Global

Universal principles that apply to all projects, regardless of technology stack.

## Core Philosophy

**Decision hierarchy:**

1. **Consistency** - Match established patterns first
2. **Testability** - Prefer solutions verifiable with tools and logs
3. **Readability** - Keep code clear and maintainable
4. **Simplicity** - Ship the simplest complete solution

## Mandates

- **ALWAYS** follow existing code patterns and conventions
- **ALWAYS** reuse components and utilities when possible
- **ALWAYS** ensure accessibility for interactive UI
- **NEVER** simulate delays, fake data, or use hacks
- **NEVER** expose secrets or connection strings
- **NEVER** invent new patterns or libraries - reuse what exists

## Security

- Do not print secrets or credentials in logs or output
- Do not commit `.env*`, credential files, or secrets to version control
- Never expose secrets in publicly accessible configuration or code
- Store all secrets in environment variables or secure secret management systems
- Use appropriate prefixes per framework requirements (e.g., avoid client-side exposure)
- Use library defaults for cryptography - no custom implementations

## Change Control

- Do not push or publish unless explicitly asked
- Commits are formatted, linted, and linked to the task
- No time or effort estimates in commits or PRs

## Problem Solving

- When stuck, step back and think deeper
- Find root causes instead of applying patches
- Never use framework escape hatches or override mechanisms to bypass proper solutions
- Prefer boring, proven solutions over clever ones
- Start simple, add complexity only when explicitly needed

## Code Quality

- Keep functions small with single responsibilities
- Write self-documenting code with clear naming
- Comment the "why", not the "what"
- Favor explicitness over cleverness

## UI and Dependencies

- Prefer design system components when one exists
- Do not add new UI libraries or major dependencies without discussion and approval
- Reuse existing libraries before proposing new ones

---

## Git, GitHub and change control

- NEVER commit unless told to.
- If not specified (local git or Github) - commit to BOTH.
- NEVER include time or effort estimates in commits or PRs.
- ALWAYS lint (eslint) and format (prettier) commits.
- ALWAYS ask if a PR or new branch should be created after a commit.

**Precedence:** If global and project rules conflict, project rules win.

---
description: Regenerate README.md from project documentation
---

# Update README.md

Read the following files in this order:

1. PROJECT.md - for project-specific details
2. DESIGN.md - for design system information
3. CLAUDE.md - for tech stack and standards

Generate a comprehensive, human-readable README.md that serves as the GitHub landing page for this project.

## Requirements

### Content Structure

Include these sections in order:

1. **Project Title & Description**
   - Pull from PROJECT.md
   - Add tech stack one-liner from CLAUDE.md

2. **Quick Start**
   - Prerequisites (Node, pnpm, database)
   - Installation steps
   - Environment setup
   - How to run locally

3. **Tech Stack**
   - Organized by category: Frontend, Backend, Services, Developer Experience
   - Pull from CLAUDE.md tech stack section

4. **Project Structure**
   - Folder structure from CLAUDE.md
   - Brief description of each major folder

5. **Development**
   - Available scripts
   - Development workflow
   - Code quality standards

6. **Design System**
   - Brief overview with link to DESIGN.md
   - Key principles (dark theme, shadcn, etc.)

7. **API Design**
   - Response format
   - Example routes from PROJECT.md

8. **Testing**
   - CLI-based testing approach
   - How to validate changes

9. **Deployment**
   - Vercel deployment info
   - Environment variables note

10. **Documentation**
    - Links to CLAUDE.md, PROJECT.md, DESIGN.md
    - Links to /docs folder

11. **Contributing**
    - Branch workflow
    - Standards reference
    - Commit message format

12. **License & Team**
    - License placeholder
    - Team/contact info

### Style Guidelines

- **Emojis:** Use section emojis (🚀, 📦, 🛠️, etc.) for visual hierarchy
- **Tone:** Professional but friendly
- **Format:** Clear headers, code blocks, lists
- **Links:** Use relative links to other docs
- **Examples:** Include concrete examples (API routes, commands, etc.)

### What to Avoid

- Don't duplicate detailed content from CLAUDE.md (link to it instead)
- Don't include AI agent instructions
- Don't make it too long - keep it scannable
- No redundancy with other docs unless it aids human onboarding

## Output

Write the complete README.md file, overwriting the existing one.

After writing, confirm that you've:

- ✅ Pulled project name and description from PROJECT.md
- ✅ Included tech stack from CLAUDE.md
- ✅ Referenced DESIGN.md for design system
- ✅ Used API examples from PROJECT.md
- ✅ Maintained GitHub README best practices

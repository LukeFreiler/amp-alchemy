# Project Details

> **Fill out this template when starting your project. Replace all placeholder text with your project-specific information.**

## Project Name

**[Your Project Name]**

## Project Description

[Describe what this application does and who it's for. 1-3 sentences.]

---

## Domain Model

### Core Entities

List your primary domain entities and their relationships:

```
[Entity Name]
  ├─ [Related Entity]
  │   ├─ [Sub-entity]
  │   └─ [Sub-entity]
  └─ [Related Entity]
```

**Example:**

```
User
  ├─ Projects
  │   ├─ Tasks
  │   └─ Comments
  └─ Team memberships
```

---

## Business Rules

Document your key business rules and constraints:

### [Rule Category 1]

- [Business rule description]
- [Business rule description]

### [Rule Category 2]

- [Business rule description]
- [Business rule description]

**Example:**

```
### Task Management
- Tasks can only be assigned to team members
- Completed tasks cannot be edited
- Task deadlines must be in the future
```

---

## Feature Modules

List the main feature areas of your application:

- **[Feature 1]** - [Brief description]
- **[Feature 2]** - [Brief description]
- **[Feature 3]** - [Brief description]

**Example:**

```
- **Authentication** - User login and registration
- **Projects** - CRUD operations for project management
- **Tasks** - Task creation, assignment, and tracking
```

---

## API Resources

Document your primary API endpoints:

```
/api/v1/[resource]
/api/v1/[resource]/[id]
/api/v1/[resource]/[id]/[nested-resource]
```

**Example:**

```
/api/v1/users
/api/v1/users/[id]
/api/v1/projects
/api/v1/projects/[id]/tasks
```

---

## Database Schema

List your key tables/schemas:

- `[table_name]` - [Description]
- `[table_name]` - [Description]
- `[table_name]` - [Description]

**Example:**

```
- `users` - User accounts and profiles
- `projects` - Project master records
- `tasks` - Task items within projects
- `comments` - Comments on tasks
```

---

## Authentication & Authorization

- **Auth provider:** [e.g., NextAuth, Clerk, Auth0, Custom]
- **User roles:** [List roles, e.g., Admin, User, Guest]
- **Permission model:** [e.g., RBAC, ABAC, Custom]

---

## External Integrations

List any external APIs or services you'll integrate:

- **[Service Name]** - [What it's used for]
- **[Service Name]** - [What it's used for]

**Example:**

```
- **Stripe** - Payment processing
- **SendGrid** - Transactional emails
- **AWS S3** - File storage
```

---

## Environment Variables

List required environment variables:

```bash
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# [Service Name]
[SERVICE_API_KEY]=

# [Add your project-specific vars]
```

---

## Project-Specific Conventions

### Naming Patterns

Document any project-specific naming conventions:

- [Convention description]

**Example:**

```
- Monetary values use `amount` suffix (e.g., `totalAmount`, `priceAmount`)
- Date fields use `At` suffix (e.g., `createdAt`, `publishedAt`)
- Boolean fields use `is` prefix (e.g., `isActive`, `isPublished`)
```

### Code Patterns

Document any recurring code patterns specific to this project:

- [Pattern description]

**Example:**

```
- All date handling uses `date-fns` library
- Currency formatting uses `formatCurrency()` utility from `@/lib/format`
- All forms use `react-hook-form` with Zod validation
```

---

## Special Requirements

List any special constraints, performance requirements, or technical requirements:

- [Requirement]
- [Requirement]

**Example:**

```
- Dashboard must load in under 2 seconds
- Support for 10,000+ concurrent users
- GDPR compliance required for EU users
- Offline-first capability for mobile app
```

---

## Known Limitations

Document known limitations or constraints:

- [Limitation]
- [Limitation]

**Example:**

```
- Historical data only available from 2024 onwards
- Maximum file upload size: 50MB
- Search limited to last 90 days of data
```

---

**Keep this file updated as your project evolves. It should always reflect the current state of your domain model and business rules.**

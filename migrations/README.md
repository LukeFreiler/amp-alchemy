# Database Migrations

This directory contains SQL migration files for the Centercode Alchemy database.

## Migration Files

### 001 - Initial Schema

- **001_initial_schema.sql**: Creates all core tables, indexes, and triggers
- **001_initial_schema_down.sql**: Rolls back the initial schema

### 002 - Seed Data

- **002_seed_beta_blueprint.sql**: Seeds the Beta Test Plan blueprint with demo data
- **002_seed_beta_blueprint_down.sql**: Removes the seed data

## Running Migrations

### Apply Migrations (Up)

```bash
node scripts/run-migration.js migrations/001_initial_schema.sql
node scripts/run-migration.js migrations/002_seed_beta_blueprint.sql
```

### Rollback Migrations (Down)

```bash
node scripts/run-migration.js migrations/002_seed_beta_blueprint_down.sql
node scripts/run-migration.js migrations/001_initial_schema_down.sql
```

### Verify Schema

```bash
node scripts/verify-schema.js
```

## Schema Overview

### Core Tables

- **companies** - Organizations that own data
- **members** - Users within companies (owner, editor, viewer roles)
- **blueprints** - Reusable templates with versioning
- **sections** - Pages in the wizard grouped by topic
- **fields** - Input elements (ShortText, LongText, Toggle)
- **blueprint_artifact_generators** - Templates for generating artifacts
- **sessions** - Individual runs of blueprints
- **session_field_values** - Data collected during sessions
- **section_notes** - Freeform markdown notes per section
- **sources** - Imported files, URLs, or pasted text
- **artifacts** - Generated outputs with version history
- **share_links** - Access control for sharing artifacts
- **audit_log** - Complete audit trail of all mutations

### Key Features

- UUIDs for all primary keys
- Automatic `updated_at` timestamp triggers
- Cascade deletes for company data
- RESTRICT deletes for blueprints/fields referenced by sessions
- JSONB for flexible metadata and provenance tracking
- Comprehensive indexes for performance

## Database Connection

Ensure `DATABASE_URL` environment variable is set in `.env.local`:

```
DATABASE_URL=postgresql://user:password@host/database
```

# Project: “Centercode Alchemy”

## 1) Product vision

Create a flexible, dark-mode web app that lets teams capture structured notes through a fast wizard, optionally prefill those notes by ingesting files, pasted text, or URLs, then generate polished artifacts from the captured data using custom prompts. Start with simple field types and a clean 3‑panel UI. Design it to generalize across use cases such as beta test planning, sales enablement, and structured brainstorming.

---

## 2) Core concepts and recommended vocabulary

Pick canonical names to keep the code and UI consistent. Suggested set:

- **Company**: an organization that owns data and seats.
- **Member**: a user in a Company.
  - **Editor**: can create Blueprints, Sessions, and Artifacts.
  - **Viewer**: can view Artifacts and, if allowed, upload Sources.
- **Blueprint**: A reusable template that defines Sections, Fields, and Artifact Generators.
- **Section**: A page in the wizard that groups related Fields and has its own Notes.
- **Field**: an input inside a Section. Initial types are ShortText, LongText, Toggle. Fields have labels, help text, required flag, and a 1‑column or 2‑column span.
- **Session**: a single run of a Blueprint to collect data. Can be prefixed by ingestion from Sources and edited ad hoc.
- **Source**: any imported input that can prefill Fields. Options are File Upload, Pasted Text, or URL scrape.
- **Artifact**: an output generated from a Session using a Prompt tied to the Blueprint. Versioned with history.
- **Command Palette**: keyboard-first launcher for navigation and actions.
- **Data Room**: shareable space for Viewers to access Artifacts and, if permitted, upload Sources.

---

## 3) Roles and permissions

- **Company Owner**: first Editor who creates a Company. Can invite Members, set defaults.
- **Editor**:
  - Create, edit, duplicate, archive Blueprints.
  - Create, edit, run Sessions for any Blueprint in the Company.
  - Import Sources into Sessions at any time.
  - Create and manage Artifact Generators on a Blueprint.
  - Generate, review, publish, and export Artifacts. View Artifact history.
- **Viewer**:
  - Access shared Artifacts in the Data Room.
  - Optional per-share toggle: “Viewer can upload Sources to this Session”.
- **Access model**:
  - Company-wide access to Blueprints and Sessions by default.
  - Share Artifacts via link or named Viewers. Links can be time bound and read only.

Acceptance checks

- Inviting a Viewer by email grants access only to shared Artifacts.
- Toggling “Viewer can upload Sources” exposes upload and paste controls; otherwise hidden.

---

## 4) UX and layout

- **Dark mode** only. Branding and colors supplied by tailwind.config.ts.
- **Top bar**: logo, breadcrumb, search, command palette trigger, user avatar menu. Right side includes “Import” button.
- **Three columns**:
  - **Left**: Sections list with progress dots and validation states. Click to jump. Shows completion percentage.
  - **Center**: current Section’s Fields in a large open canvas. No subpanels.
  - **Right**: Section Notes. Freeform Markdown with live preview toggle.
- **Sticky footer** in Sessions: Back, Next, Home. Shows validation errors on Next if required fields are missing.
- **Keyboard**:
  - Cmd/Ctrl+K opens command palette.
  - Cmd/Ctrl+Enter to generate selected Artifact.
  - Arrow or J/K to move Sections.

Acceptance checks

- Left rail reflects per-Section completion and overall completion.
- Markdown is supported in all LongText fields and Notes with sanitization and a preview.

---

## 5) Session lifecycle

1. **Start session**:
   - Choose a Blueprint, name the Session, pick an initial import option:
     - Upload files
     - Paste text
     - Provide URLs to scrape
   - Or skip import and begin manually.

2. **Ingest and prefill** (optional, anytime):
   - Parse Sources, extract text, map content to Fields by semantics.
   - Prefill Fields with confidence scores and change tracking.
   - Never overwrite user edits without confirmation.
3. **Edit**:
   - Move freely across Sections or use Next/Back.
   - Required fields are indicated inline. Completion percent updates live.
   - Add Notes per Section to capture out-of-schema details.
4. **Generate Artifacts**:
   - Choose one or more Artifact Generators defined on the Blueprint.
   - Review generated content in a side-by-side view. Save as Artifact v1, v2, etc.
5. **Publish and share**:
   - Publish to Data Room and share links with Viewers.
   - Optionally export to PDF or HTML in later milestone.
6. **Close session**:
   - Mark complete when all required fields are filled. Sessions remain editable unless locked.

Acceptance checks

- Users can import additional Sources at any time during a Session.
- Artifact history shows versions with timestamp, prompt hash, and Session snapshot ID.

---

## 6) Blueprint authoring

Editors define Blueprints with a quick form builder:

- **Sections**:
  - Title, optional description.
  - Right-rail Notes enabled by default.
- **Fields** (MVP types):
  - ShortText
  - LongText
  - Toggle
  - Layout span: 1 or 2 columns.
  - Label, Help text, Required flag, Placeholder.
- **Artifact Generators**:
  - Name, Description
  - Prompt template with variables
  - Output format hint: Markdown or HTML
  - Visibility in Data Room by default or not

Blueprint actions

- Create, duplicate, reorder Sections and Fields with drag and drop.
- Save as Draft or Publish. Sessions can only be started from Published Blueprints.
- Version the Blueprint. Sessions reference a specific Blueprint version.

Acceptance checks

- Changing a Blueprint creates a new version. Existing Sessions keep their version unless upgraded by an Editor.

---

## 7) Import and AI prefill

**Input modalities**

- **Files**: PDF, DOCX, TXT, CSV, Markdown.
- **Paste**: freeform text.
- **URLs**: fetch, scrape main content, strip boilerplate.

**Ingestion pipeline**

- Extract text.
- Chunk and embed if needed for mapping.
- Semantic match chunks to Fields using labels and help text.
- Produce suggested values with confidence scores.
- Present a review list for new or conflicting values:
  - Accept all, accept per-field, or discard.
  - Log provenance for each accepted value.

**Section Notes**

- Summarize unmatched content by Section and append to Notes with a “From Source” tag.

Acceptance checks

- The prefill review shows which Source file or URL contributed each suggestion.
- Users can re-run prefill and select “merge” or “replace” for individual fields.

---

## 8) Artifact generation

**Definition**

- Each Blueprint contains one or more Artifact Generators. Example names: Test Plan, Recruitment Plan, Quote.

**Generation rules**

- Uses the Session’s field values and Section Notes as structured context.
- Uses a Prompt template that can reference fields by key and include instructions about tone, format, headings, and length.
- Output is stored as Markdown by default.

**History**

- Store every run as an Artifact version with:
  - Generator name
  - Timestamp and Member
  - Prompt template version and parameters
  - Session snapshot reference
  - Diff from prior version

**Regeneration**

- Editors can regenerate any artifact version. History is append-only.

Acceptance checks

- If required fields are missing, generation warns and offers to proceed or jump to missing fields.

---

## 9) Validation, completion, and quality signals

- Field-level required checks.
- Section completion is percent of required fields satisfied.
- Session completion requires all required fields satisfied.
- Prefill confidence shown as Low, Medium, High. Values below a threshold are flagged until reviewed.

---

## 10) Search and command palette

- Global search across:
  - Blueprints by name and Section titles
  - Sessions by name, fields, and notes
  - Artifacts by title and content
- Command palette actions:
  - Navigate to Section
  - Import Sources
  - Generate Artifact
  - Toggle preview
  - Share

Acceptance checks

- Search results show object type, title, and top matching snippet.

---

## 11) Data model overview

High level entities and relationships. Use your stack to implement.

- **Company**: id, name, branding.
- **Member**: id, company_id, role, name, email, auth_id.
- **Blueprint**: id, company_id, version, status, meta.
- **Section**: id, blueprint_id, order, title, description.
- **Field**: id, section_id, key, type, label, help, required, span.
- **BlueprintArtifactGenerator**: id, blueprint_id, name, description, prompt_template, output_format.
- **Session**: id, blueprint_id, blueprint_version, company_id, name, status, completion_percent, created_by.
- **SessionFieldValue**: id, session_id, field_id, value, source_provenance, confidence, reviewed.
- **SectionNote**: id, session_id, section_id, markdown, provenance_tags.
- **Source**: id, session_id, type, filename_or_url, text_extracted, created_by.
- **Artifact**: id, session_id, generator_id, version, title, markdown, prompt_template_hash, snapshot_ref, created_by, published_flag.
- **ShareLink**: id, artifact_id, created_by, expires_at, allow_source_upload.

---

## 12) Example Blueprint configuration (Beta Test Plan)

Use this as a seed object your app can serialize. Keep keys stable for prompts.

```json
{
  "blueprint": {
    "name": "Beta Test Plan",
    "version": 1,
    "sections": [
      {
        "title": "Project Overview",
        "description": "High level context for the beta.",
        "fields": [
          {
            "key": "project_name",
            "type": "ShortText",
            "label": "Project name",
            "required": true,
            "span": 1,
            "help": "Working title or code name"
          },
          {
            "key": "objective",
            "type": "LongText",
            "label": "Primary objectives",
            "required": true,
            "span": 2,
            "help": "What this beta must prove"
          },
          {
            "key": "success_criteria",
            "type": "LongText",
            "label": "Success criteria",
            "required": true,
            "span": 2,
            "help": "Measurable outcomes"
          },
          {
            "key": "is_public_beta",
            "type": "Toggle",
            "label": "Public beta",
            "required": false,
            "span": 1,
            "help": "Public vs private"
          }
        ]
      },
      {
        "title": "Participants",
        "description": "Who will participate and how many.",
        "fields": [
          {
            "key": "target_profile",
            "type": "LongText",
            "label": "Target profile",
            "required": true,
            "span": 2,
            "help": "Persona, segments, devices"
          },
          {
            "key": "recruitment_channels",
            "type": "LongText",
            "label": "Recruitment channels",
            "required": false,
            "span": 2,
            "help": "Email, panel, social"
          },
          {
            "key": "participant_count",
            "type": "ShortText",
            "label": "Participant count",
            "required": true,
            "span": 1,
            "help": "Number or range"
          }
        ]
      },
      {
        "title": "Product Details",
        "description": "What is being tested.",
        "fields": [
          {
            "key": "product_description",
            "type": "LongText",
            "label": "Product description",
            "required": true,
            "span": 2,
            "help": "What it does and for whom"
          },
          {
            "key": "key_features",
            "type": "LongText",
            "label": "Key features",
            "required": false,
            "span": 2,
            "help": "Bulleted list in Markdown"
          },
          {
            "key": "price",
            "type": "ShortText",
            "label": "Price",
            "required": false,
            "span": 1,
            "help": "List price or range"
          }
        ]
      },
      {
        "title": "Schedule",
        "description": "Timeline for the beta.",
        "fields": [
          {
            "key": "start_date",
            "type": "ShortText",
            "label": "Start date",
            "required": true,
            "span": 1,
            "help": "YYYY-MM-DD"
          },
          {
            "key": "end_date",
            "type": "ShortText",
            "label": "End date",
            "required": true,
            "span": 1,
            "help": "YYYY-MM-DD"
          },
          {
            "key": "milestones",
            "type": "LongText",
            "label": "Key milestones",
            "required": false,
            "span": 2,
            "help": "Bulleted list"
          }
        ]
      }
    ],
    "artifact_generators": [
      {
        "name": "Test Plan",
        "description": "Comprehensive beta test plan",
        "output_format": "Markdown",
        "prompt_template": "You are a senior beta program manager. Using the Session data and Section Notes, produce a clear test plan with these sections: Objectives, Scope, Participants, Environments, Schedule, Success Criteria, Risks, Communications, Reporting Cadence. Use concise headings and bullets. Where a field is missing, insert a short bracketed placeholder. Do not invent dates or metrics.\n\nSession fields:\n{{fields_json}}\n\nSection notes:\n{{notes_json}}"
      },
      {
        "name": "Recruitment Plan",
        "description": "Target profile and channels",
        "output_format": "Markdown",
        "prompt_template": "Create a recruitment plan using target_profile, participant_count, and recruitment_channels. Include sourcing tactics, screening summary, and timeline aligned to start_date."
      },
      {
        "name": "Executive Quote",
        "description": "Short summary for leadership",
        "output_format": "Markdown",
        "prompt_template": "Write a 120 word executive summary of the beta goals and timing. One paragraph, crisp tone."
      }
    ]
  }
}
```

Notes

- `{{fields_json}}` and `{{notes_json}}` are placeholders your generation layer will render with the Session snapshot.

---

## 13) Prompt templates for ingestion and mapping

Use structured prompts to keep results predictable.

**Source extraction to fields**

- System content: “You map input text to Blueprint fields by semantics. Return only JSON. Prefer exact text spans where possible. Do not infer values that are not present.”
- Template variables:
  - `fields_catalog` contains field keys, labels, and help text.
  - `source_text` is extracted text from files or pages.
- Expected JSON:

```json
{
  "suggestions": [
    {
      "field_key": "product_description",
      "value": "…",
      "confidence": 0.82,
      "provenance": { "source_id": "src_123", "offset": [120, 350] }
    }
  ],
  "unmapped_summary_by_section": {
    "Product Details": "…",
    "Schedule": "…"
  }
}
```

**Artifact generation**

- System content: “You write polished artifacts from structured context. Never fabricate missing facts. Use Markdown headings and bullets. Keep it concise and professional.”
- Template variables: `fields_json`, `notes_json`, optional `style_guide`.

---

## 14) Sharing and Data Room

- Each Artifact can be published to the Data Room.
- Share options:
  - Private link with optional expiry
  - Invite by email
  - Toggle to allow Viewer Source uploads to the specific Session
- Artifact viewing shows the version timeline and a “Regenerate” button for Editors.

Acceptance checks

- A Viewer opening the link cannot see Session fields unless explicitly allowed. They only see published Artifacts and the upload area if enabled.

---

## 15) Audit, history, and provenance

- Log all mutations: who, when, what object, before value, after value.
- Each Artifact stores a snapshot reference of the Session it was generated from.
- Prefill actions store links to Source IDs and offsets when available.

---

## 16) Nonfunctional requirements

- Autosave on every field change.
- Latency targets for UI interactions under 100 ms for local state changes.
- Large file handling with background extraction and progress UI.
- Markdown sanitized on render. No raw HTML from user input.
- Basic accessibility: keyboard navigation, focus states, ARIA labels.

---

## 17) MVP scope

Build now

- Companies, Members, simple auth.
- Blueprint builder with Sections and Field types: ShortText, LongText, Toggle. Column span 1 or 2.
- Sessions with left rail, center fields, right Notes, sticky footer, autosave.
- Sources: Upload files, Paste, URLs. Ingestion pipeline with review UI and provenance.
- Artifact Generators with prompt templates, generation, review pane, save with version history.
- Data Room share links. Basic Viewer role.
- Search and command palette for core actions.
- Dark mode theming and branding hooks.
- Storage in Neon Postgres for all entities and histories.

Defer to backlog

- Additional field types: Select, Multi-select, Number, Date, Repeating groups and table-like lists.
- Real exports to PDF or DOCX.
- Real-time multi-editor presence.
- Per-Blueprint granular ACLs.
- Field-level validation formats and masks.

---

## 18) Acceptance criteria by feature

**Blueprint builder**

- Can add, rename, reorder, and delete Sections and Fields.
- Field types limited to ShortText, LongText, Toggle with 1 or 2 column spans.
- Publish creates version 1, further edits create version 2, etc.

**Session**

- Left rail shows all Sections and accurate completion badges.
- Required field left empty prevents marking Session “Complete” and triggers inline error on Next.

**Import and prefill**

- Upload a PDF and paste a URL in the same Session. Both produce suggestions with distinct provenance tags.
- Rejecting a suggestion leaves the field unchanged and logs the decision.

**Artifacts**

- Running “Test Plan” produces Markdown with the required headings and bracketed placeholders where data is missing.
- Regenerating increments version and retains prior versions.

**Sharing**

- Creating a share link that expires in 7 days hides the underlying Session and shows only published Artifacts.
- Enabling “Viewers can upload Sources” displays the upload control to the Viewer and queues suggestions for Editor review.

---

## 19) Example UI copy

- Left rail badges: “Done”, “In progress”, “Required missing”.
- Prefill banner: “3 suggestions ready to review from PRD.pdf”.
- Artifact version label: “Recruitment Plan v3. Generated Oct 15, 2025 by Alex”.

---

## 20) Suggested event tracking

- `blueprint.published`
- `session.created`, `session.section.viewed`, `session.field.edited`, `session.completed`
- `source.added`, `source.prefill.suggestion.accepted|rejected`
- `artifact.generated`, `artifact.version.viewed`, `artifact.published`
- `share.link.created`, `viewer.source.uploaded`

---

## 21) Risks and mitigations

- **Overwriting user input**. Always require confirm to replace existing values during prefill.
- **Prompt drift**. Version prompt templates and hash them into Artifact history.
- **Scrape quality**. Strip boilerplate and show source provenance to build trust.
- **Scope creep on field types**. Start with three types and plan a clean extension path.

---

## 22) Implementation milestones for the agent

1. Data model, auth, Company and Member flows.
2. Blueprint builder with Sections and Fields.
3. Session shell and 3‑panel layout with autosave.
4. Sources ingestion and prefill review UI.
5. Artifact Generators and versioned Artifacts.
6. Data Room sharing, Viewer role, optional uploads.
7. Search and command palette.
8. Polishing, telemetry, validation, and accessibility.

---

## 23) Development Notes

- Must leverage and stick to the tech stack and rules described in CLAUDE.md

# AGENTS.md
## CaseDex™ — Legal Case Workspace SaaS
**Status:** Branding & Architecture LOCKED  
**Audience:** Codex agents, internal developers, future contributors

---

# 0. PROJECT IDENTITY (LOCKED)

## Product Name
- **CaseDex™**
- Use ™ on first prominent mention only.
- Do NOT use ® unless trademark registration is completed.

## What CaseDex Is
CaseDex is a **structured case workspace** for:
- advocates / lawyers
- judges (supportive, non-decision)
- clerks & assistants
- law students
- legal researchers

CaseDex helps users:
- organize cases
- track hearings
- maintain case diaries
- summarize hearings (AI-assisted, explainable)
- manage legal documents
- retain institutional memory

## What CaseDex Is NOT
- NOT an AI lawyer
- NOT a verdict predictor
- NOT a judge replacement
- NOT a legal advice generator
- NOT a litigation outcome engine

---

# 1. BRANDING & NAMING RULES (NON-NEGOTIABLE)

## Forbidden Names (NEVER USE)
The following names are permanently banned due to trademark or strategic risk:

- CaseDesk
- Lawtime / LawTime
- LawDesk
- Any CaseDesk spelling variants
- Any name implying:
  - verdict prediction
  - automated legal advice
  - AI judge / AI lawyer

These must NOT appear in:
- code
- UI
- docs
- comments
- test data
- examples
- domains

## Allowed Conceptual Language (Generic ONLY)
The following may be used as **lowercase concepts**, never as brands:

- desk
- workspace
- hub
- space
- board

### Correct:
- “your case desk”
- “return to workspace”
- “workspace overview”

### Incorrect:
- “CaseDesk”
- “CaseDex Desk”
- “Desk by CaseDex”

---

# 2. POSITIONING (CANONICAL)

Use only these or close paraphrases:

> “CaseDex is a structured case workspace for legal professionals and law students.”

> “CaseDex helps legal professionals organize, remember, and prepare cases with clarity.”

Never claim:
- legal advice
- outcome certainty
- judicial authority

---

# 3. TECH STACK (LOCKED)

## Backend
- Laravel 12+
- PHP 8.3+
- MySQL 8.0+
- Laravel Sanctum (SPA auth)
- Spatie Permission (RBAC)
- Redis + Horizon (queues)
- Laravel Scout (optional v2)
- Pest for testing

## Frontend
- Next.js (App Router)
- TypeScript (strict)
- TailwindCSS + shadcn/ui
- TanStack Query
- react-hook-form + Zod
- date-fns or dayjs (choose one)

## Infrastructure
- Docker + docker-compose
- MinIO (S3 compatible)
- Mailhog (local email)
- No secrets committed

---

# 4. REPOSITORY STRUCTURE

/backend
/frontend
/infra
/docs

Copy code

### Backend Domain Structure
app/Domain
Auth
Tenancy
Cases
Hearings
Diary
Documents
Notifications
Research
Ai

Copy code

Controllers MUST be thin.  
Business logic MUST live in Actions / Services.

---

# 5. MULTI-TENANCY (MANDATORY)

- Single DB, `tenant_id` everywhere
- Every query MUST scope by `tenant_id`
- No cross-tenant access — ever
- Policies must enforce tenant ownership

---

# 6. CORE MODULES (MVP)

### Required
- Tenancy & users
- Cases
- Hearings
- Diary
- Documents
- Notifications
- Research notes
- AI-assisted hearing summaries (editable)

### Explicitly Out of Scope (MVP)
- Billing
- Accounting
- CRM
- Outcome prediction
- Public case search

---

# 7. DATABASE RULES

- Use ULID/UUID for public IDs
- Index `(tenant_id, created_at)`
- Soft deletes for critical entities
- Enums for:
  - case status
  - hearing type
  - document type

---

# 8. API RULES

- Versioned: `/api/v1/*`
- Use API Resources everywhere
- Validation via Form Requests only
- Controllers = authorize → call service → return resource
- Cursor pagination for large datasets

---

# 9. SECURITY & COMPLIANCE

- Sanctum cookie auth
- CSRF enabled
- Rate limit auth endpoints
- Signed URLs for file downloads
- Audit logs for:
  - login
  - case changes
  - document upload/delete
  - hearing updates

---

# 10. QUEUES & JOBS

Anything slow MUST be async:
- OCR
- AI summaries
- notifications
- indexing

Jobs must be:
- idempotent
- retry-safe
- logged with tenant_id + entity_id

---

# 11. AI USAGE RULES (CRITICAL)

AI may ONLY:
- summarize provided content
- organize notes
- assist structure

AI must NEVER:
- give legal advice
- predict outcomes
- suggest verdicts
- override user input

All AI output must:
- show sources
- be editable
- be clearly labeled as “AI-assisted”

---

# 12. UI / UX RULES

- Case workspace is the home
- Structured prompts over blank editors
- Calm, neutral language
- No aggressive visuals
- Accessibility first (keyboard, labels)

---

# 13. DOMAIN & URL POLICY

Primary:
- casedex.app

Optional:
- getcasedex.app

Subdomains:
- api.casedex.app
- docs.casedex.app

Do NOT register or redirect from:
- casedesk.*
- lawtime.*

---

# 14. VISUAL BRANDING

- Prefer wordmark
- Neutral colors (blue, slate, gray)
- Avoid red as primary
- Avoid gavels, faces, violent symbolism

---

# 15. TESTING & QUALITY

Backend:
- Unit tests for services
- Feature tests for APIs
- Tenant isolation tests

Frontend:
- Type safety enforced
- Auth flow tested

CI must block merge on failure.

---

# 16. STOP CONDITIONS (IMPORTANT)

Codex MUST stop and request human input if:
- branding ambiguity arises
- AI feature risks legal interpretation
- multi-tenant boundary unclear
- new feature affects legal trust

Brand safety > speed.

---

# 17. DEFINITIONS OF DONE

A feature is DONE only if:
- API implemented & secured
- DB migration + indexes added
- UI integrated
- Errors handled
- Logs added
- Docs updated

---

# 18. CORE PRINCIPLE (MEMORIZE)

> CaseDex is a **system**, not a judge.  
> CaseDex assists memory, not decisions.  
> Trust > cleverness.  
> Clarity > hype.

# 19. PWA SUPPORT (REQUIRED)

CaseDex MUST support Progressive Web App (PWA) functionality.

## PWA Goals
- Installable web app
- Fast launch from home screen
- Reliable use in low-connectivity environments
- Push notifications for hearings and deadlines

## Required Capabilities
- Web App Manifest
- Service Worker
- Offline read-only access to:
  - case list
  - hearings
  - diary entries
  - documents metadata
- Push notification support (opt-in)

## Explicit Constraints
- No offline write or edit in MVP
- No offline AI/OCR processing
- No native app store dependency

## Frontend Responsibility
- PWA implemented entirely in frontend (Next.js)
- Backend remains API-only

## UX Rules
- Clear “Offline mode” indicator
- Graceful sync when connection returns
- Never block user with sync errors

PWA support is considered part of MVP completeness.

# 20. PUBLIC PAGES (REQUIRED)

Public-facing pages must exist for SEO and compliance:
- /about
- /features
- /pricing
- /security
- /privacy
- /terms

SEO defaults:
- robots.txt allowed for public pages only
- sitemap.xml includes all public pages

# UI THEME & HOMEPAGE SPEC (LOCKED)

## Visual Identity
- Tone: calm, institutional, modern (trust-first)
- Primary color: Deep Navy (single primary across app)
- Neutrals: slate/gray scale; backgrounds white/light-gray
- Accent: teal/indigo only for subtle highlights
- Avoid: red/orange as primary, neon, heavy gradients

## UI Stack
- Next.js + TypeScript
- TailwindCSS + shadcn/ui
- TanStack Query for API data
- Zod + react-hook-form for forms

## Global UI Rules
- Max width 1200–1280px on marketing pages
- App layout: left sidebar + top bar + content
- Consistent spacing scale: 4/8/12/16/24/32
- Cards: subtle border + soft shadow
- Tables: sticky header, hover rows, compact but readable
- Accessibility: keyboard nav, visible focus ring in primary color

## Homepage Layout (Must Match)
1) Hero: headline + subheadline + 2 CTAs
2) Product preview: screenshot/mock of case workspace
3) 3 pillars: Case Workspace / Hearings / Diary & Summaries
4) How it works (3 steps)
5) Who it’s for (advocates, assistants, students, legal teams)
6) Trust & safety (tenant isolation, audit logs, sources-first AI)
7) Final CTA + footer links (Privacy, Terms, Contact)

## Copy Rules
- Never claim: legal advice, verdict prediction, judge replacement
- Always emphasize: structure, memory, explainability, sources, review-before-save


# MVP WORKFLOW (MANDATORY)

CaseDex is CASE-CENTRIC.
- Case is the parent entity.
- Hearings, Diary Entries, Documents, and Participants MUST be linked to a Case.
- Global pages may exist, but must always route back to Case detail and must not create orphan records.

MVP must include:
- Client entity (case intake requires client details + story)
- Case detail page as the primary workspace
- Hearing reminder notifications 1 day before
- Case participants with roles per case
- Free plan limit: max 5 cases per tenant; uploads limited to pdf/jpg/png


# CaseDex Development Plan — Remaining Work

## Context

CaseDex is a legal case workspace SaaS. The **backend is ~90% complete** (all 8+ domain modules, 35 migrations, full API routes, auth, tenancy, policies). The **frontend is ~55% complete** — marketing pages, auth flow, API hooks, and i18n are done, but most **workspace pages are empty shells** lacking real UI. This plan covers building out the remaining frontend workspace pages and filling backend gaps.

---

## Current State Summary

### Backend — DONE
- All domain modules: Auth, Tenancy, Cases, Hearings, Diary, Documents, Notifications, Research, Clients, Courts
- 35 migrations, 23 controllers, 50+ form requests, 17 API resources, 12 policies
- Full CRUD API routes under `/api/v1/`
- Sanctum auth, tenant middleware, locale middleware

### Backend — TODO
- Permission/role seeding (Spatie roles & permissions)
- Comprehensive Pest tests
- AI-assisted summaries removed from MVP scope
- CORS configuration
- Custom exception handler

### Frontend — DONE
- All marketing pages (home, about, features, pricing, security, privacy, terms)
- Auth flow (login, register, forgot/reset password, setup/tenant creation)
- API hooks for ALL modules (cases, hearings, diary, documents, research, notifications)
- i18n (EN/BN), PWA scaffold, auth/admin guards

### Frontend — TODO (the bulk of this plan)
- Dashboard page (stats overview)
- Case detail page (the primary workspace)
- Hearings list + CRUD UI
- Diary entries list + CRUD UI
- Documents list + upload UI
- Research notes list + CRUD UI
- Notifications page
- Settings pages (profile editing, team management)
- Admin pages (courts management, admin login)
- Shared UI components (modals, file upload, pagination, search/filter)

---

## Implementation Phases

### Phase 1: Shared Components & Layout Polish
**Files to create/modify:**
- `frontend/components/ui/dialog.tsx` — Modal dialog (Radix)
- `frontend/components/ui/select.tsx` — Select dropdown
- `frontend/components/ui/textarea.tsx` — Textarea
- `frontend/components/ui/label.tsx` — Form label
- `frontend/components/ui/separator.tsx` — Visual separator
- `frontend/components/ui/skeleton.tsx` — Loading skeletons
- `frontend/components/ui/pagination.tsx` — Cursor pagination
- `frontend/components/ui/alert.tsx` — Alert/banner
- `frontend/components/ui/avatar.tsx` — User avatar
- `frontend/components/data-table.tsx` — Reusable data table with sorting/filtering
- `frontend/components/confirm-dialog.tsx` — Delete/action confirmation
- `frontend/components/file-upload.tsx` — Document upload (drag & drop)
- `frontend/components/status-badge.tsx` — Case/hearing status badges (reuse existing `status-pill` if suitable)
- `frontend/components/page-header.tsx` — Consistent page header with title + actions

**Reuse:** Existing `components/ui/` (button, card, table, tabs, toast, badge), `empty-state.tsx`, `court-select.tsx`, `language-switcher.tsx`

### Phase 2: Dashboard Page
**Files:**
- `frontend/app/(workspace)/dashboard/page.tsx`

**Content:**
- Welcome banner with user name + tenant
- Stat cards: total cases, upcoming hearings, recent diary entries, pending notifications
- Upcoming hearings list (next 7 days)
- Recent cases list
- Quick actions: "New Case", "New Hearing"
- Uses `useCases`, `useHearings`, `useNotifications` hooks

### Phase 3: Cases Module (Primary Workspace)
**Files:**
- `frontend/app/(workspace)/cases/page.tsx` — Case list with filters (status, search)
- `frontend/app/(workspace)/cases/new/page.tsx` — Already exists, verify completeness
- `frontend/app/(workspace)/cases/[publicId]/page.tsx` — Case detail (the core workspace page)
- `frontend/app/(workspace)/cases/[publicId]/edit/page.tsx` — Edit case form

**Case Detail Page — Tabbed Layout:**
- **Overview tab**: Case info, client, court, status, parties
- **Hearings tab**: List + add hearing inline/modal
- **Diary tab**: Timeline of diary entries + add entry
- **Documents tab**: Document list + upload
- **Research tab**: Research notes for this case
- **Participants tab**: Team members on case + add/remove

**Hooks to use:** `useCases`, `useCaseParticipants`, `useCaseParties`, `useHearings`, `useDiaryEntries`, `useDocuments`, `useResearchNotes` (all exist in `features/`)

### Phase 4: Hearings Module
**Files:**
- `frontend/app/(workspace)/hearings/page.tsx` — Global hearings list (all cases)
- Hearing create/edit modals (used from case detail and standalone)

**Features:**
- Calendar-style or table list of hearings
- Filter by case, date range, type
- Status indicators
- Link back to parent case

### Phase 5: Diary Module
**Files:**
- `frontend/app/(workspace)/diary/page.tsx` — Global diary entries

**Features:**
- Timeline/list view of diary entries across all cases
- Filter by case, date
- Inline create from case detail
- Markdown or rich text content

### Phase 6: Documents Module
**Files:**
- `frontend/app/(workspace)/documents/page.tsx` — Global documents list

**Features:**
- File list with type icons (PDF, JPG, PNG)
- Upload via drag-and-drop component
- Download via signed URL (backend already supports this)
- Filter by case, document type, category
- Free plan limit enforcement (pdf/jpg/png only)

### Phase 7: Research Notes Module
**Files:**
- `frontend/app/(workspace)/research/page.tsx` — Research notes list

**Features:**
- List/card view of research notes
- Create/edit with rich text
- Link to case
- Tag/filter support

### Phase 8: Notifications Module
**Files:**
- `frontend/app/(workspace)/notifications/page.tsx`

**Features:**
- Notification list with read/unread state
- Mark as read, bulk actions
- Links to related entities (cases, hearings)
- Hearing reminder display

### Phase 9: Settings Pages
**Files:**
- `frontend/app/(workspace)/settings/page.tsx` — Settings overview
- `frontend/app/(workspace)/settings/profile/page.tsx` — Edit profile (name, email, locale, password)
- `frontend/app/(workspace)/settings/team/page.tsx` — Team member management (admin only)

**Hooks to use:** `useUpdateProfile`, `useUsers`, `useCreateUser`, `useUpdateUser` (all exist)

### Phase 10: Admin Pages
**Files:**
- `frontend/app/(admin)/admin/page.tsx` — Admin dashboard (court stats)
- `frontend/app/(admin)/admin/login/page.tsx` — Admin login
- `frontend/app/(admin)/admin/courts/page.tsx` — Court CRUD management

**Hooks to use:** `useAdminCourts` (exists)

### Phase 11: Backend Gaps
- `backend/database/seeders/RolesAndPermissionsSeeder.php` — Seed Spatie roles/permissions
- `backend/config/cors.php` — CORS config for frontend origin
- `backend/app/Exceptions/Handler.php` — Custom API exception responses
- Update `DatabaseSeeder.php` to call role seeder

### Phase 12: Testing
- Backend: Pest feature tests for each API endpoint (auth, cases, hearings, diary, documents, research, notifications)
- Backend: Tenant isolation tests
- Frontend: Type-check (`tsc --noEmit`), lint, build verification

---

## Key Conventions to Follow

1. **i18n**: All user-facing strings via `t()` from `useLocale()` — add keys to `lib/i18n.ts`
2. **API calls**: Use existing hooks in `features/` — never raw fetch
3. **Forms**: `react-hook-form` + `zod` resolvers
4. **UI**: shadcn/ui components from `components/ui/` + Tailwind
5. **Tenant scoping**: Backend handles via middleware — frontend sends auth cookies
6. **Thin controllers**: Backend logic stays in Actions, not controllers
7. **Enums**: Use backend enums for status/type dropdowns
8. **Date formatting**: `date-fns` (already installed)
9. **Public IDs**: Always use `public_id` in URLs, never database `id`

---

## Verification Plan

1. `cd backend && php artisan migrate:fresh --seed` — verify migrations + seeders
2. `cd backend && php artisan test` — run Pest tests
3. `cd frontend && npm run build` — verify no TypeScript/build errors
4. `cd frontend && npm run lint` — verify lint passes
5. Manual flow: Register -> Setup Tenant -> Create Case -> Add Hearing -> Add Diary Entry -> Upload Document -> View Dashboard
6. Verify tenant isolation: two users see only their own data
7. Test i18n: switch EN/BN and verify all new pages translate
8. Test PWA: offline indicator shows when disconnected

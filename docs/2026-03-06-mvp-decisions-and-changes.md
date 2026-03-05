# CaseDex MVP Decisions & Change Log (2026-03-06)

## Decisions Taken

1. AI-assisted hearing summaries are removed from MVP scope.
2. MVP still includes PWA support, including push notification opt-in.
3. Public indexing is limited to marketing/compliance pages only.
4. Keep the current trust-first neutral visual language, with a polished primary color system (deep navy + subtle accent), not a full redesign.

## What Was Implemented

### Product / Scope Documentation
- Updated MVP scope and automation rules to reflect AI out-of-scope:
  - `AGENTS.md`
  - `docs/DEVELOPMENT_PLAN.md`

### PWA Push Notification Support (MVP)
- Added backend push subscription persistence and API:
  - Migration: `backend/database/migrations/2026_03_06_000001_create_push_subscriptions_table.php`
  - Model: `backend/app/Domain/Notifications/Models/PushSubscription.php`
  - Actions:
    - `UpsertPushSubscriptionAction.php`
    - `ListPushSubscriptionsAction.php`
    - `DeletePushSubscriptionAction.php`
  - Controller:
    - `backend/app/Http/Controllers/Api/V1/PushSubscriptionController.php`
  - Request/Resource/Policy:
    - `StorePushSubscriptionRequest.php`
    - `PushSubscriptionResource.php`
    - `PushSubscriptionPolicy.php`
  - Routes wired under `/api/v1/push-subscriptions` in `backend/routes/api.php`
  - Policy registration in `backend/app/Providers/AppServiceProvider.php`

- Added frontend push subscription flow:
  - Hook: `frontend/features/notifications/use-push-subscriptions.ts`
  - Settings UI controls (enable/disable): `frontend/app/(workspace)/settings/page.tsx`
  - Service worker push handlers: `frontend/public/sw.js`
  - Env note: `frontend/README.md` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

### SEO / Robots Compliance
- Updated robots rules to allow only public pages and disallow app/auth/admin/private paths:
  - `frontend/app/robots.ts`

### Tenant Name / i18n / UX Fixes
- Fixed workspace header tenant label to prefer `user.tenant.name` fallback chain:
  - `frontend/app/(workspace)/layout.tsx`
  - `frontend/features/auth/use-auth.ts`
- Fixed dashboard button translation key mismatch:
  - `frontend/app/(workspace)/dashboard/page.tsx`
- Removed sidebar offline hint message from workspace layout:
  - `frontend/app/(workspace)/layout.tsx`

### Visual Polish (Elegant, Trust-First)
- Added shared theme tokens and refined contrast:
  - `frontend/app/globals.css`
  - Added `--primary`, `--primary-hover`, `--accent`, `--accent-soft`
  - Improved muted text contrast
- Updated core UI components to use the unified primary system:
  - `frontend/components/ui/button.tsx`
  - `frontend/components/ui/input.tsx`
  - `frontend/components/ui/textarea.tsx`
  - `frontend/components/ui/select.tsx`
  - `frontend/components/ui/tabs.tsx`
  - `frontend/components/ui/badge.tsx`

### Quality / CI
- Added tenant-isolation tests:
  - `backend/tests/Feature/TenantIsolationTest.php`
- Added CI workflow:
  - `.github/workflows/ci.yml`

## Command Verification Run (Docker)

Executed in Docker Compose environment:

1. `php artisan migrate --force` in backend container: **PASS**
2. `pnpm build` in frontend container: **PASS**
3. `pnpm lint` in frontend container: **FAIL** (pre-existing lint issues in multiple files)
4. `php artisan test` in backend container: **PARTIAL FAIL**
   - Existing + new tests run
   - `TenantIsolationTest` currently fails due sqlite test DB path resolution (`casedex`) in containerized test runtime

## Follow-up Recommended

1. Resolve frontend lint errors (React hook `set-state-in-effect` rule and one Next link rule in existing files).
2. Normalize backend test DB runtime in container so sqlite `:memory:` is reliably applied for PHPUnit runs.
3. Keep CI enabled as merge gate once lint/test baseline is green.

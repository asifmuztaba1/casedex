# CaseDex Subscription System - Implementation Log (2026-03-06)

## Scope Implemented
- Replaced legacy plan model (`free`/`premium`) with trial + paid tiers:
  - `trial`, `starter`, `professional`, `chambers`
- Added 30-day trial tracking on tenants (`trial_ends_at`)
- Integrated Lemon Squeezy package foundation and billing domain services/actions
- Added tenant subscription middleware gating for workspace APIs
- Added billing API endpoints and frontend billing screens/hooks
- Removed free-plan case-count and file-type limits
- Added storage-based document upload enforcement

## Key Decisions
- **No read-only grace after trial**: enforced via `EnsureActiveSubscription` middleware.
- **Billing routes remain accessible after trial expiry**: `/api/v1/billing/*` excluded from subscription gate so users can recover access.
- **Single source of plan capabilities**: `PlanFeatureService` handles storage limits, feature flags, trial/subscription checks, and variant mapping.
- **Storage enforcement is backend-authoritative**: checked in `CreateDocumentAction` before write.
- **Frontend gating is supplemental**: subscription wall is UI-only; backend middleware is source of truth.
- **Lemon webhook state sync**: subscription created/updated/cancelled/expired/payment-failed listeners update tenant state and notify admins.

## Files Added
- `backend/config/billing.php`
- `backend/database/migrations/2026_03_06_150000_update_tenant_plan_and_trial_columns.php`
- `backend/app/Domain/Billing/Services/PlanFeatureService.php`
- `backend/app/Domain/Billing/Actions/*`
- `backend/app/Domain/Billing/Listeners/*`
- `backend/app/Http/Middleware/EnsureActiveSubscription.php`
- `backend/app/Http/Controllers/Api/V1/BillingController.php`
- `frontend/features/billing/types.ts`
- `frontend/features/billing/use-billing.ts`
- `frontend/components/subscription-wall.tsx`
- `frontend/components/storage-meter.tsx`
- `frontend/app/(workspace)/settings/billing/page.tsx`
- `backend/tests/Feature/Billing/*`

## Files Updated (Highlights)
- Tenant plan enum/model/factory/seeder/tenant creation flow
- Case creation action (removed 5-case free limit)
- Document request validation and upload action (removed mime tiering; added storage check)
- API route groups (billing routes + subscription middleware)
- Tenant resource/auth loading (subscription state exposure)
- Workspace layout/pricing/settings/case detail UI and i18n keys

## Operational Notes
- Docker verification is currently blocked in this environment by compose runtime constraints:
  - app service port conflict on host `8080`
  - compose run user mapping issue (`unable to find user php` with unset `WWWUSER`/`WWWGROUP`)
- Local runtime verification is also blocked here due missing toolchain:
  - PHP PDO extension unavailable on host shell
  - Node toolchain not installed (`npm`/`pnpm` not present)
- Static PHP syntax checks passed for backend code (`php -l` on app/config/migrations/routes/lang).

## Remaining Production Hardening
- Configure real Lemon variant IDs and signing secret in env.
- Validate webhook delivery end-to-end (`/lemon-squeezy/webhook`) in staging.
- Decide final public prices (frontend currently uses placeholder USD values).
- Add/extend integration tests once Docker env variables and user mapping are fixed.
- Run full CI (`php artisan test`, frontend build/typecheck) in a complete environment.

## Implementation Memory (Session Continuation)
This section records the follow-up debugging and behavior fixes after initial implementation.

### 1) Migration/Runtime Environment Reality
- There were multiple Docker stacks on the machine.
- The active app used by frontend was the `compose-*` stack (`compose-frontend-1` + `compose-backend-1`), not the standalone `backend/*` compose stack.
- Running migrations on the wrong stack led to apparent mismatch (code expected `trial_ends_at`, active DB did not have it yet).

### 2) Migration Incident and Fix
- Error observed: `Unknown column 'trial_ends_at' in field list` when creating tenant.
- Root cause: pending migration on active backend container.
- Secondary issue: MySQL enum strict order in `2026_03_06_150000_update_tenant_plan_and_trial_columns` caused failure when updating `free -> trial` before enum expansion.
- Fix applied:
  - Updated migration to first expand enum to include old + new values.
  - Then data mapping (`free`/`premium` -> new values).
  - Then final enum restriction.
- Migration completed successfully on active stack.

### 3) Tenant Context Runtime Incident and Fix
- Error observed: `Tenant context is not set` during firm creation.
- Root cause: `TenantResource` now includes `plan_limits`, and `PlanFeatureService::getStorageUsed()` queried `Document` with tenant global scope (which requires `TenantContext`) on non-tenant route `/api/v1/tenants`.
- Fix applied:
  - `PlanFeatureService::getStorageUsed()` now calls `Document::query()->withoutGlobalScopes()->where('tenant_id', ...)->sum('size')`.

### 4) Env Variable Naming Incident and Fix
- Wrong Lemon variant keys found in backend env:
  - `LEMON_SQUEEZY_VARIANT_*_PHYSIO` and other physio/project-specific names.
- These are not used by CaseDex billing config.
- Replaced with CaseDex keys:
  - `LEMON_SQUEEZY_STARTER_MONTHLY_VARIANT`
  - `LEMON_SQUEEZY_STARTER_YEARLY_VARIANT`
  - `LEMON_SQUEEZY_PROFESSIONAL_MONTHLY_VARIANT`
  - `LEMON_SQUEEZY_PROFESSIONAL_YEARLY_VARIANT`
  - `LEMON_SQUEEZY_CHAMBERS_MONTHLY_VARIANT`
  - `LEMON_SQUEEZY_CHAMBERS_YEARLY_VARIANT`
  - `LEMON_SQUEEZY_UNLIMITED_STORAGE_VARIANT`
- Cleared and rebuilt config cache in active backend container.

### 5) Onboarding Flow Decision and Fixes
- Requirement: after register/setup, user should select package + add payment details immediately; charge should start after trial ends.
- Flow change:
  - Setup success now routes to `/settings/billing?onboarding=1`.
  - Setup page now also redirects existing `tenant_id` users to same billing onboarding target (instead of dashboard).
- React warning fix:
  - `router.replace(...)` moved from render path to `useEffect` in setup page to avoid:
    - `Cannot update a component (Router) while rendering a different component (SetupPage)`.

### 6) Product/UX Enhancements Completed
- Elegant package feature presentation unified across:
  - Landing page
  - Pricing page
  - Workspace billing page
- Implemented shared plan catalog + reusable plan card component for consistency.

### 7) Billing Behavior Clarification
- Current app flow supports collecting payment details during trial.
- Actual delayed charging (no immediate charge before trial end) depends on Lemon Squeezy variant configuration:
  - variants must be set up as subscription plans with trial in Lemon dashboard.

### 8) Key Commits in This Continuation
- `9c5eb0e` - Fix tenant plan migration order for MySQL enum update
- `56e788e` - Fix tenant setup error by bypassing tenant scope in storage usage query
- `c0fdb92` - Enhance plan feature presentation across landing pricing and billing
- `232036b` - Route new tenants to billing package selection after setup
- `591e1d9` - Redirect setup-complete users to billing onboarding
- `8fa32f4` - Fix setup page redirect side effect (`useEffect` redirect)

### 9) Immediate Operator Checklist
- Fill all CaseDex Lemon variant env values in active backend `.env`.
- Set `LEMON_SQUEEZY_SIGNING_SECRET`.
- Ensure Lemon webhook points to active backend: `/lemon-squeezy/webhook`.
- Re-test register -> setup -> billing selection -> checkout (test mode).

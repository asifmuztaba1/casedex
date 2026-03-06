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

## Session Addendum (2026-03-06 Late Updates)

### A) Onboarding Flow Updated (Setup Removed From Main Path)
- Decision: `/setup` should not be part of registration onboarding anymore.
- Implemented flow:
  - Register page now collects user + country + plan + interval.
  - After submit, frontend creates user, creates minimal tenant silently, creates Lemon checkout, then redirects directly to payment.
  - No second country selection and no extra package re-selection step.
- Routing changes:
  - No-tenant redirects now use `/subscribe` (auto checkout bootstrap), not `/setup`.
  - `/setup` remains available as fallback page but is no longer primary onboarding.

### B) Post-Payment Redirect Loop Fix
- Issue: user returned to `/dashboard?billing=success` but got forced to `/settings/billing?onboarding=1`.
- Root cause: subscription status can lag briefly while webhook sync completes.
- Fixes:
  - `AuthGuard` now allows the dashboard success return path temporarily.
  - Dashboard performs short sync polling (`auth-me` + subscription refetch) before deciding final access.

### C) Webhook 404 Root Cause and Infrastructure Fix
- Observed in ngrok: repeated `POST /lemon-squeezy/webhook -> 404`.
- Root cause: nginx on `localhost:8080` forwarded `/` to Next.js, so webhook route never reached Laravel.
- Fix applied:
  - Added exact nginx route:
    - `location = /lemon-squeezy/webhook { proxy_pass http://backend:8000/lemon-squeezy/webhook; }`
  - Reloaded nginx container.
- Verification:
  - Requests to `/lemon-squeezy/webhook` now reach Laravel (no longer frontend 404).

### D) Webhook Security/Config Notes
- `LEMON_SQUEEZY_SIGNING_SECRET` must be set and match Lemon dashboard webhook signing secret.
- If signature header is missing/invalid, Laravel webhook middleware rejects request.
- Current access gating depends on actual subscription rows created by successful webhook processing.

### E) Why Dashboard Can Still Be Blocked
- Access check is strict:
  - `has_active_subscription` is derived from `tenant->subscribed()`.
  - Middleware `EnsureActiveSubscription` blocks workspace APIs when false.
- If webhook did not write a subscription record for that tenant, user remains blocked and routed to billing.

### F) Local Webhook Testing Runbook (Docker + ngrok)
1. Run app stack and ngrok to `localhost:8080`.
2. In Lemon dashboard, set webhook URL to:
   - `https://<ngrok-domain>/lemon-squeezy/webhook`
3. Ensure backend env has:
   - `LEMON_SQUEEZY_API_KEY`
   - `LEMON_SQUEEZY_STORE`
   - `LEMON_SQUEEZY_SIGNING_SECRET`
   - all CaseDex variant IDs
4. Restart backend and clear config cache:
   - `docker restart compose-backend-1`
   - `docker exec compose-backend-1 php artisan optimize:clear`
5. Resend webhook (or complete test checkout again).
6. Validate outcome:
   - `lemon_squeezy_subscriptions` has new row
   - `/api/v1/auth/me` returns `tenant.has_active_subscription = true`

### G) Current Known Gaps (Non-blocking to this doc update)
- Frontend typecheck still reports pre-existing `Badge` variant type mismatches in workspace files unrelated to webhook flow.
- `/setup` page exists as legacy fallback and can be removed later once fully unused.

## Session Addendum (2026-03-06 Manual MFS Billing)

### H) Manual MFS Billing Implemented (bKash/Rocket + Admin Approval)

#### Backend data model
- Added `manual_payment_methods` table (platform-managed receiver numbers/instructions).
- Added `manual_payment_requests` table with statuses:
  - `pending`, `approved`, `rejected`, `expired`.
- Added unique transaction enforcement:
  - `manual_payment_requests.transaction_id` unique.
- Enforced one active pending request per tenant at action layer:
  - rejects submit when tenant already has non-expired pending request.

#### Backend access control integration
- Kept middleware `subscription.active` unchanged.
- Updated decision logic in `PlanFeatureService::hasAccess()` to allow access when:
  - Lemon subscription is active, or
  - latest manual request is `pending` and `temporary_access_expires_at` is in future, or
  - latest manual request is `approved` and within approved window.
- Added auto-expiry transition:
  - pending request auto-transitions to `expired` when 24h window is past.
  - emits audit log + notifications on expiry.

#### Backend tenant APIs
Implemented under `auth:sanctum + tenant`:
- `GET /api/v1/billing/manual-methods`
  - Bangladesh-only availability via country code gate (`BD` from config).
- `POST /api/v1/billing/manual-request`
  - validates: plan/interval/amount/sender/transaction_id/sent_at/screenshot.
  - enforces exact configured amount.
- `GET /api/v1/billing/manual-request/status`
  - returns latest request state.

#### Backend admin APIs
Implemented under `auth:sanctum + platform`:
- `GET /api/v1/admin/manual-payments`
  - filters: status/date/tenant.
- `POST /api/v1/admin/manual-payments/{id}/approve`
- `POST /api/v1/admin/manual-payments/{id}/reject`
- `GET /api/v1/admin/manual-payments/{id}/screenshot`
- `GET/POST/PUT/DELETE /api/v1/admin/manual-payment-methods`
  - admin-editable receiver numbers/instructions.

#### Subscription payload extension
Added to billing/tenant responses:
- `billing_source` (`lemon` | `manual_mfs` | `none`)
- `manual_status`
- `temporary_access_expires_at`
- `has_workspace_access` (derived access state for frontend gating)

#### Notifications + audit
- Audit actions recorded for:
  - submit / approve / reject / expire
- In-app + email-channel notification records created for state changes.

### I) Frontend implementation

#### Billing UX for Bangladesh users
- Billing settings page now shows both options when eligible:
  - Lemon checkout
  - Manual bKash/Rocket submission
- Added manual section with:
  - receiver methods/instructions (EN/BN)
  - plan/interval exact amount view
  - sender number, transaction ID, sent time, screenshot upload
  - current request status + temporary-access countdown

#### Admin UX
- Added platform admin page:
  - `/admin/manual-payments`
- Supports:
  - review + approve/reject manual requests
  - screenshot preview/open
  - receiver method management (create/enable-disable/delete)
- Added admin navigation link for manual payments.

#### Types/hooks
- Extended billing types for manual state and method catalog.
- Added tenant hooks:
  - `useManualMethods`, `useManualRequestStatus`, `useSubmitManualRequest`
- Added admin hooks for list/review/method CRUD.

### J) Registration flow refinement
- Register page now supports Bangladesh method choice:
  - `Card checkout` (Lemon)
  - `bKash / Rocket` (manual)
- For manual selection:
  - register + tenant creation complete,
  - then redirect to billing onboarding with selected plan/interval for proof submission.

### K) Verification run results
- Migrations: **passed** on active docker stack.
  - `2026_03_06_170000_create_manual_payment_methods_table`
  - `2026_03_06_170100_create_manual_payment_requests_table`
- Frontend build (`pnpm build` in docker): **passed**.
- Backend route registration for manual endpoints: **confirmed**.
- Backend full test suite in current environment: **blocked by pre-existing test DB/migration setup mismatch**.
  - Default container env points DB to MySQL database name while PHPUnit forces SQLite.
  - Existing migration `ALTER TABLE ... MODIFY ... ENUM` is not SQLite-compatible.
  - This failure is infrastructure/migration compatibility debt not introduced by manual MFS code.

## Session Addendum (2026-03-06 Email Templates + Delivery Wiring)

### L) Unified Email Template Design
- Introduced a shared branded HTML email layout:
  - `backend/resources/views/emails/layouts/base.blade.php`
- Updated all existing mail views to use the shared visual shell while keeping distinct content per notification type:
  - Verify email
  - Password reset
  - Password changed
  - Team member invite
  - Hearing reminder
  - Case party added

### M) Mailable Rendering Upgrade
- Switched existing mailables from text-only rendering to HTML views:
  - `VerifyEmailMail`, `PasswordResetMail`, `PasswordChangedMail`, `TeamMemberInviteMail`, `HearingReminderMail`, `CasePartyAddedMail`.

### N) Email Delivery Started For Notification Channel
- Added new mailable:
  - `backend/app/Mail/CaseNotificationMail.php`
- Added new view:
  - `backend/resources/views/emails/case-notification.blade.php`
- Updated `DispatchCaseNotificationJob`:
  - if `channel = email`, send email to notification user
  - then mark notification sent
  - if email target missing, mark failed and log warning

### O) Billing Notification Delivery Wiring
- Billing manual/failed payment code paths were creating `CaseNotification` rows but not dispatching email jobs.
- Added `DispatchCaseNotificationJob::dispatch(...)` after notification creation in:
  - manual submit action
  - manual approve action
  - manual reject action
  - manual pending-expired handler
  - subscription payment failed listener

### P) Verification
- PHP syntax checks passed for updated backend files.
- Backend test suite passed in Docker with MySQL env override:
  - `14 passed`.

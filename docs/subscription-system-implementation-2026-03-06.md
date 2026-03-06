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

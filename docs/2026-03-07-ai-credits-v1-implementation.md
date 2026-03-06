# AI Credits System (v1) - Implementation Log

Date: 2026-03-07

## Scope
Implemented a tenant-shared AI credits foundation with async AI jobs, monthly free grants, paid top-ups, Lemon + Bangladesh MFS top-up paths, and billing UI integration.

## Delivered

### 1) Wallet + ledger backend
- Added tables:
  - `ai_credit_wallets`
  - `ai_credit_ledgers`
  - `ai_credit_packs`
  - `ai_alert_rules`
  - `ai_requests`
  - `ai_manual_payment_requests`
- Added immutable credit ledger model with event types:
  - `free_grant`, `purchase`, `consume`, `adjustment`, `expire`, `refund`
- Added `AiCreditService` with:
  - monthly free grant logic (no rollover)
  - consumption order: free first, then paid
  - transaction + row lock based updates
  - refund on execution failure
  - alert trigger checks

### 2) Async AI request lifecycle
- Added `AiRequest` model and statuses:
  - `queued`, `running`, `completed`, `failed`, `blocked_insufficient_credits`
- Added provider abstraction:
  - `AiProviderInterface`
  - `AiProviderFactory`
  - `OpenAiCompatibleProvider`
- Added queue execution:
  - `ProcessAiRequestJob`
  - credits are consumed at execution start
  - credits are refunded if execution fails after consumption

### 3) Scoped AI endpoints (v1 features)
Implemented tenant-auth APIs:
- `POST /api/v1/ai/hearing-summary`
- `POST /api/v1/ai/diary-summary`
- `POST /api/v1/ai/research-summary`
- `POST /api/v1/ai/document-qa`
- `GET /api/v1/ai/requests/{publicId}`

All enqueue endpoints require `idempotency_key` and run async.

### 4) Billing APIs for AI credits
Implemented tenant-auth APIs:
- `GET /api/v1/billing/ai-credits`
- `GET /api/v1/billing/ai-ledger`
- `POST /api/v1/billing/ai-credit-checkout`
- `POST /api/v1/billing/ai-mfs-request`
- `GET /api/v1/billing/ai-mfs-request/status`
- `GET /api/v1/billing/ai-analytics`
- `GET /api/v1/billing/ai-alert-rules`
- `POST /api/v1/billing/ai-alert-rules`

Also extended subscription/tenant payloads to include `ai_wallet` snapshot.

### 5) Lemon + MFS top-up integration
- Added Lemon order listener: `LemonOrderCreatedListener`.
  - detects AI pack by `variant_id`
  - credits paid balance on matching one-time order
- Added manual MFS request flow for AI packs:
  - submit action
  - platform admin approve/reject actions and API
  - approval credits wallet paid balance

Platform APIs:
- `GET /api/v1/admin/ai-manual-payments`
- `POST /api/v1/admin/ai-manual-payments/{publicId}/approve`
- `POST /api/v1/admin/ai-manual-payments/{publicId}/reject`
- `GET /api/v1/admin/ai-manual-payments/{publicId}/screenshot`

### 6) Frontend integration
- Added billing types/hooks for AI credits, ledger, checkout, MFS request/status, analytics, alert rules.
- Added AI Credits section in workspace billing page:
  - free/paid/total balances
  - next grant date
  - AI pack selector
  - Lemon purchase action
  - AI manual MFS submission form and status
  - recent ledger events
- Added AI action hooks:
  - `useAiHearingSummary`
  - `useAiDiarySummary`
  - `useAiResearchSummary`
  - `useAiDocumentQa`
  - `useAiRequestStatus`
- Added action-level AI entry points in case workspace (`/cases/[publicId]`):
  - hearing summarize button
  - diary rewrite button
  - petition/research summary button
  - document Q&A panel

### 7) Config + ops
- Added billing AI config block in `backend/config/billing.php`:
  - monthly free credits
  - per-feature fixed costs
  - three pack definitions
- Added AI env vars in `backend/.env.example`.
- Added service config `services.ai`.
- Added commands:
  - `php artisan ai:sync-credit-packs`
  - `php artisan ai:grant-monthly-credits`
- Scheduler updated to run monthly grant check daily.

## Validation

### Completed
- Docker migration run successfully for new AI tables.
- Route registration verified for new AI and AI billing/admin endpoints.
- PHP syntax checks passed for new/changed AI controllers/services/jobs.
- Frontend production build passed (`pnpm build`).

### Not fully verified
- Automated backend tests are currently blocked by test DB config (`sqlite` path issue in container test env), so AI feature tests were not executed yet.
- End-to-end webhook + queue flow for real provider credentials still needs manual QA.

## Open issues / next actions
1. Add dedicated backend feature tests for wallet concurrency, idempotency, refunds, and MFS AI approve/reject paths.
2. Add platform-admin UI pages for AI pack catalog and AI manual payment review (currently API-ready; UI minimal).
3. Add configurable feature-cost admin overrides in persistent storage (current v1 uses config/env defaults).
4. Add richer analytics visualization and CSV download UX in frontend (backend currently exposes structured analytics and CSV payload option).
5. Add localized i18n strings for newly introduced AI billing and action UI labels.
6. Validate AI provider configuration and queue worker readiness in staging before production rollout.

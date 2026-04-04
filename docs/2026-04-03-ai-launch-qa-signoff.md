# CaseDex AI Launch QA Sign-Off

Date: 2026-04-03

## Purpose

This runbook turns the AI launch plan into a repeatable QA flow with two lanes:

- Local Docker smoke lane for fast backend confidence.
- Beta or staging sign-off lane for real customer-facing checks.

Use this together with:

- [AI feature smoke tests](../backend/tests/Feature/Ai/AiApiWorkflowTest.php)
- [AI manual payment flow tests](../backend/tests/Feature/Ai/AiManualPaymentFlowTest.php)
- [AI API QA requests](../backend/ai_qa.http)
- [AI sign-off sheet template](./ai-launch-signoff-template.csv)

## Local Docker Smoke Lane

Run every command from Docker containers.

### 1. Capture the runtime snapshot

Run this from the repo root:

```bash
docker compose -f /Users/asif/projects/casedex/infra/compose/docker-compose.yml exec -T backend php artisan tinker --execute="dump([
  'ai_driver' => config('services.ai.driver'),
  'ai_base_url' => config('services.ai.base_url'),
  'ai_gemini_base_url' => config('services.ai.gemini_base_url'),
  'ai_model' => config('services.ai.model'),
  'ai_gemini_model' => config('services.ai.gemini_model'),
  'ai_api_key_present' => filled(config('services.ai.api_key')),
  'queue_default' => config('queue.default'),
  'filesystem_default' => config('filesystems.default'),
  'ai_credit_pack_count' => \App\Domain\Ai\Models\AiCreditPack::query()->count(),
  'active_manual_method_count' => \App\Domain\Billing\Models\ManualPaymentMethod::query()->where('active', true)->count(),
  'demo_users' => \App\Models\User::query()->whereIn('email', [
    'platform.admin@casedex.app',
    'admin@demo.casedex.app',
    'lawyer@demo.casedex.app',
  ])->pluck('email')->values()->all(),
]);"
```

Readiness rules:

- `ai_api_key_present` must be `true`.
- The active driver must have a matching URL and model configured.
- `ai_credit_pack_count` must be greater than `0`.
- `active_manual_method_count` must be greater than `0`.
- All three demo users should be present locally.

Queue note:

- If `queue_default` is `database`, AI jobs need a database worker.
- If `queue_default` is `redis`, AI jobs need Horizon or a Redis worker.
- If the backend dispatches to one queue backend and the worker consumes another, AI requests will stay stuck in `queued`.

### 2. Run the automated AI smoke suite

```bash
docker compose -f /Users/asif/projects/casedex/infra/compose/docker-compose.yml exec -T backend php artisan test tests/Feature/Ai
```

What this covers:

- hearing summary happy path
- diary rewrite happy path
- research summary happy path
- document Q&A happy path
- idempotency
- insufficient credit block
- provider failure and refund
- AI credit catalog visibility
- AI manual payment create, approve, reject, screenshot review, and platform-role enforcement

### 3. Log blockers immediately

Treat these as Severity 0 blockers in local smoke:

- missing AI API key
- unsupported or inconsistent provider config
- AI requests never reaching `completed`, `failed`, or `blocked_insufficient_credits`
- credit deductions or refunds not matching the request lifecycle
- AI manual payment approval not increasing the wallet
- non-platform users reaching admin AI payment endpoints

## Beta or Staging Sign-Off Lane

Use a launch-like environment with the real provider credentials and real queue processing.

### Customer flow checks

Run these with a subscribed tenant admin account:

1. Sign in and confirm AI entry points appear only in permitted places.
2. Run hearing summary with English hearing notes.
3. Run diary rewrite with English notes.
4. Run research summary with longer petition or research text.
5. Run document Q&A from a real uploaded document.
6. Repeat hearing summary and document Q&A with Bangla or mixed Bangla/English input.
7. Confirm outputs are non-empty, legible, and appropriate for the feature.

### Billing and wallet checks

1. Open billing and confirm current balance, pack catalog, and current request status are visible.
2. Submit one AI MFS payment request with screenshot proof.
3. Confirm the customer sees a pending state after submit.
4. Approve the request through the admin API runbook below and confirm the wallet increases.
5. Submit a second request and reject it through the admin API runbook below.
6. Confirm the rejected state is visible and no credits are added.

### Permission checks

Verify these roles separately:

- `admin@demo.casedex.app` can use tenant AI features and see tenant billing.
- `lawyer@demo.casedex.app` can use allowed tenant AI features but cannot review admin AI payments.
- `platform.admin@casedex.app` can review AI manual payments through the admin API path.

### Browser and device checks

Verify at least:

- one desktop browser
- one mobile viewport

Focus pages:

- case detail AI actions
- billing AI credits section
- AI manual payment status view

## Temporary Admin AI Manual Payment Review Runbook

Until there is a platform-admin UI for AI manual payment review, use the API path in [ai_qa.http](../backend/ai_qa.http).

Required review actions:

1. List pending AI manual payments.
2. Open the screenshot download URL for the target request.
3. Approve or reject the request.
4. Confirm the tenant wallet changes only on approval.

Recommended review evidence:

- screenshot of pending request
- screenshot proof file
- approval or rejection response body
- tenant wallet balance after review

## Exit Criteria

AI launch sign-off is granted only if:

- the runtime snapshot is valid
- the Docker AI smoke suite passes
- all four AI features pass in beta or staging
- one AI manual payment approval passes
- one AI manual payment rejection passes
- English and Bangla sanity checks pass
- no Severity 0 or Severity 1 issues remain open

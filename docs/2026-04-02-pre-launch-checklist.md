# CaseDex Pre-Launch Checklist

Date: 2026-04-02

## Decision Locked

- AI is in scope for launch.
- The current backend is on Laravel 12, not Laravel 13.
- Launch mode is a private beta with selected firms.
- Launch market is Bangladesh first.
- Payment path on launch day is MFS only.
- English and Bangla both matter on day one.
- All current AI features are intended to be launch features.
- Manual payment review must be operational on day one.
- Optimization target is trust / quality first, plus stronger visual competitiveness.
- Target launch window is the next 7 days.
- We will do the full Laravel 13 upgrade before beta launch.

## Current Baseline

- Core product flows exist: marketing, auth, onboarding, workspace, billing, admin.
- Docker stack is running and the app is usable.
- Frontend production build passes.
- Frontend lint still fails.
- Backend test suite still fails in the current Docker / local test setup.
- Public trust content is not fully ready yet: pricing, legal copy, and a few visible UX trust issues still need work.

## Specific 7-Day Task List

### Day 1: Laravel 13 upgrade and backend stabilization

- Upgrade `laravel/framework` to `^13.0`.
- Upgrade related dependencies required by the official guide:
  - `laravel/boost:^2.0`
  - `laravel/tinker:^3.0`
  - `phpunit/phpunit:^12.0`
- Review Laravel 13 request forgery changes in `bootstrap/app.php`.
- Explicitly set `CACHE_PREFIX`, `REDIS_PREFIX`, and `SESSION_COOKIE` so behavior does not drift after upgrade.
- Rebuild Docker images and verify the app boots cleanly after the framework upgrade.
- Fix the backend test bootstrap so feature tests can run reliably in Docker.

### Day 2: Beta launch mode cleanup

- Convert the product from "public paid launch" assumptions to "private beta with selected firms".
- Hide or remove Lemon checkout from user-facing launch flows.
- Keep MFS as the visible launch payment path.
- Verify the admin manual payment review flow is complete and usable on day one.
- Update public copy so the app does not imply open public self-serve launch if we are still invite-led.

### Day 3: Pricing, legal, and trust copy

- Insert the final plan price values into the frontend.
- Write the final privacy policy.
- Write the final terms of service.
- Review security / trust copy so every claim matches real behavior.
- Remove outdated "AI out of MVP" language from docs and UI copy.

### Day 4: UX trust fixes and launch-critical bug cleanup

- Remove or implement fake search and filter controls.
- Fix broken or corrupted Bangla strings.
- Fix visible broken states, misleading buttons, and dead-end flows.
- Make sure notifications, billing states, and admin review statuses are understandable.

### Day 5: Visual polish for private beta competitiveness

- Improve the marketing homepage hero and first impression.
- Add stronger product proof with real screenshots or richer in-product previews.
- Polish register, onboarding, billing, and admin pages so they feel more premium.
- Tighten dashboard and case detail hierarchy to reduce the "internal tool" feel.

### Day 6: AI launch polish and QA

- Choose the launch AI provider.
- Clarify AI feature availability, credit usage, limits, and failure states.
- Use the AI runbook in [2026-04-03-ai-launch-qa-signoff.md](./2026-04-03-ai-launch-qa-signoff.md) and log results in [ai-launch-signoff-template.csv](./ai-launch-signoff-template.csv).
- Test all AI launch features:
  - hearing summary
  - diary rewrite
  - petition / research summary
  - document Q&A
  - AI credits top-up
- Verify AI behavior in both English and Bangla contexts where applicable.

### Day 7: Final beta hardening and go / no-go review

- Run end-to-end QA:
  - register
  - verify email
  - onboarding
  - MFS payment
  - workspace access
  - case creation
  - hearing / diary / document flows
  - AI flows
- Fix remaining frontend lint errors that affect launch-critical pages.
- Run the critical backend release suite:
  - auth
  - tenant isolation
  - billing / MFS
  - notifications
  - onboarding / payment
- Lock production / beta environment settings:
  - `APP_KEY`
  - mail
  - queue workers
  - scheduler
  - storage
  - monitoring on `/up`
- Write beta launch ops notes:
  - who reviews manual payments
  - expected response time
  - who handles support issues
  - rollback steps if launch day issues appear

## Remaining Open Inputs

These are the only answers still missing or not concrete enough for implementation:

1. Exact final price values for:
   - Starter monthly / yearly
   - Professional monthly / yearly
   - Chambers monthly / yearly

2. AI provider choice.
   - Recommended default for fastest beta: OpenAI only.
   - If we want fallback routing, define the fallback provider now.

3. Private beta access model.
   - Open signup with manual approval,
   - invite-only accounts,
   - or direct onboarding only for pre-selected firms.

## Laravel 13 Review

## Current Situation

- `backend/composer.json` is currently on `laravel/framework:^12.0`.
- Laravel 13 is officially documented with release date March 17, 2026.
- Laravel 12 is still supported, with bug fixes until August 13, 2026 and security fixes until February 24, 2027, so upgrading to 13 is not mandatory to launch safely.

## Recommendation

- Full Laravel 13 upgrade is now part of the pre-launch plan by decision.
- Because launch is only 7 days away, the upgrade must be handled as the first critical-path item.
- We should not mix the upgrade with broad refactors; keep it focused on framework compatibility, security, test stability, and deployment hardening.

## How Laravel 13 Can Help Before Launch

### High value, low-to-medium risk

- Upgrade guidance is now official and relatively small in scope.
  - Laravel's upgrade guide estimates about 10 minutes in a normal app, but our real app risk is higher because we still have failing tests and billing / onboarding complexity.

- Stronger request forgery protection.
  - Laravel 13 formalizes `PreventRequestForgery` with origin-aware verification.
  - This is useful for a session-auth app like CaseDex, especially around authenticated workspace and billing actions.

- Better deployment discipline.
  - The Laravel 13 deployment docs emphasize `php artisan optimize`, cached config / routes / views / events, `php artisan reload`, and health route monitoring.
  - These are directly useful for launch hardening.
  - CaseDex already has the built-in `/up` health route configured in `backend/bootstrap/app.php`, so the immediate work is operationalizing it with monitoring and deploy scripts, not inventing a new health endpoint.

- Queue routing by class.
  - This could help us centralize queue routing for Horizon / AI / notifications jobs and reduce queue configuration drift.

### Useful, but probably not before launch

- Laravel AI SDK.
  - Since AI is in scope, this is the biggest long-term Laravel 13 feature for CaseDex.
  - It could simplify provider-agnostic AI, embeddings, and future vector / semantic search work.
  - I would not migrate our current AI implementation to the new SDK right before launch unless we choose that as a focused initiative.

- JSON:API resources.
  - Helpful if we want stricter API consistency.
  - Not worth introducing as a pre-launch refactor unless API client churn is already hurting us.

- Expanded PHP attributes.
  - Nice cleanup for controllers, policies, and jobs.
  - Good post-launch cleanup, not a launch blocker.

## Laravel 13 Upgrade Risk Notes

- The upgrade guide calls out request forgery protection as a high-impact area.
- Cache behavior changes matter if we rely on framework defaults for cache / Redis / session prefixes.
- The new cache `serializable_classes` hardening is good for security, but it needs review if we store PHP objects in cache.
- The official upgrade path also expects dependency bumps such as `laravel/boost:^2.0`, `laravel/tinker:^3.0`, and modern test tooling versions.
- We should only upgrade after the backend test environment is fixed and the critical release paths are covered.

## Practical Call

Given the final decision:

- do the Laravel 13 upgrade first,
- stabilize Docker boot, tests, cache/session behavior, and request forgery configuration immediately after,
- then continue with pricing, trust copy, UX fixes, and beta polish,
- and avoid any additional deep backend refactor beyond what the upgrade requires.

## Official Laravel References

- Release notes: https://laravel.com/docs/13.x/releases
- Upgrade guide: https://laravel.com/docs/13.x/upgrade
- Deployment: https://laravel.com/docs/13.x/deployment
- CSRF protection: https://laravel.com/docs/13.x/csrf
- Starter kits: https://laravel.com/starter-kits

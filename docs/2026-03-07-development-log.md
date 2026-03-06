# CaseDex™ Development Log (Post-2026-03-06)

## Context and Scope
This log captures engineering work completed after the existing 2026-03-06 documentation set, based on the current working tree state (modified + new files), runtime checks, and user-reported incidents handled during this session.

Reference baseline docs:
- `docs/subscription-system-implementation-2026-03-06.md`
- `docs/2026-03-06-mvp-decisions-and-changes.md`

This document focuses on deltas only.

## Chronology Summary
- **2026-03-06 to 2026-03-07**: Billing and onboarding flows moved from iterative fixes to a staged architecture.
- **Primary theme**: reduce onboarding friction, support Bangladesh MFS payment path, harden verification/redirect behavior, and close correctness gaps (roles, notifications, access checks).

---

## Delivered Changes by Subsystem

### 1) Onboarding Flow Redesign
**Problem observed**
- Registration/setup/billing had repeated redirects and step loops.
- Legacy `/setup` behavior caused route churn and UX confusion.
- Users wanted clear stage-based onboarding, not a mixed page.

**Decision taken**
- Introduce explicit staged onboarding routes and resume behavior:
  - `/onboarding/account`
  - `/onboarding/plan`
  - `/onboarding/payment`
- Keep `/setup` and `/subscribe` as compatibility redirects into onboarding.

**Implementation outcome**
- Added new onboarding route pages and a shared shell component.
- Added local draft persistence for onboarding state (`plan`, `interval`, `payment_source`) keyed by user email.
- Updated register/login/setup/subscribe redirect behavior to use onboarding-first flow.
- Added safer fallback rendering on `/onboarding/payment` to prevent blank page returns when state is incomplete.

**User-facing effect**
- Users progress in ordered steps and can resume after interruption.
- Fewer forced loops to billing pages during account creation.

---

### 2) Email Verification Route Hardening
**Problem observed**
- Verification links were generated/used inconsistently (old `/api/v1/...` links and host/port mismatch incidents).
- Signed verification URLs could fail under proxy host normalization.

**Decision taken**
- Promote verification to clean web route:
  - `/verify-email/{id}/{hash}`
- Redirect verification completion to onboarding account stage:
  - `/onboarding/account?verified=1`
- Preserve API verification route as fallback compatibility path.

**Implementation outcome**
- Added web verification route and changed verification URL generation source.
- Updated verification redirect destination.
- Fixed Nginx host forwarding to preserve signed URL validity.

**User-facing effect**
- Verification links are cleaner and more stable.
- Verified users return directly to onboarding continuation instead of generic login flow.

---

### 3) Billing Behavior (Lemon vs MFS)
**Problem observed**
- Bangladesh manual payment flow previously redirected users to workspace billing page, breaking onboarding continuity.
- “Upgrade” and checkout state transitions had errors when subscription source was manual vs Lemon.

**Decision taken**
- Keep Lemon as external checkout redirect.
- For MFS, use onboarding-owned submission path with immediate proof capture UX.
- Preserve middleware enforcement model (`subscription.active`) and centralize access decisions in billing services.

**Implementation outcome**
- Manual MFS domain + APIs integrated (methods, submit request, status, admin review).
- Temporary access logic retained (pending manual request window).
- Manual payment request submission available in onboarding payment stage (modal flow), not only workspace billing.
- Billing state payloads include manual-source metadata.

**User-facing effect**
- Bangladesh users can choose MFS and submit proof during onboarding.
- Lemon users continue through secure hosted checkout.

---

### 4) Admin / Account Role Corrections
**Problem observed**
- Platform admin account could drift into tenant-admin context and fail platform guard checks.

**Decision taken**
- Enforce platform-role integrity and prevent tenant creation path from mutating platform users.

**Implementation outcome**
- Guard added in tenant creation action for platform roles.
- Localized message keys added for blocked platform-user tenant creation.
- Seed/runtime account corrections applied during incident handling.

**User-facing effect**
- Platform admins can reliably access admin console and are protected from accidental tenant-role downgrade.

---

### 5) Notification Behavior Fixes
**Problem observed**
- Duplicate “Manual payment submitted” items appeared in notification dropdown.

**Decision taken**
- Treat bell dropdown as user-specific in-app stream only.

**Implementation outcome**
- Notification listing now filters by:
  - authenticated `user_id`
  - `channel = in_app`
- Controller signature updated to pass actor user id to listing action.

**User-facing effect**
- Reduced duplicate rows in notification UI.
- Notification feed reflects user-targeted, in-app records only.

---

### 6) Email Delivery and Template System Upgrade
**Problem observed**
- Billing and operational notifications were not consistently sent for email channel records.
- Email presentation was inconsistent across message types.

**Decision taken**
- Standardize email shell and route notification-email records through a common mail flow.

**Implementation outcome**
- Added shared email layout and refreshed existing templates.
- Added `CaseNotificationMail` and delivery wiring in `DispatchCaseNotificationJob`.
- Billing/manual/payment-failed paths dispatch notification jobs after record creation.

**User-facing effect**
- Consistent email UI and improved reliability for billing-related email notifications.

---

### 7) UI/UX Updates
**Problem observed**
- Payment selection and plan presentation were not clear enough.
- Stakeholders required demo account accessibility from login UIs.

**Decision taken**
- Increase plan distinction and checkout clarity.
- Add demo login affordances.

**Implementation outcome**
- Plan cards, trial notices, and bilingual copy improved on landing/pricing/billing/register.
- Demo account widgets added in login/admin login flows.
- Onboarding shell added to provide stronger stage context.

**User-facing effect**
- Clearer trial/payment expectations and faster trial exploration via demo accounts.

---

## Infra and Config Updates

### APP/Frontend URL defaults
- Updated `.env.example` to include explicit local URLs with port:
  - `APP_URL=http://localhost:8080`
  - `FRONTEND_URL=http://localhost:8080`

### Nginx proxy behavior
- Added explicit `/verify-email/` proxy route to backend.
- Updated proxy host forwarding to preserve full host/port for signed URL validation.

---

## API / Interface Impacts

### Route behavior changes
- Added clean verification route:
  - `GET /verify-email/{id}/{hash}`
- Existing compatibility route retained:
  - `GET /api/v1/auth/verify-email/{id}/{hash}`
- Onboarding route family introduced:
  - `/onboarding`, `/onboarding/account`, `/onboarding/plan`, `/onboarding/payment`

### Response shape / semantics
- Auth user payload now includes `email_verified_at` for client step gating.
- Billing/tenant subscription payloads include manual billing fields (already introduced in prior session, continued in this cycle):
  - `billing_source`
  - `manual_status`
  - `temporary_access_expires_at`
- Notifications list semantics tightened to user-specific in-app stream.

### Frontend contracts
- New onboarding draft persistence model used by onboarding pages:
  - `plan`, `interval`, `payment_source`

---

## Validation Status

### Verified during this cycle
- Multiple frontend production builds passed in Docker (`pnpm build`).
- Verification route signature behavior tested after proxy fix:
  - expected 302 to `/onboarding/account?verified=1`.
- Runtime checks performed for account role corrections and mail link generation.

### Not fully closed by automated suite
- Backend full test execution still has environment debt in some runs (SQLite path/config assumptions in this local setup).
- End-to-end production-like external webhook validation remains environment dependent (local tunnel/provider config).

---

## Known Issues and Next Actions

1) **Onboarding + MFS modal path needs full UX QA pass**
- Run scripted QA for: register -> verify -> plan -> payment (Lemon and MFS branches), including refresh/back behavior and error recovery.

2) **Notification de-dup regression guard needed**
- Add feature test asserting `/api/v1/notifications` returns only actor’s `in_app` records to prevent reintroduction of duplicate display behavior.

3) **Backend test environment consistency**
- Normalize local test DB strategy (MySQL vs SQLite) and update test bootstrap so feature tests do not fail on missing SQLite path in this Docker context.

4) **Platform role + permission alignment**
- Ensure platform roles used by enum and any role package layer remain aligned in seed/migrations to avoid future “platform account not recognized” incidents.

5) **Webhook and billing observability**
- Add explicit operational checklist in docs for local and staging webhook validation (endpoint, signing secret, expected subscription row state, post-payment access checks).

---

## Notes on Source-of-Truth Coverage
This log was compiled against current changed-file inventory (tracked modifications + untracked additions), including backend billing/admin/manual-payment domain additions, onboarding route additions, auth/billing/notification interface changes, email template system updates, and proxy configuration updates.

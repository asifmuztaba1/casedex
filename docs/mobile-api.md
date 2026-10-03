# CaseDex Mobile API

How a native iOS or Android app talks to the CaseDex backend. The mobile app
uses **the same `/api/v1` endpoints as the web app**; only sign-in differs. The
web app uses cookie sessions, and the mobile app uses a Bearer token per device.

- Base URL: `https://api.casedex.app/api/v1` (local: `http://localhost:8080/api/v1`)
- Format: JSON. Send `Accept: application/json` on every request.
- Language: send `X-Locale: bn` or `X-Locale: en`. Validation messages and
  notification text follow it, and dates in responses are ISO 8601.
- Machine-readable spec: [`docs/openapi.json`](openapi.json) (OpenAPI 3.1,
  generated from the code). Use it to generate a typed client, e.g. with
  openapi-generator for Dart, Kotlin or Swift. In local development the same
  spec is browsable at `http://localhost:8000/docs/api`.

## 1. Signing in

### Sign in

```http
POST /mobile/login
Content-Type: application/json

{
  "email": "rahim@example.com",
  "password": "••••••••",
  "device_name": "Rahim's Pixel 8",
  "platform": "android"
}
```

`platform` is `ios` or `android`. `device_name` is shown in the user's device
list. A successful sign-in returns `200`:

```json
{
  "data": {
    "token": "12|q8Yb…",
    "token_type": "Bearer",
    "expires_at": "2026-12-02T08:00:00.000000Z",
    "device": { "public_id": "01J…", "name": "Rahim's Pixel 8", "platform": "android", "push_enabled": false },
    "user": { "public_id": "01J…", "name": "Rahim Uddin", "tenant_public_id": "01J…", "role": "admin", "locale": "bn", "tenant": { "…": "…" } }
  }
}
```

Store `token` in the Keychain (iOS) or EncryptedSharedPreferences/Keystore
(Android). It is shown once and cannot be fetched again. Send it on every
request:

```http
Authorization: Bearer 12|q8Yb…
```

Failures:

| Status | Meaning |
|---|---|
| `422` | Wrong email or password, or a missing or invalid field (`errors` lists the fields) |
| `403` | Platform staff account. Those accounts use the web console only |
| `429` | Too many attempts (10 per minute per IP). Wait and retry |

### Create an account

`POST /mobile/register` takes `name`, `email`, `password`,
`password_confirmation`, `country_id` (from `GET /countries`), and an optional
`locale`, plus `device_name` and `platform`. During the private beta it also
needs `invite_code`: call `GET /auth/registration` first, and show the field when
`mode` is `invite`. An invalid, expired or used-up code returns `422` on
`invite_code`. It returns `201` with the same
body as sign-in. The new user has no workspace yet (`tenant_public_id: null`).
See section 3.

Password reset (`POST /auth/forgot-password`, `POST /auth/reset-password`) and
email verification work the same as on the web; the links open the website.

### Keep the token fresh

Tokens expire after 60 days (`expires_at`). When fewer than 7 days remain, or
on app start, call:

```http
POST /mobile/token/refresh
Authorization: Bearer <current token>
```

The response has the same shape as sign-in. Replace the stored token with the
new one. The old token stops working immediately, and the push registration
carries over.

### Sign out

```http
POST /mobile/logout          → 204
```

This revokes the token and removes the device's push registration. Delete the
stored token afterwards.

### Devices

| Request | Purpose |
|---|---|
| `GET /mobile/devices` | The user's signed-in devices: `public_id`, `name`, `platform`, `push_enabled`, `is_current`, `last_used_at`, `expires_at` |
| `DELETE /mobile/devices/{public_id}` | Sign out another device, e.g. a lost phone (`204`) |

`DELETE /devices` signs out every other device and returns `{"data": {"revoked": n}}`.
`GET /devices` and `DELETE /devices/{public_id}` are the same lists and actions,
available to both the app and the web app; the web Settings page uses them to
sign out a lost phone. The `/mobile/devices` and `/mobile/push-token` routes
accept only Bearer tokens, so a browser session gets `403` there.

**Password changes sign phones out.** A password reset, a password change in
the profile, or an admin setting a member's password revokes every device
token, except the device that made the change. The app then gets `401` and
should show sign-in.

### Deleting the account

Both app stores require apps that create accounts to offer deletion in the
app. CaseDex uses a 30-day grace period:

| Request | Result |
|---|---|
| `GET /account/deletion` | `{can_delete, blocked_reason, workspace_will_be_deleted, grace_days}`. Show this before asking for confirmation. |
| `POST /account/deletion` with `{"password": "…"}` | `202 {scheduled_for, workspace_will_be_deleted}`. Every token is revoked, push stops, and the user is emailed. |

- `409 {"error": "handover_required"}`: the user is the only admin of a
  workspace that still has members. They must make someone else admin first.
- `422` on `password`: wrong password. The endpoint allows 6 attempts per
  minute.
- `workspace_will_be_deleted: true`: they are the last member, so the
  workspace and all its cases and documents are deleted on the same date. An
  export link is emailed first.
- After a `202`, delete the stored token and show sign-in with a note that
  signing in within 30 days keeps the account.
- Signing in during the grace period (`/mobile/login` or the web) cancels the
  deletion. The response then has `meta.account_deletion_cancelled: true`;
  show "Your account will not be deleted".

## 2. Handling errors

| Status | What the app should do |
|---|---|
| `401` | The token is missing, expired or revoked. Clear it and show sign-in. This is the only status that means "signed out". |
| `403` with `"error": "workspace_required"` | Signed in, but no workspace yet. Show onboarding (section 3). |
| `403` with `"error": "subscription_required"` | The trial ended or there's no active plan. Show the billing screen. |
| `403` (other) | The user's role can't do this, e.g. a viewer editing a case. |
| `404` | Not found in this workspace. Records from other workspaces always return 404. |
| `422` | Validation. `message` is a summary, and `errors.{field}[]` holds the messages, in the request language. |
| `429` | Rate limited (120 requests per minute per user). Back off and retry. |
| `5xx` | Show a retry option, and don't sign the user out. |

## 3. What to show after sign-in

Use `user` from the sign-in response, or `GET /auth/me`:

1. `tenant_public_id` is `null`: create a workspace with
   `POST /tenants` (`tenant_name`, `country_id`, `plan`), then reload
   `/auth/me`.
2. `tenant.has_workspace_access` is `false`: show billing
   (`GET /billing/subscription`, `GET /billing/manual-methods`).
3. Otherwise: show the case list, which is the home screen. The case is the
   centre of everything; hearings, diary entries, documents and parties
   always belong to one.

## 4. Using the regular API

Every `/api/v1` endpoint the web app uses also accepts the Bearer token. The
main ones:

| Area | Endpoints |
|---|---|
| Cases | `GET/POST /cases`, `GET/PUT/DELETE /cases/{id}` (the detail includes the client, parties, participants, upcoming hearings, recent diary and documents) |
| Hearings | `GET /hearings`, `GET /hearings/calendar?from=&to=` (`Y-m-d`, at most 92 days), `GET /hearings/daily-register?date=`, `GET/POST /cases/{id}/hearings`, `GET/PUT/DELETE /hearings/{id}` |
| Diary | `GET /diary-entries`, `GET/POST /cases/{id}/diary`, `GET/PUT/DELETE /diary-entries/{id}` |
| Documents | `GET /documents`, `GET/POST /cases/{id}/documents` (multipart: `file`, `category`), `GET/PUT/DELETE /documents/{id}` |
| Parties and team | `GET/POST /cases/{id}/parties`, `PUT/DELETE /cases/{id}/parties/{party_id}`, `GET/POST /cases/{id}/participants`, `DELETE …/participants/{participant_id}` |
| Contacts | `GET/POST /clients`, `GET /clients/search?q=`, `GET/PUT/DELETE /clients/{id}` |
| Notifications | `GET /notifications`. Mark one read with `PUT /notifications/{id}` and `{"status": "read"}` |
| Daily briefing | `GET /daily-briefing/today` |
| Research notes | `GET/POST /research-notes`, `GET/PUT/DELETE /research-notes/{id}` |
| Profile | `GET /auth/me`, `PUT /profile` |
| Reference data | `GET /countries`, `GET /courts` |
| Workspace export (admins) | `POST /workspace/exports` (`202`; the zip is emailed as a signed link), `GET /workspace/exports` (latest five, with `download_url` when ready) |
| Support | `GET/POST /support/tickets`, `GET/POST /support/tickets/{id}/messages` |

Rules that apply everywhere:

- **IDs.** Every record is identified by its `public_id`, a 26-character
  ULID. Links between records use `*_public_id` fields, e.g.
  `case_public_id` and `client_public_id`. There are no numeric IDs, except
  for shared reference data such as `country_id` and `court_id`.
- **Pagination.** List endpoints are cursor-paginated. Pass `per_page` (up
  to 100) and follow `links.next` / `meta.next_cursor`.
- **Dates.** Timestamps such as `created_at` are UTC (`…Z`). Hearing times
  (`hearing_at`), diary `entry_at` and document `due_at` are Bangladesh local
  time with no `Z`. Show them as they are, without converting time zones.
- **Uploads.** Use `multipart/form-data`. Allowed types and size limits match
  the web app; a rejected file returns `422`.

### Downloading a document

Each document includes a `download_url` that is signed and valid for 30
minutes. Request it **with the Bearer header**. A missing token gives `401`
and a tampered or expired link gives `403`; in that case reload the document
to get a fresh URL.

## 5. Push notifications (FCM)

Push uses Firebase Cloud Messaging on both Android and iOS.

1. Integrate the Firebase SDK, ask for notification permission, and get the
   FCM registration token.
2. Register it for this device:

   ```http
   PUT /mobile/push-token
   {"push_token": "<FCM registration token>"}      → 200, device with push_enabled: true
   ```

3. Call it again whenever Firebase rotates the token (`onTokenRefresh` /
   `messaging:didReceiveRegistrationToken`) and on each app start.
4. To turn push off in the app's settings, call `DELETE /mobile/push-token`
   (`204`). Signing out also removes the registration.

A phone has one registration. If a different user signs in on the same phone
and registers, the previous user stops receiving pushes there.

Messages carry a `notification` (title and body, already in the user's
language) and string `data`:

```json
{
  "url": "/cases/01J…",
  "notification_public_id": "01J…",
  "notification_type": "hearing_reminder",
  "case_public_id": "01J…"
}
```

On tap, open the case when `case_public_id` is present. Otherwise route by
`url`: `/settings/billing` goes to billing, `/support` goes to support, and
anything else goes to the notification list. Hearing reminders arrive the day
before each hearing.

Server setup: `FCM_PROJECT_ID` and `FCM_CREDENTIALS` in the backend `.env`
(see `OPERATIONS.md`). Without them, push is off but everything else works.

## 6. Offline

The API has no special offline mode. Cache what the user has viewed (cases,
hearings, diary, document metadata) for read-only offline use, as the PWA
does. Keep writes online-only for now, matching the MVP rule against offline
edits.

## 7. What the app must not do

These are product rules (AGENTS.md):

- No legal advice, outcome predictions or verdict suggestions in copy or
  features.
- Summaries are reviewed and edited by the user before saving.
- Don't log tokens, passwords or document contents to crash reporters or
  analytics.

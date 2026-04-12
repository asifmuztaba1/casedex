# CaseDex Operations & Manual Setup Guide

> Last updated: 2026-04-11

This document tracks everything that requires manual configuration, human intervention, or external service setup to run CaseDex in development and production.

---

## 1. Environment Keys (Backend)

File: `backend/.env.example`

### Must configure before first run

| Variable | Purpose | How to get it |
|----------|---------|---------------|
| `APP_KEY` | Laravel encryption key | Run `php artisan key:generate` |
| `APP_URL` | Backend URL | e.g. `https://api.casedex.app` |
| `FRONTEND_URL` | Frontend URL (used in email links, WhatsApp messages) | e.g. `https://casedex.app` |
| `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` | MySQL credentials | Create database `casedex` with utf8mb4 charset |
| `REDIS_HOST`, `REDIS_PASSWORD` | Redis for queues/cache | Managed Redis or Docker |

### Email (pick one provider)

| Variable | Purpose |
|----------|---------|
| `MAIL_MAILER` | `resend`, `postmark`, `ses`, or `smtp` |
| `RESEND_API_KEY` | Get from https://resend.com/api-keys |
| `POSTMARK_API_KEY` | Get from Postmark dashboard |
| `MAIL_FROM_ADDRESS` | Must be verified with your provider |
| `MAIL_FROM_NAME` | Sender display name (default: app name) |

### File Storage (production)

| Variable | Purpose |
|----------|---------|
| `FILESYSTEM_DISK` | `s3` for production (local for dev) |
| `AWS_ACCESS_KEY_ID` | S3 or S3-compatible credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 or S3-compatible credentials |
| `AWS_BUCKET` | Bucket name (e.g. `casedex-documents`) |
| `AWS_DEFAULT_REGION` | Region (e.g. `sgp1` for low Bangladesh latency) |
| `AWS_ENDPOINT` | Required for DigitalOcean Spaces / Hetzner / MinIO |

### Lemon Squeezy Billing

| Variable | Purpose |
|----------|---------|
| `LEMON_SQUEEZY_API_KEY` | API key from LS dashboard |
| `LEMON_SQUEEZY_STORE` | Store ID (number after # in dashboard) |
| `LEMON_SQUEEZY_SIGNING_SECRET` | Webhook signing secret |
| `LEMON_SQUEEZY_REDIRECT_URL` | e.g. `https://casedex.app/settings/billing` |
| `LEMON_SQUEEZY_STARTER_MONTHLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_STARTER_YEARLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_PROFESSIONAL_MONTHLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_PROFESSIONAL_YEARLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_CHAMBERS_MONTHLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_CHAMBERS_YEARLY_VARIANT` | Variant ID from LS |
| `LEMON_SQUEEZY_UNLIMITED_STORAGE_VARIANT` | Addon variant ID |
| `LEMON_SQUEEZY_AI_PACK_SMALL_VARIANT` | AI credit pack variant |
| `LEMON_SQUEEZY_AI_PACK_MEDIUM_VARIANT` | AI credit pack variant |
| `LEMON_SQUEEZY_AI_PACK_LARGE_VARIANT` | AI credit pack variant |

**Manual steps:**
1. Create Lemon Squeezy account and store
2. Create products for each plan tier (Starter/Professional/Chambers) with Monthly and Yearly variants
3. Create products for AI credit packs (Small/Medium/Large)
4. Create storage addon product
5. Copy each variant ID into the `.env`
6. Set webhook URL in LS dashboard: `{APP_URL}/lemon-squeezy/webhook`
7. Copy the signing secret

### WhatsApp (Meta Cloud API)

| Variable | Default | Purpose |
|----------|---------|---------|
| `WHATSAPP_DRIVER` | `null` | Set to `meta` to enable real sending |
| `WHATSAPP_ACCESS_TOKEN` | — | Meta Cloud API long-lived token |
| `WHATSAPP_PHONE_NUMBER_ID` | — | From Meta Business Manager |

**Manual steps:**
1. Create Meta Business Account at https://business.facebook.com
2. Create a WhatsApp Business App in Meta for Developers
3. Add and verify a WhatsApp phone number
4. Generate a long-lived user access token (System User > Generate Token)
5. **Submit message templates for approval** (can take 24-48h):
   - `hearing_reminder_v1`: "You have a hearing scheduled for tomorrow. Open CaseDex for details: {{1}}"
   - `case_status_update_v1`: "A case you are involved in has been updated. Open CaseDex for details: {{1}}"
   - Create both in English (`en`) and Bengali (`bn`)
6. Set env vars and change `WHATSAPP_DRIVER=meta`

### AI Integration

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_DRIVER` | `openai_compatible` | `openai_compatible` or `gemini` |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` | API endpoint |
| `AI_API_KEY` | — | Provider API key |
| `AI_MODEL` | `llama-3.1-8b-instant` | Model ID |
| `AI_GEMINI_API_KEY` | — | Gemini key (if using Gemini) |
| `AI_MONTHLY_FREE_CREDITS` | `100` | Free credits per user/month |

### Monitoring (optional)

| Variable | Purpose |
|----------|---------|
| `SENTRY_LARAVEL_DSN` | Backend error tracking (https://sentry.io) |
| `SENTRY_TRACES_SAMPLE_RATE` | Trace sampling (default: 0.1) |

---

## 2. Environment Keys (Frontend)

File: `frontend/.env.production`

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL (e.g. `https://api.casedex.app`) |
| `NEXT_PUBLIC_APP_URL` | Frontend URL for meta tags (e.g. `https://casedex.app`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Required for push notifications. Generate: `npx web-push generate-vapid-keys` |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend error tracking (optional) |

---

## 3. Infrastructure Services

### Docker Compose (dev)

All services defined in `infra/compose/docker-compose.yml`:

| Service | Port | Purpose | Production? |
|---------|------|---------|-------------|
| nginx | 8080 | Reverse proxy | Replace with production nginx/Caddy + SSL |
| frontend | 3000 | Next.js app | Deploy as container or Vercel |
| backend | 8000 | Laravel API | Deploy as container |
| horizon | — | Queue worker | Must run in production |
| scheduler | — | Cron runner | Must run in production |
| mysql | 3306 | Database | Use managed MySQL (PlanetScale, RDS, etc.) |
| redis | 6379 | Queue/cache | Use managed Redis (Upstash, ElastiCache, etc.) |
| minio | 9000/9001 | S3 mock | Replace with real S3 in production |
| mailhog | 1025/8025 | Email capture | Remove in production |

### Scheduled Tasks

Runs via `php artisan schedule:work` (or system cron):

| Command | Schedule | Purpose |
|---------|----------|---------|
| `hearings:send-reminders` | Daily 08:00 | Email + WhatsApp hearing reminders |
| `billing:send-trial-ending-reminders` | Daily 09:00 | Trial expiration emails |
| `ai:grant-monthly-credits` | Daily 00:15 | Reset AI credits monthly |
| `billing:apply-manual-subscription-changes` | Every 15 min | Process admin-approved payments |
| `judiciary:scrape-causelist` | Daily 04:30 Asia/Dhaka | Scrape Bangladesh judiciary cause lists and create in-app notifications |

### Queue Workers

- **Driver:** Redis
- **Manager:** Laravel Horizon (`php artisan horizon`)
- **Dashboard:** `/horizon` (requires auth)
- **Config:** `backend/config/horizon.php`

---

## 4. Manual Workflows (Human Required)

### Manual Payment Review (Bangladesh MFS)

When a user pays via bKash/Nagad/bank transfer:
1. User submits payment proof in the app
2. Admin receives notification
3. Admin opens `/admin/manual-payments` to review
4. Admin approves or rejects
5. On approval, user gets temporary access for 24 hours (configurable via `BILLING_MANUAL_TEMPORARY_ACCESS_HOURS`)

**First-time setup:** Admin must create payment methods (bKash numbers, bank accounts) at `/admin/manual-payment-methods`.

### Court Registry

Bangladesh court data is seeded manually by platform admins at `/admin/courts`.

- `php artisan db:seed --class=BangladeshCourtSeeder` seeds the curated 8 divisions / 64 districts / ~23 court types / 630 flagship courts.
- `php artisan judiciary:seed-courts` layers on top (**dev-only, network-dependent**): pulls the full **4090** court catalog live from `https://causelist.judiciary.gov.bd/api?path=geo/divisions` and upserts each row keyed by `judiciary_portal_court_id`. Safe to re-run; it normalizes Bangla using NFC so `বগুড়া`/`বগুড়া` (precomposed vs. ড+nukta) collapse to one canonical entry, and it attaches portal IDs to the pre-seeded flagship courts via the `(district_id, court_type_id, name)` natural key.
- `php artisan db:seed --class=JudiciaryPortalCourtsSeeder` (**production path**): ingests the same 4090 rows from the static file `backend/database/seeders/data/judiciary_portal_courts.json` that ships in the repo. No network calls. Runs automatically as part of `DatabaseSeeder` so `db:seed --force` on first deploy covers it. To refresh the dump from a newer portal snapshot, run `php artisan judiciary:seed-courts` on a dev machine, then `php artisan judiciary:export-portal-dump`, then commit the updated JSON.

### Judiciary Cause List Integration

Daily at 04:30 Asia/Dhaka, `judiciary:scrape-causelist` finds every `(tenant_id, court_id)` pair that has at least one active case with registry fields (`registry_case_type_bn`, `registry_case_serial`, `registry_case_year`) and a court with a `judiciary_portal_court_id`, then dispatches one `ScrapeJudiciaryCauseListJob` per pair.

Each job:
1. Fetches `https://causelist.judiciary.gov.bd/causelist?courtId=...&date=dd-mm-yyyy` (User-Agent `CaseDex/1.0 (+contact@casedex.app)`, 20s timeout, 2 retries).
2. Parses the results table via Symfony DomCrawler; Bangla digits are normalized via `App\Support\BanglaDigits::toEnglish()`.
3. Matches scraped rows against tenant cases on `(court_id, registry_case_type_bn, registry_case_serial, registry_case_year)` (tenant scope enforced by `BelongsToTenant`).
4. For every match, creates idempotent in-app `CaseNotification` records (type `cause_list_listing`, channel `in_app`) for all case participants + tenant admins.
5. Writes a status row to `judiciary_causelist_logs` keyed on `(tenant_id, court_id, cause_list_date)` with `ok`/`empty`/`failed`, row count, match count, notification count, and error message. Updates `courts.last_causelist_synced_at` on success.

**Ops notes:**
- Saturdays are expected to return empty lists (courts closed) — logged as `empty`, not `failed`.
- To seed the portal courts once before the integration can do anything useful: `docker compose exec backend php artisan judiciary:seed-courts`.
- To backfill or replay a single day: `php artisan judiciary:scrape-causelist --date=2026-04-08 [--tenant=1] [--court=123]`.
- The scraper depends on `symfony/dom-crawler` and `symfony/css-selector` (already in `composer.json`).
- Registry fields are captured from the case-intake form at `/cases/new` → "Court registry" section; all three fields must be filled together or left empty (validated both in the zod schema and `StoreCaseRequest`).

---

## 5. Security

### Rate Limiting

- `/auth/login` and `/auth/register` — 10 requests/min per IP (`throttle:auth`)
- `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` — 6 requests/min
- All authenticated API routes — 120 requests/min per user (`throttle:api`)

### Security Headers

Applied globally via `SecurityHeaders` middleware (backend) and `next.config.ts` (frontend):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only on backend)

### CORS

File: `backend/config/cors.php`

- Origins: controlled by `CORS_ALLOWED_ORIGINS` env var (comma-separated)
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization, X-Requested-With, Accept, X-XSRF-TOKEN`
- **Production:** Set `CORS_ALLOWED_ORIGINS=https://casedex.app` (your frontend domain)

### Backups

Package: `spatie/laravel-backup` — DB-only backups (no file backup).

| Command | Schedule | Purpose |
|---------|----------|---------|
| `backup:clean` | Daily 01:00 | Clean old backups |
| `backup:run --only-db` | Daily 01:30 | MySQL dump |

Config: `backend/config/backup.php`. By default backs up to local disk. For production, configure S3 destination in the backup config.

---

## 6. Production Deployment Checklist

### Before first deploy

- [ ] Generate `APP_KEY`
- [ ] Set `APP_DEBUG=false`, `APP_ENV=production`
- [ ] Set `LOG_CHANNEL=stack`, `LOG_STACK=daily`, `LOG_LEVEL=warning`
- [ ] Configure all required env vars (see sections above)
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend domain
- [ ] Set `SESSION_SECURE_COOKIE=true` and `SESSION_DOMAIN=.yourdomain.com`
- [ ] Set up SSL/TLS on your domain
- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan optimize` (caches config, routes, events)
- [ ] Start Horizon queue worker (supervised)
- [ ] Start scheduler (`schedule:work` or system cron)
- [ ] Generate VAPID keys and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] Verify email delivery works (send a test)
- [ ] Configure Lemon Squeezy webhook and test with a trial subscription
- [ ] Create first admin account
- [ ] Seed court data if needed

### After deploy (verify)

- [ ] Health check: `GET /up` returns 200
- [ ] Auth flow works (register, login, logout)
- [ ] Email verification delivered
- [ ] Hearing reminder cron runs at 08:00
- [ ] File upload works (S3 bucket accessible)
- [ ] Billing checkout redirects correctly
- [ ] Push notifications work on mobile browsers
- [ ] WhatsApp test message sends (if `WHATSAPP_DRIVER=meta`)
- [ ] DB backup runs at 01:30 (`backup:run --only-db`)
- [ ] Security headers present (check with `curl -I`)

---

## 7. Pending / Not Yet Configured

Items that are implemented in code but not yet activated:

| Feature | Status | Blocker |
|---------|--------|---------|
| WhatsApp notifications | Code complete, driver set to `null` | Need Meta Business Account + template approval |
| Sentry error tracking | Code supports it | Need Sentry account + DSN |
| Production S3 storage | Using local in dev | Need S3 bucket + credentials |
| Lemon Squeezy billing | Code complete | Need LS account + variant IDs |
| AI credit packs (paid) | Code complete | Need LS variant IDs for packs |

---

## 8. Useful Commands

```bash
# Dev environment
cd infra/compose && docker compose up -d

# Run migrations
docker compose exec backend php artisan migrate

# Clear all caches
docker compose exec backend php artisan optimize:clear

# Frontend build
docker compose exec frontend sh -c "pnpm build"

# Check queue health
docker compose exec backend php artisan horizon:status

# Test hearing reminders manually
docker compose exec backend php artisan hearings:send-reminders

# Generate VAPID keys
npx web-push generate-vapid-keys

# Run tests
docker compose exec backend php artisan test

# Run backup manually
docker compose exec backend php artisan backup:run --only-db
```

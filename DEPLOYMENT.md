# CaseDex — Production Deployment Guide

## Architecture

```
Cloudflare (DNS + SSL + CDN)
         │
    Hetzner VPS (CPX21 — 3 vCPU, 4GB RAM, €8/mo)
    ┌──────────────────────────────┐
    │  Nginx (reverse proxy :80)   │
    │    ├─ /api/*  → Backend      │
    │    └─ /*      → Frontend     │
    │                              │
    │  Next.js   (SSR, port 3000)  │
    │  Laravel   (API, port 8000)  │
    │  Horizon   (queue worker)    │
    │  Scheduler (cron jobs)       │
    │  MySQL 8.0                   │
    │  Redis 7                     │
    └──────────────────────────────┘
         │
    Cloudflare R2 (document storage)
    Resend (transactional email)
    Groq (AI — Llama 3.1)
    Lemon Squeezy (payments)
    Sentry (error monitoring)
```

## Prerequisites

- **Hetzner account** — create a CPX21 VPS (Ubuntu 24.04)
- **Cloudflare account** — free plan, add your domain
- **Cloudflare R2** — create a bucket `casedex-documents`
- **Resend account** — verify your domain, get API key
- **Groq API key** — free tier at console.groq.com
- **Lemon Squeezy** — set up store and product variants
- **Sentry** — create a Laravel + Next.js project

---

## Step 1: Server Setup

SSH into your Hetzner VPS:

```bash
ssh root@YOUR_SERVER_IP
```

Clone the repo and run the setup script:

```bash
git clone git@github.com:asifmuztaba1/casedex.git /opt/casedex
cd /opt/casedex
bash infra/deploy.sh setup
```

This installs Docker, configures the firewall (SSH + HTTP + HTTPS only), and creates 2GB swap.

---

## Step 2: Configure Environment

```bash
cp infra/.env.production.example backend/.env
nano backend/.env
```

**Must fill in:**
- `APP_KEY` — generate after first build (step 3a)
- `DB_PASSWORD` / `DB_ROOT_PASSWORD` — use `openssl rand -base64 32`
- `AWS_*` — Cloudflare R2 credentials
- `RESEND_API_KEY`
- `AI_API_KEY` — your Groq key
- `LEMON_SQUEEZY_*` — billing variants
- `SENTRY_LARAVEL_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## Step 3: Deploy

```bash
bash infra/deploy.sh deploy
```

### 3a: Generate APP_KEY (first time only)

```bash
cd /opt/casedex
docker compose -f infra/compose/docker-compose.production.yml run --rm backend php artisan key:generate
```

Then redeploy to pick up the key:

```bash
bash infra/deploy.sh redeploy
```

### 3b: Seed the database (first time only)

```bash
bash infra/deploy.sh seed
```

This seeds Bangladesh court data (8 divisions, 65 districts, 23 court types, ~630 courts).

---

## Step 4: Cloudflare DNS

In Cloudflare dashboard:

1. Add an **A record**: `casedex.app` → `YOUR_SERVER_IP` (Proxied ☁️)
2. Add an **A record**: `www` → `YOUR_SERVER_IP` (Proxied ☁️)

### SSL Settings
- Go to **SSL/TLS** → set to **Full (strict)**
- Enable **Always Use HTTPS**
- Enable **Auto Minify** (JS, CSS, HTML)

Cloudflare handles SSL termination — your server only needs port 80.

### Page Rules (optional)
- `www.casedex.app/*` → **Forwarding URL** 301 to `https://casedex.app/$1`

---

## Step 5: Lemon Squeezy Webhook

In Lemon Squeezy dashboard:
1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://casedex.app/lemon-squeezy/webhook`
3. Set the signing secret (same as `LEMON_SQUEEZY_SIGNING_SECRET` in .env)
4. Subscribe to: `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`

---

## Day-to-Day Operations

### Redeploy after code changes
```bash
bash infra/deploy.sh redeploy
```

### View logs
```bash
bash infra/deploy.sh logs           # all services
bash infra/deploy.sh logs backend   # just backend
bash infra/deploy.sh logs horizon   # queue worker
```

### Manual database backup
```bash
bash infra/deploy.sh backup
```
Saves to `/opt/backups/casedex_YYYYMMDD_HHMMSS.sql.gz`

### Check status
```bash
bash infra/deploy.sh status
```

### Run artisan commands
```bash
cd /opt/casedex
docker compose -f infra/compose/docker-compose.production.yml exec backend php artisan tinker
docker compose -f infra/compose/docker-compose.production.yml exec backend php artisan migrate:status
```

### Restart a specific service
```bash
docker compose -f infra/compose/docker-compose.production.yml restart backend
```

---

## Monthly Cost Breakdown

| Service | Cost |
|---------|------|
| Hetzner CPX21 (3 vCPU, 4GB RAM) | €8/mo (~$9) |
| Cloudflare (DNS + SSL + CDN) | Free |
| Cloudflare R2 (10GB free) | Free |
| Resend (3k emails/mo) | Free |
| Groq AI (free tier) | Free |
| Sentry (5k events/mo) | Free |
| **Total** | **~$9/mo** |

---

## Scaling

When you outgrow the single VPS:

1. **More RAM/CPU** → Resize to CPX31 (4 vCPU, 8GB, €16/mo)
2. **Separate DB** → Move MySQL to Hetzner Managed DB or PlanetScale
3. **Multiple servers** → Add a second app server behind Cloudflare load balancing
4. **More storage** → R2 scales automatically, no action needed

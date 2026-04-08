#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
# CaseDex Production Deployment Script
# Run on your Hetzner VPS after initial setup
# ──────────────────────────────────────────────────

REPO_URL="https://github.com/asifmuztaba1/casedex.git"
APP_DIR="/opt/casedex"
COMPOSE_FILE="infra/compose/docker-compose.production.yml"
DC="docker compose -f $COMPOSE_FILE --env-file backend/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1" >&2; exit 1; }

# ─── First-time server setup ─────────────────────
setup_server() {
    log "Installing Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    log "Enabling Docker..."
    systemctl enable docker
    systemctl start docker

    log "Setting up firewall..."
    apt-get install -y ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP (Cloudflare proxy)
    ufw allow 443/tcp  # HTTPS (Cloudflare proxy)
    ufw --force enable

    log "Creating swap (2GB)..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi

    log "Server setup complete!"
}

# ─── Clone or pull ────────────────────────────────
fetch_code() {
    if [ ! -d "$APP_DIR" ]; then
        log "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
    else
        log "Pulling latest code..."
        cd "$APP_DIR"
        git pull origin master
    fi
    cd "$APP_DIR"
}

# ─── Check .env exists ───────────────────────────
check_env() {
    if [ ! -f "$APP_DIR/backend/.env" ]; then
        err "backend/.env not found! Copy from infra/.env.production.example and fill in values:\n  cp $APP_DIR/infra/.env.production.example $APP_DIR/backend/.env\n  nano $APP_DIR/backend/.env"
    fi

    # Source env for docker-compose
    set -a
    source "$APP_DIR/backend/.env"
    set +a

    # Ensure required vars
    [ -z "${APP_KEY:-}" ] && err "APP_KEY is empty. Generate: docker compose -f $COMPOSE_FILE run --rm backend php artisan key:generate --show"
    [ -z "${DB_PASSWORD:-}" ] && err "DB_PASSWORD is empty!"
}

# ─── Build & deploy ──────────────────────────────
deploy() {
    cd "$APP_DIR"
    check_env

    log "Building containers..."
    $DC build

    log "Starting database & redis first..."
    $DC up -d mysql redis
    sleep 10

    log "Running migrations..."
    $DC run --rm backend php artisan migrate --force

    log "Caching config & routes..."
    $DC run --rm backend php artisan config:cache
    $DC run --rm backend php artisan route:cache
    $DC run --rm backend php artisan view:cache

    log "Starting all services..."
    $DC up -d

    log "Restarting Horizon..."
    $DC exec backend php artisan horizon:terminate 2>/dev/null || true

    log "Deployment complete!"
    $DC ps
}

# ─── Seed courts (first deploy only) ─────────────
seed() {
    cd "$APP_DIR"
    log "Seeding database..."
    $DC run --rm backend php artisan db:seed --force
}

# ─── Quick redeploy (pull + rebuild + restart) ───
redeploy() {
    cd "$APP_DIR"
    log "Pulling latest..."
    git pull origin master

    check_env

    log "Rebuilding..."
    $DC build

    log "Running migrations..."
    $DC run --rm backend php artisan migrate --force

    log "Caching..."
    $DC run --rm backend php artisan config:cache
    $DC run --rm backend php artisan route:cache
    $DC run --rm backend php artisan view:cache

    log "Restarting services..."
    $DC up -d
    $DC exec backend php artisan horizon:terminate 2>/dev/null || true

    log "Redeploy complete!"
}

# ─── View logs ────────────────────────────────────
logs() {
    cd "$APP_DIR"
    $DC logs -f "${1:-}"
}

# ─── Backup database ─────────────────────────────
backup() {
    cd "$APP_DIR"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local file="/opt/backups/casedex_${timestamp}.sql.gz"
    mkdir -p /opt/backups
    log "Backing up database to $file..."
    $DC exec mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" casedex | gzip > "$file"
    log "Backup saved: $file ($(du -h "$file" | cut -f1))"
}

# ─── Status ───────────────────────────────────────
status() {
    cd "$APP_DIR"
    $DC ps
    echo ""
    log "Disk usage:"
    df -h / | tail -1
    echo ""
    log "Memory:"
    free -h | head -2
}

# ─── Main ─────────────────────────────────────────
case "${1:-help}" in
    setup)    setup_server ;;
    deploy)   fetch_code && deploy ;;
    seed)     seed ;;
    redeploy) redeploy ;;
    logs)     logs "${2:-}" ;;
    backup)   backup ;;
    status)   status ;;
    *)
        echo "Usage: $0 {setup|deploy|seed|redeploy|logs|backup|status}"
        echo ""
        echo "  setup     - First-time server setup (Docker, firewall, swap)"
        echo "  deploy    - Full deploy (clone/pull, build, migrate, start)"
        echo "  seed      - Seed database (courts, etc) — first deploy only"
        echo "  redeploy  - Quick redeploy (pull, build, migrate, restart)"
        echo "  logs      - Tail logs (optionally: logs backend)"
        echo "  backup    - Dump database to /opt/backups/"
        echo "  status    - Show container status, disk, memory"
        ;;
esac

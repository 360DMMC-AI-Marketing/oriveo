#!/bin/bash
set -euo pipefail

# ==============================================
# Oriveo — Deployment Script (Docker Compose)
# Usage: bash deploy.sh
# ==============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# --- 1. Prerequisites ---
command -v docker >/dev/null 2>&1 || err "Docker not installed"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose not installed"

# --- 2. Check .env ---
if [ ! -f server/.env ]; then
  warn "server/.env not found. Creating from .env.example..."
  cp server/.env.example server/.env
  err "Edit server/.env with your secrets, then re-run this script."
fi

# --- 3. SSL certificates ---
if [ ! -f certs/oriveo.crt ] || [ ! -f certs/oriveo.key ]; then
  warn "SSL certificates not found in certs/"
  warn "Generating self-signed certs (replace with real ones later)..."
  mkdir -p certs
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/oriveo.key -out certs/oriveo.crt \
    -subj "/CN=oriveo.local" 2>/dev/null
  log "Self-signed certs generated in certs/"
fi

# --- 4. Pull & Build ---
log "Pulling base images..."
docker compose pull mongodb redis nginx 2>/dev/null || true

log "Building services..."
docker compose build --parallel server client-builder

# --- 5. Start services ---
log "Starting all services..."
docker compose up -d

# --- 6. Wait for healthy ---
log "Waiting for services to be healthy..."
sleep 10
docker compose ps

# --- 7. Show status ---
echo ""
log "Deployment complete!"
echo ""
echo "  Frontend:  https://$(curl -s ifconfig.me 2>/dev/null || echo 'yourdomain.com')"
echo "  API:       https://$(curl -s ifconfig.me 2>/dev/null || echo 'yourdomain.com')/api/health"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f    # View logs"
echo "  docker compose ps         # Check status"
echo "  docker compose restart    # Restart all services"
echo "  docker compose down       # Stop all services"
echo "  docker compose pull       # Update images"

#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Live Interpreter — VPS Auto-Setup Script
#  Run on a fresh Ubuntu 22.04 / 24.04 VPS as root
#  snxwfairies innovations pvt. ltd
# ═══════════════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🧚 Live Interpreter — VPS Setup                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Collect inputs ────────────────────────────────────────────
read -p "  Your domain (e.g. interpreter.yourdomain.com): " DOMAIN
read -p "  OpenRouter API key (sk-or-v1-...): " OPENROUTER_KEY
read -p "  Sarvam AI key (leave blank if none): " SARVAM_KEY
read -p "  Admin secret password (for Settings page): " ADMIN_SECRET
echo ""

# ── Install Docker ────────────────────────────────────────────
echo "[1/5] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "       Docker already installed ✓"
fi

# ── Install Docker Compose ────────────────────────────────────
echo "[2/5] Installing Docker Compose..."
if ! command -v docker compose &>/dev/null; then
  apt-get install -y docker-compose-plugin 2>/dev/null || \
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
fi
echo "       Docker Compose ready ✓"

# ── Create app directory ──────────────────────────────────────
echo "[3/5] Setting up app directory..."
APP_DIR="/opt/live-interpreter"
mkdir -p "$APP_DIR/data"
cd "$APP_DIR"

# ── Write Caddyfile ───────────────────────────────────────────
cat > Caddyfile << CADDY
$DOMAIN {
    reverse_proxy app:3000

    @websockets {
        header Connection *Upgrade*
        header Upgrade    websocket
    }
    reverse_proxy @websockets app:3000

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
    }

    encode gzip
}
CADDY

# ── Write .env.local ──────────────────────────────────────────
cat > .env.local << ENV
OPENROUTER_API_KEY=$OPENROUTER_KEY
SARVAM_API_KEY=$SARVAM_KEY
ADMIN_SECRET=$ADMIN_SECRET
NODE_ENV=production
PORT=3000
ENV

# ── Write docker-compose.yml ──────────────────────────────────
cat > docker-compose.yml << 'COMPOSE'
services:
  app:
    image: node:22-alpine
    container_name: live-interpreter
    working_dir: /app
    restart: unless-stopped
    env_file: .env.local
    volumes:
      - ./app:/app
      - ./data:/app/data
    command: sh -c "npm install && node server.js"
    networks:
      - web

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web
    depends_on:
      - app

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
COMPOSE

echo "       Config files written ✓"

# ── Reminder to upload app files ─────────────────────────────
echo "[4/5] App directory ready at: $APP_DIR/app/"
echo "       → Upload server.js, package.json, public/ to $APP_DIR/app/"
echo ""

# ── Firewall ──────────────────────────────────────────────────
echo "[5/5] Opening firewall ports..."
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp  2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw allow 22/tcp  2>/dev/null || true
  ufw --force enable 2>/dev/null || true
  echo "       Firewall: 80, 443, 22 open ✓"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                  ║"
echo "║                                                      ║"
echo "║  Next steps:                                         ║"
echo "║                                                      ║"
echo "║  1. Upload app files to: $APP_DIR/app/          ║"
echo "║     (server.js, package.json, public/)               ║"
echo "║                                                      ║"
echo "║  2. Point your domain DNS to this server IP:        ║"
echo "║     $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')                                      ║"
echo "║     Type: A record                                   ║"
echo "║                                                      ║"
echo "║  3. Start the app:                                   ║"
echo "║     cd $APP_DIR && docker compose up -d         ║"
echo "║                                                      ║"
echo "║  4. Open: https://$DOMAIN                    ║"
echo "║     Admin secret: $ADMIN_SECRET               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

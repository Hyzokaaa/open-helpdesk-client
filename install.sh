#!/bin/bash
set -e

# Open Helpdesk Client - Installation Script
# Requirements: Node.js 22+, nginx.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Hyzokaaa/open-helpdesk-client/main/install.sh -o install.sh
#   bash install.sh
#
# Custom install:
#   INSTALL_DIR=/opt/oh-test/client WEB_ROOT=/var/www/oh-test \
#     NGINX_PORT=8080 NGINX_SITE=oh-test BACKEND_PORT=3001 bash install.sh

# Detect if running via pipe (curl | bash) — read won't work
if [ ! -t 0 ]; then
  echo "[ERROR] This script requires interactive input."
  echo ""
  echo "  Download first, then run:"
  echo "    curl -fsSL https://raw.githubusercontent.com/Hyzokaaa/open-helpdesk-client/main/install.sh -o install.sh"
  echo "    bash install.sh"
  echo ""
  exit 1
fi

INSTALL_DIR="${INSTALL_DIR:-/opt/open-helpdesk/client}"
WEB_ROOT="${WEB_ROOT:-/var/www/openhelpdesk}"
NGINX_PORT="${NGINX_PORT:-80}"
NGINX_SITE="${NGINX_SITE:-openhelpdesk}"
BACKEND_PORT="${BACKEND_PORT:-3000}"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Open Helpdesk Client Installer     ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Install dir:  $INSTALL_DIR"
echo "  Web root:     $WEB_ROOT"
echo "  Nginx port:   $NGINX_PORT"
echo "  Backend port: $BACKEND_PORT"
echo ""

# ══════════════════════════════════════════════
# Step 1/3 — Prerequisites
# ══════════════════════════════════════════════

echo "── Step 1/3: Checking prerequisites ──"
echo ""

# Node.js
if ! command -v node &> /dev/null; then
  read -p "[MISSING] Node.js is not installed. Install it now? (Y/n): " INSTALL_NODE
  if [ "${INSTALL_NODE,,}" != "n" ]; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    echo "[ERROR] Node.js is required. Aborting."
    exit 1
  fi
else
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 22 ]; then
    echo "[ERROR] Node.js 22+ required. Found: $(node -v)"
    exit 1
  fi
fi
echo "[OK] Node.js $(node -v)"

# nginx
export PATH="$PATH:/usr/sbin"
if ! command -v nginx &> /dev/null && ! [ -x /usr/sbin/nginx ]; then
  read -p "[MISSING] nginx is not installed. Install it now? (Y/n): " INSTALL_NGINX
  if [ "${INSTALL_NGINX,,}" != "n" ]; then
    echo "Installing nginx..."
    sudo apt-get install -y nginx
  else
    echo "[ERROR] nginx is required. Aborting."
    exit 1
  fi
fi
echo "[OK] nginx found"

echo ""

# ══════════════════════════════════════════════
# Step 2/3 — Configuration
# ══════════════════════════════════════════════

echo "── Step 2/3: Configuration ──"
echo ""

read -p "Server hostname (e.g. helpdesk.yourcompany.com) [localhost]: " SERVER_NAME
SERVER_NAME=${SERVER_NAME:-localhost}

if [ "$SERVER_NAME" = "localhost" ]; then
  if [ "$NGINX_PORT" = "80" ]; then
    API_URL_DEFAULT="http://localhost/api"
  else
    API_URL_DEFAULT="http://localhost:$NGINX_PORT/api"
  fi
else
  API_URL_DEFAULT="https://$SERVER_NAME/api"
fi

read -p "Backend API URL [$API_URL_DEFAULT]: " VITE_API_URL
VITE_API_URL=${VITE_API_URL:-$API_URL_DEFAULT}

read -p "App name [Open Helpdesk]: " VITE_APP_NAME
VITE_APP_NAME=${VITE_APP_NAME:-Open Helpdesk}

read -p "App subtitle (leave empty for default, 'none' to hide): " VITE_APP_SUBTITLE

echo ""

# ══════════════════════════════════════════════
# Step 3/3 — Client
# ══════════════════════════════════════════════

echo "── Step 3/3: Installing client ──"
echo ""

# Clone or pull
sudo mkdir -p "$INSTALL_DIR"

if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Updating existing installation..."
  git config --global --add safe.directory "$INSTALL_DIR" 2>/dev/null || true
  cd "$INSTALL_DIR"
  sudo git pull
else
  echo "Cloning repository..."
  sudo git clone https://github.com/Hyzokaaa/open-helpdesk-client.git "$INSTALL_DIR"
  git config --global --add safe.directory "$INSTALL_DIR" 2>/dev/null || true
fi

cd "$INSTALL_DIR"

# Write .env
sudo tee "$INSTALL_DIR/.env" > /dev/null << EOF
VITE_API_URL=$VITE_API_URL
VITE_APP_NAME=$VITE_APP_NAME
VITE_APP_SUBTITLE=$VITE_APP_SUBTITLE
EOF

echo "[OK] Configuration saved"

# Install dependencies and build
echo "Installing dependencies..."
sudo npm install 2>&1 | tail -1
echo "Building..."
sudo npm run build 2>&1 | tail -1

# Deploy to web root
echo "Deploying to $WEB_ROOT..."
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$INSTALL_DIR/dist/"* "$WEB_ROOT/"

echo "[OK] Client built and deployed"

# Configure nginx
if command -v nginx &> /dev/null; then
  if [ -d /etc/nginx/sites-available ]; then
    NGINX_CONF="/etc/nginx/sites-available/$NGINX_SITE.conf"
    NGINX_LINK="/etc/nginx/sites-enabled/$NGINX_SITE.conf"
  elif [ -d /etc/nginx/conf.d ]; then
    NGINX_CONF="/etc/nginx/conf.d/$NGINX_SITE.conf"
    NGINX_LINK=""
  else
    NGINX_CONF=""
  fi

  if [ -n "$NGINX_CONF" ] && [ ! -f "$NGINX_CONF" ]; then
    read -p "Configure nginx for $SERVER_NAME? (Y/n): " SETUP_NGINX
    if [ "${SETUP_NGINX,,}" != "n" ]; then
      sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen $NGINX_PORT;
    server_name $SERVER_NAME;

    root $WEB_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

      if [ -n "$NGINX_LINK" ]; then
        sudo ln -sf "$NGINX_CONF" "$NGINX_LINK"
      fi
      sudo nginx -t && sudo systemctl restart nginx
      echo "[OK] nginx configured"
    fi
  else
    echo "[OK] Using existing nginx config"
    sudo nginx -t && sudo systemctl reload nginx
  fi
fi

# ══════════════════════════════════════════════
# Done
# ══════════════════════════════════════════════

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║           Client Installed!                          ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║                                                      ║"
echo "  ║  Web root:  $WEB_ROOT"
echo "  ║  Source:     $INSTALL_DIR"
echo "  ║  Config:     $INSTALL_DIR/.env"
echo "  ║                                                      ║"
echo "  ║  To rebuild after config changes:                    ║"
echo "  ║    cd $INSTALL_DIR"
echo "  ║    sudo npm run build"
echo "  ║    sudo cp -r dist/* $WEB_ROOT/"
echo "  ║                                                      ║"
echo "  ║  For HTTPS:                                          ║"
echo "  ║    sudo certbot --nginx -d $SERVER_NAME"
echo "  ║                                                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

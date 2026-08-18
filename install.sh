#!/bin/bash
set -e

# Open Helpdesk Client - Installation Script
# Requirements: Node.js 22+, nginx.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Hyzokaaa/open-helpdesk-client/main/install.sh | bash
#
# Custom install:
#   INSTALL_DIR=/opt/oh-test/client WEB_ROOT=/var/www/oh-test \
#     NGINX_PORT=8080 NGINX_SITE=oh-test BACKEND_PORT=3001 bash install.sh

INSTALL_DIR="${INSTALL_DIR:-/opt/open-helpdesk/client}"
WEB_ROOT="${WEB_ROOT:-/var/www/openhelpdesk}"
NGINX_PORT="${NGINX_PORT:-80}"
NGINX_SITE="${NGINX_SITE:-openhelpdesk}"
BACKEND_PORT="${BACKEND_PORT:-3000}"

echo ""
echo "=== Open Helpdesk Client Installer ==="
echo ""
echo "  Install dir:  $INSTALL_DIR"
echo "  Web root:     $WEB_ROOT"
echo "  Nginx port:   $NGINX_PORT"
echo "  Backend port: $BACKEND_PORT"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js is not installed. Install Node.js 22+ first."
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "[ERROR] Node.js 22+ required. Found: $(node -v)"
  exit 1
fi
echo "[OK] Node.js $(node -v)"

# Check nginx
export PATH="$PATH:/usr/sbin"
if ! command -v nginx &> /dev/null; then
  echo "[WARNING] nginx not found. You will need a web server to serve the client."
  echo "  sudo apt-get install -y nginx"
fi

# Create install directory
echo "Installing to $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"

# Clone or pull
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

# Configuration
echo ""
echo "=== Configuration ==="
echo ""

read -p "Backend API URL (e.g. https://helpdesk.yourcompany.com/api) [http://localhost:$BACKEND_PORT]: " VITE_API_URL
VITE_API_URL=${VITE_API_URL:-http://localhost:$BACKEND_PORT}

read -p "App name [Open Helpdesk]: " VITE_APP_NAME
VITE_APP_NAME=${VITE_APP_NAME:-Open Helpdesk}

read -p "App subtitle (leave empty for default, 'none' to hide): " VITE_APP_SUBTITLE

cat > "$INSTALL_DIR/.env" << EOF
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
echo "Deploying to $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$INSTALL_DIR/dist/"* "$WEB_ROOT/"

# Configure nginx if available
if command -v nginx &> /dev/null; then
  # Detect nginx config structure
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
    read -p "Server hostname (e.g. helpdesk.yourcompany.com) [localhost]: " SERVER_NAME
    SERVER_NAME=${SERVER_NAME:-localhost}

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
    echo "[OK] Nginx configured for $SERVER_NAME on port $NGINX_PORT"
  else
    echo "[OK] Using existing nginx config"
    sudo nginx -t && sudo systemctl restart nginx
  fi
fi

echo ""
echo "=== Client installed ==="
echo "  Web root:  $WEB_ROOT"
echo "  Source:     $INSTALL_DIR"
echo "  Config:     $INSTALL_DIR/.env"
echo ""
echo "  To rebuild after config changes:"
echo "    cd $INSTALL_DIR && sudo npm run build && sudo cp -r dist/* $WEB_ROOT/"
echo ""

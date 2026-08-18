#!/bin/bash
set -e

# Open Helpdesk Client - Update Script
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Hyzokaaa/open-helpdesk-client/main/update.sh -o update.sh
#   bash update.sh

INSTALL_DIR="${INSTALL_DIR:-/opt/open-helpdesk/client}"
WEB_ROOT="${WEB_ROOT:-/var/www/openhelpdesk}"

echo ""
echo "=== Updating Open Helpdesk Client ==="
echo ""

if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo "[ERROR] Client not found at $INSTALL_DIR"
  exit 1
fi

cd "$INSTALL_DIR"
git config --global --add safe.directory "$INSTALL_DIR" 2>/dev/null || true

echo "Pulling latest changes..."
sudo git pull

echo "Installing dependencies..."
sudo npm install 2>&1 | tail -1

echo "Building..."
sudo npm run build 2>&1 | tail -1

echo "Deploying..."
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$INSTALL_DIR/dist/"* "$WEB_ROOT/"

echo ""
echo "[OK] Client updated and deployed to $WEB_ROOT"
echo ""

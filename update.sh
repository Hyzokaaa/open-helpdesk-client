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
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Open Helpdesk Client Updater       ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo "[ERROR] Client not found at $INSTALL_DIR"
  exit 1
fi

cd "$INSTALL_DIR"
git config --global --add safe.directory "$INSTALL_DIR" 2>/dev/null || true

# ── Version check ──

CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null)

sudo git fetch origin &>/dev/null
LATEST_COMMIT=$(git rev-parse --short origin/main 2>/dev/null)

echo "  Current:   $CURRENT_COMMIT"
echo "  Available: $LATEST_COMMIT"
echo ""

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
  echo "  Already up to date!"
  echo ""
  exit 0
fi

CHANGES=$(git log --oneline "$CURRENT_COMMIT..origin/main" 2>/dev/null)
if [ -n "$CHANGES" ]; then
  CHANGE_COUNT=$(echo "$CHANGES" | wc -l)
  echo "  $CHANGE_COUNT new commit(s):"
  echo "$CHANGES" | head -10 | sed 's/^/    /'
  if [ "$CHANGE_COUNT" -gt 10 ]; then
    echo "    ... and $((CHANGE_COUNT - 10)) more"
  fi
  echo ""
fi

read -p "  Update? (Y/n): " CONFIRM
if [ "${CONFIRM,,}" = "n" ]; then
  echo "  Update cancelled."
  exit 0
fi

# ── Update ──

echo ""
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
echo "  ╔══════════════════════════════════════╗"
echo "  ║        Client Updated!               ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Deployed to: $WEB_ROOT"
echo ""

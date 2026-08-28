#!/bin/bash
set -e

# Open Helpdesk Client - Update Script
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Hyzokaaa/open-helpdesk-client/main/update.sh -o update.sh
#   bash update.sh

INSTALL_DIR="${INSTALL_DIR:-/opt/open-helpdesk/client}"
BACKEND_DIR="${BACKEND_DIR:-/opt/open-helpdesk/backend}"
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

CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null)

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
sudo git fetch origin --quiet &>/dev/null

LATEST_VERSION=$(git show "origin/$BRANCH:package.json" 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).version" 2>/dev/null || echo "unknown")
LATEST_COMMIT=$(git rev-parse --short "origin/$BRANCH" 2>/dev/null)

echo "  Current:   v$CURRENT_VERSION ($CURRENT_COMMIT)"
echo "  Available: v$LATEST_VERSION ($LATEST_COMMIT)"
echo ""

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
  echo "  Already up to date!"
  echo ""
  exit 0
fi

# ── Compatibility check ──

CLIENT_COMPAT=$(git show "origin/$BRANCH:package.json" 2>/dev/null | node -p "
  const pkg = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
  pkg.compatibility && pkg.compatibility.backend ? pkg.compatibility.backend : '';
" 2>/dev/null || echo "")

if [ -n "$CLIENT_COMPAT" ] && [ -d "$BACKEND_DIR" ]; then
  BACKEND_VERSION=$(node -p "require('$BACKEND_DIR/package.json').version" 2>/dev/null || echo "unknown")

  COMPAT_OK=$(node -e "
    const [, , minVer] = '$CLIENT_COMPAT'.match(/^(>=?)(\d+\.\d+\.\d+)/) || [];
    const [, , maxVer] = '$CLIENT_COMPAT'.match(/<(\d+\.\d+\.\d+)/) || [];
    const v = '$BACKEND_VERSION'.split('.').map(Number);
    const min = (minVer || '0.0.0').split('.').map(Number);
    const max = (maxVer || '999.999.999').split('.').map(Number);
    const gte = (a, b) => a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] >= b[2])));
    const lt = (a, b) => a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])));
    console.log(gte(v, min) && lt(v, max) ? 'yes' : 'no');
  " 2>/dev/null || echo "unknown")

  if [ "$COMPAT_OK" = "no" ]; then
    echo "  [!] WARNING: Client v$LATEST_VERSION requires backend $CLIENT_COMPAT"
    echo "  [!] Your backend is v$BACKEND_VERSION"
    echo "  [!] Update backend first to avoid compatibility issues."
    echo ""
    read -p "  Continue anyway? (y/N): " COMPAT_CONFIRM
    if [ "${COMPAT_CONFIRM,,}" != "y" ]; then
      echo "  Update cancelled."
      exit 0
    fi
    echo ""
  else
    echo "  [OK] Compatible with backend v$BACKEND_VERSION"
    echo ""
  fi
fi

# ── Commits ──

CHANGES=$(git log --oneline "$CURRENT_COMMIT..origin/$BRANCH" 2>/dev/null)
if [ -n "$CHANGES" ]; then
  CHANGE_COUNT=$(echo "$CHANGES" | wc -l)
  echo "  $CHANGE_COUNT new commit(s):"
  echo "$CHANGES" | head -10 | sed 's/^/    /'
  if [ "$CHANGE_COUNT" -gt 10 ]; then
    echo "    ... and $((CHANGE_COUNT - 10)) more"
  fi
  echo ""
fi

read -p "  Update to v$LATEST_VERSION? (Y/n): " CONFIRM
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
echo "  ║  Version: v$LATEST_VERSION"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Deployed to: $WEB_ROOT"
echo ""

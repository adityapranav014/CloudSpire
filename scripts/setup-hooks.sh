#!/bin/sh
# ─────────────────────────────────────────────────────────
# setup-hooks.sh  —  Run this once after cloning CloudSpire
# Usage:  sh scripts/setup-hooks.sh
# ─────────────────────────────────────────────────────────

HOOKS_DIR=".git/hooks"
SRC_DIR="scripts/hooks"

echo ""
echo "📦 Installing CloudSpire Git hooks..."
echo ""

install_hook() {
  name="$1"
  src="$SRC_DIR/$name"
  dst="$HOOKS_DIR/$name"

  if [ -f "$src" ]; then
    cp "$src" "$dst"
    chmod +x "$dst"
    echo "  ✅ Installed: $name"
  else
    echo "  ⚠️  Source not found: $src (skipping)"
  fi
}

install_hook "pre-commit"

echo ""
echo "✔ Git hooks installed. You are protected from accidental commits to main."
echo "  See CONTRIBUTING.md for the full workflow."
echo ""

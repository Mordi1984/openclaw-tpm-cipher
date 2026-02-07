#!/bin/bash
# Backup Script - Create encrypted backup before deploying cipher

set -e

BACKUP_NAME="openclaw-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$HOME/openclaw-backups"

echo "======================================"
echo "  OpenClaw Backup (Pre-Encryption)"
echo "======================================"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: $BACKUP_NAME.tar.gz"
echo ""

# Backup OpenClaw data
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='*.enc' \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/.whatsapp-sessions/ \
  ~/.openclaw/workspace/ \
  ~/.config/openclaw/secrets/ \
  2>/dev/null || true

# Backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)

echo "✅ Backup created!"
echo "   File: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "   Size: $BACKUP_SIZE"
echo ""

# Verify backup
echo "🔍 Verifying backup..."
if tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" >/dev/null 2>&1; then
    echo "   ✅ Backup is valid (tar integrity check passed)"
else
    echo "   ❌ Backup is corrupted!"
    exit 1
fi

# List contents
echo ""
echo "📋 Backup contents:"
tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | head -20
TOTAL_FILES=$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | wc -l)
echo "   ... ($TOTAL_FILES files total)"

echo ""
echo "======================================"
echo "  ✅ Backup Complete!"
echo "======================================"
echo ""
echo "📍 Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📊 Size: $BACKUP_SIZE"
echo "📁 Files: $TOTAL_FILES"
echo ""
echo "⚠️  IMPORTANT: Keep this backup safe!"
echo "   If encryption fails, restore with:"
echo "   tar -xzf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C ~/"
echo ""

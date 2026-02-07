#!/bin/bash
# Restore Script - Restore from backup if encryption fails

set -e

BACKUP_DIR="$HOME/openclaw-backups"

echo "======================================"
echo "  OpenClaw Restore from Backup"
echo "======================================"
echo ""

# Find latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/openclaw-backup-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found in $BACKUP_DIR"
    echo ""
    echo "Available options:"
    echo "1. Restore from specific backup:"
    echo "   tar -xzf /path/to/backup.tar.gz -C ~/"
    echo ""
    echo "2. Restore from .plain.bak files:"
    echo "   find ~/.openclaw -name '*.plain.bak' -exec bash -c 'cp \"\$1\" \"\${1%.plain.bak}\"' _ {} \;"
    exit 1
fi

BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
BACKUP_DATE=$(basename "$LATEST_BACKUP" | sed 's/openclaw-backup-//' | sed 's/.tar.gz//')

echo "📦 Latest backup found:"
echo "   File: $LATEST_BACKUP"
echo "   Size: $BACKUP_SIZE"
echo "   Date: $BACKUP_DATE"
echo ""

# List contents
echo "📋 Backup contains:"
tar -tzf "$LATEST_BACKUP" | head -10
TOTAL_FILES=$(tar -tzf "$LATEST_BACKUP" | wc -l)
echo "   ... ($TOTAL_FILES files total)"
echo ""

# Confirm
read -p "⚠️  This will OVERWRITE current OpenClaw data. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Restoring backup..."

# Stop OpenClaw gateway
if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "   ⏹️  Stopping OpenClaw gateway..."
    systemctl --user stop openclaw-gateway.service
fi

# Create safety backup of current state
SAFETY_BACKUP="$BACKUP_DIR/pre-restore-$(date +%Y%m%d-%H%M%S).tar.gz"
echo "   💾 Creating safety backup: $SAFETY_BACKUP"
tar -czf "$SAFETY_BACKUP" \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/.whatsapp-sessions/ \
  ~/.config/openclaw/secrets/ \
  2>/dev/null || true

# Extract backup
echo "   📂 Extracting backup..."
tar -xzf "$LATEST_BACKUP" -C ~/

echo "   ✅ Files restored"
echo ""

# Verify
if [ -f ~/.openclaw/openclaw.json ]; then
    echo "   ✅ openclaw.json exists"
else
    echo "   ⚠️  openclaw.json not found (check backup contents)"
fi

# Restart gateway
echo ""
echo "🔄 Restarting OpenClaw gateway..."
if systemctl --user is-enabled openclaw-gateway.service >/dev/null 2>&1; then
    systemctl --user start openclaw-gateway.service
    sleep 3
    systemctl --user status openclaw-gateway.service --no-pager
fi

echo ""
echo "======================================"
echo "  ✅ Restore Complete!"
echo "======================================"
echo ""
echo "📍 Restored from: $LATEST_BACKUP"
echo "💾 Safety backup: $SAFETY_BACKUP"
echo ""
echo "🧪 Next steps:"
echo "1. Verify OpenClaw works:"
echo "   openclaw gateway status"
echo ""
echo "2. Test WhatsApp connection:"
echo "   Check if WhatsApp reconnects"
echo ""
echo "3. If issues persist:"
echo "   - Check logs: openclaw logs --tail 50"
echo "   - Restore from older backup: ls -t $BACKUP_DIR/"
echo ""

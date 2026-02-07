#!/bin/bash
# Fix TPM file permissions - Run with: sudo bash fix-tpm-permissions.sh

set -e

CIPHER_DIR="/home/clawdy/.openclaw/.cipher"

echo "🔧 Fixing TPM file permissions..."

# Check if files exist
if [ ! -d "$CIPHER_DIR" ]; then
    echo "❌ Error: $CIPHER_DIR not found!"
    exit 1
fi

# Fix ownership
echo "Changing ownership to clawdy:clawdy..."
chown clawdy:clawdy "$CIPHER_DIR/primary.ctx" 2>/dev/null || echo "  primary.ctx: not found or already fixed"
chown clawdy:clawdy "$CIPHER_DIR/tpm.priv" 2>/dev/null || echo "  tpm.priv: not found or already fixed"
chown clawdy:clawdy "$CIPHER_DIR/tpm.pub" 2>/dev/null || echo "  tpm.pub: not found or already fixed"

# Fix permissions (should be 600)
echo "Fixing permissions to 600..."
chmod 600 "$CIPHER_DIR/primary.ctx" 2>/dev/null || true
chmod 600 "$CIPHER_DIR/tpm.priv" 2>/dev/null || true
chmod 600 "$CIPHER_DIR/tpm.pub" 2>/dev/null || true

echo ""
echo "✅ DONE! Current permissions:"
ls -la "$CIPHER_DIR/"

echo ""
echo "All TPM files should now be owned by clawdy:clawdy with 600 permissions."

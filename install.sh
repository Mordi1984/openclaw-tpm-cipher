#!/bin/bash
# OpenClaw TPM Cipher - Installation Script
# Tested on: Ubuntu 22.04, Debian 12

set -e  # Exit on error

echo "======================================"
echo "  OpenClaw TPM Cipher Installation"
echo "======================================"
echo ""
echo "⚠️  DISCLAIMER / HAFTUNGSAUSSCHLUSS"
echo "======================================"
echo ""
echo "This software is provided 'AS-IS', without any express or implied warranty."
echo "In no event will the authors be held liable for any damages arising from"
echo "the use of this software."
echo ""
echo "Diese Software wird OHNE JEGLICHE AUSDRÜCKLICHE ODER STILLSCHWEIGENDE"
echo "GEWÄHRLEISTUNG bereitgestellt. Die Autoren übernehmen keine Haftung für"
echo "Schäden, die durch die Nutzung dieser Software entstehen."
echo ""
echo "⚠️  WICHTIG:"
echo "   - BACKUP YOUR DATA BEFORE ENCRYPTING!"
echo "   - Test in non-production environment first"
echo "   - Encryption is irreversible without the key"
echo "   - Keep backups of TPM keys (.cipher/ directory)"
echo ""
read -p "Do you accept these terms and have backups? (yes/no): " ACCEPT

if [ "$ACCEPT" != "yes" ]; then
    echo ""
    echo "❌ Installation cancelled."
    echo ""
    echo "📚 Please read the documentation first:"
    echo "   - README.md"
    echo "   - QUICKSTART.md"
    echo "   - docs/SECURITY.md"
    echo ""
    exit 0
fi

echo ""
echo "✅ Terms accepted. Continuing installation..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "⚠️  Please run as root (sudo ./install.sh)"
   exit 1
fi

# Get actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo "📋 Installation Details:"
echo "   User: $ACTUAL_USER"
echo "   Home: $USER_HOME"
echo "   OpenClaw: $USER_HOME/.openclaw"
echo ""

# Check if OpenClaw is installed
if [ ! -d "$USER_HOME/.openclaw" ]; then
    echo "❌ OpenClaw not found at $USER_HOME/.openclaw"
    echo "   Please install OpenClaw first!"
    exit 1
fi

echo "✅ OpenClaw installation found"
echo ""

# Step 1: Install TPM Tools
echo "[1/8] Installing TPM 2.0 Tools..."
apt update -qq
apt install -y tpm2-tools >/dev/null 2>&1
echo "   ✅ tpm2-tools installed ($(tpm2_getcap --version | head -1))"

# Step 2: Add user to tss group
echo "[2/8] Adding user to tss group..."
usermod -a -G tss $ACTUAL_USER
echo "   ✅ User $ACTUAL_USER added to tss group"
echo "   ⚠️  IMPORTANT: User must logout/login for group to take effect!"

# Step 3: Install Node.js dependencies
echo "[3/8] Installing Node.js dependencies..."
cd "$USER_HOME/.openclaw"
sudo -u $ACTUAL_USER npm install argon2 >/dev/null 2>&1
echo "   ✅ argon2 package installed"

# Step 4: Copy cipher modules
echo "[4/8] Installing cipher modules..."
mkdir -p "$USER_HOME/.openclaw/lib"
cp lib/zodiac-cipher.js "$USER_HOME/.openclaw/lib/"
cp lib/tpm-manager.js "$USER_HOME/.openclaw/lib/"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.openclaw/lib/"*.js
chmod 644 "$USER_HOME/.openclaw/lib/"*.js
echo "   ✅ zodiac-cipher.js → ~/.openclaw/lib/"
echo "   ✅ tpm-manager.js → ~/.openclaw/lib/"

# Step 5: Copy scripts
echo "[5/8] Installing scripts..."
mkdir -p "$USER_HOME/.openclaw/workspace"
cp scripts/production-encrypt.js "$USER_HOME/.openclaw/workspace/"
cp scripts/auto-decrypt.js "$USER_HOME/.openclaw/workspace/"
cp scripts/cipher-helper.js "$USER_HOME/.openclaw/"
chown -R $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.openclaw/workspace/"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.openclaw/cipher-helper.js"
chmod +x "$USER_HOME/.openclaw/cipher-helper.js"
echo "   ✅ production-encrypt.js installed"
echo "   ✅ auto-decrypt.js installed"
echo "   ✅ cipher-helper.js installed"

# Step 6: Create cipher directory
echo "[6/8] Creating cipher directory..."
mkdir -p "$USER_HOME/.openclaw/.cipher"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.openclaw/.cipher"
chmod 700 "$USER_HOME/.openclaw/.cipher"
echo "   ✅ ~/.openclaw/.cipher/ created (0700)"

# Step 7: Check TPM availability
echo "[7/8] Testing TPM..."
if [ -e /dev/tpm0 ] || [ -e /dev/tpmrm0 ]; then
    echo "   ✅ TPM device found:"
    ls -l /dev/tpm* 2>/dev/null | sed 's/^/      /'
    
    # Test TPM
    if tpm2_getrandom 16 >/dev/null 2>&1; then
        echo "   ✅ TPM random number generation works"
    else
        echo "   ⚠️  TPM test failed (may need reboot or group login)"
    fi
else
    echo "   ⚠️  No TPM device found (/dev/tpm0)"
    echo "      For VMs: Enable TPM in hypervisor settings"
    echo "      For physical: Enable TPM in BIOS/UEFI"
fi

# Step 8: Generate persistent salt
echo "[8/8] Generating persistent salt..."
if [ ! -f "$USER_HOME/.openclaw/.cipher/salt.bin" ]; then
    sudo -u $ACTUAL_USER dd if=/dev/urandom of="$USER_HOME/.openclaw/.cipher/salt.bin" bs=32 count=1 >/dev/null 2>&1
    chmod 600 "$USER_HOME/.openclaw/.cipher/salt.bin"
    echo "   ✅ Salt generated (32 bytes, 0600)"
else
    echo "   ℹ️  Salt already exists, skipping"
fi

echo ""
echo "======================================"
echo "  ✅ Installation Complete!"
echo "======================================"
echo ""
echo "======================================"
echo "  ⚠️  CRITICAL: CREATE BACKUP NOW!"
echo "======================================"
echo ""
echo "🚨 DO NOT SKIP THIS STEP! 🚨"
echo ""
echo "Encryption is IRREVERSIBLE. If something goes wrong and you don't"
echo "have a backup, YOUR DATA IS LOST FOREVER."
echo ""
echo "Die Verschlüsselung ist NICHT UMKEHRBAR. Ohne Backup sind deine"
echo "Daten bei einem Fehler UNWIEDERBRINGLICH VERLOREN."
echo ""
read -p "Have you created a backup? (yes/no): " HAS_BACKUP

if [ "$HAS_BACKUP" != "yes" ]; then
    echo ""
    echo "⚠️  Creating backup is MANDATORY!"
    echo ""
    echo "Run this command to create a backup:"
    echo ""
    echo "  bash examples/backup-before-encrypt.sh"
    echo ""
    echo "OR manually:"
    echo ""
    echo "  tar -czf ~/openclaw-backup-\$(date +%Y%m%d).tar.gz \\"
    echo "    ~/.openclaw/openclaw.json \\"
    echo "    ~/.openclaw/credentials/ \\"
    echo "    ~/.openclaw/.whatsapp-sessions/ \\"
    echo "    ~/.config/openclaw/secrets/"
    echo ""
    echo "After backup, re-run: sudo ./install.sh"
    echo ""
    exit 1
fi

echo ""
echo "✅ Backup confirmed. Proceeding..."
echo ""
echo "======================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. LOGOUT and LOGIN again (for tss group)"
echo "   sudo su - $ACTUAL_USER"
echo ""
echo "2. TEST TPM access:"
echo "   tpm2_getrandom 32"
echo ""
echo "3. VERIFY backup exists:"
echo "   ls -lh ~/openclaw-backup-*.tar.gz"
echo ""
echo "4. ENCRYPT your data:"
echo "   node ~/.openclaw/workspace/production-encrypt.js"
echo ""
echo "5. TEST auto-decrypt:"
echo "   node ~/.openclaw/workspace/auto-decrypt.js"
echo ""
echo "6. (Optional) Enable boot auto-decrypt:"
echo "   sudo systemctl enable openclaw-decrypt.service"
echo ""
echo "📚 Documentation:"
echo "   README: $(pwd)/README.md"
echo "   Troubleshooting: $(pwd)/docs/TROUBLESHOOTING.md"
echo ""
echo "⚠️  IMPORTANT: Test in non-production first!"
echo ""

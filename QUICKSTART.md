# Quick Start Guide

Get up and running in 5 minutes!

---

## Prerequisites

- Linux system (Ubuntu/Debian)
- OpenClaw installed
- TPM 2.0 (physical or software)
- Root access (for installation only)

---

## Installation (5 Steps)

### 1. Clone Repository
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/openclaw-tpm-cipher.git
cd openclaw-tpm-cipher
```

### 2. Run Installer
```bash
chmod +x install.sh
sudo ./install.sh
```

**Expected output:**
```
✅ tpm2-tools installed
✅ User added to tss group
✅ argon2 package installed
✅ Modules installed
✅ Scripts installed
✅ Cipher directory created
✅ TPM test passed
✅ Salt generated
```

### 3. Logout & Login
```bash
logout
# Login again
```

### 4. Backup Your Data
```bash
cd ~
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/.whatsapp-sessions/ \
  ~/.config/openclaw/secrets/
```

**Verify backup:**
```bash
ls -lh ~/openclaw-backup-*.tar.gz
```

### 5. Encrypt
```bash
node ~/.openclaw/workspace/production-encrypt.js
```

**Expected output:**
```
🔐 Encrypting OpenClaw Production Data...
✅ openclaw.json encrypted (1919 → 1700 bytes)
✅ credentials encrypted
✅ WhatsApp sessions encrypted (893 files)
✅ Secrets directory encrypted (5 keys)
📊 Total: 893 files encrypted
```

---

## Testing

### Test Auto-Decrypt
```bash
node ~/.openclaw/workspace/auto-decrypt.js
```

**Expected:**
- ~9 seconds total
- All files decrypted successfully

### Test WhatsApp Reconnect
```bash
openclaw gateway status
```

**Should show:**
- WhatsApp: Connected ✅

### Test Manual Encrypt/Decrypt
```bash
# Encrypt test file
echo '{"test":"data"}' > /tmp/test.json
node ~/.openclaw/cipher-helper.js encrypt /tmp/test.json

# Decrypt
node ~/.openclaw/cipher-helper.js decrypt /tmp/test.json.enc
cat /tmp/test.json
```

---

## Enable Boot Auto-Decrypt (Optional)

### Create Systemd Service
```bash
sudo cp systemd/openclaw-decrypt.service /etc/systemd/system/
sudo systemctl enable openclaw-decrypt.service
sudo systemctl start openclaw-decrypt.service
```

### Verify Service
```bash
sudo systemctl status openclaw-decrypt.service
```

**Should show:**
- Active (exited)
- No errors

---

## Troubleshooting

### "Permission denied" on TPM
```bash
# Check group membership
groups | grep tss

# If not there, add again
sudo usermod -a -G tss $USER
logout
# Login again
```

### "TPM not found"
```bash
# Check device
ls -l /dev/tpm*

# If missing (VM):
# Enable TPM in hypervisor settings, then reboot
```

### Encrypted file corrupted
```bash
# Restore from backup
cp file.json.plain.bak file.json

# Re-encrypt
node ~/.openclaw/cipher-helper.js encrypt file.json
```

---

## Next Steps

1. ✅ Test reboot → auto-decrypt → OpenClaw start
2. ✅ Monitor logs: `journalctl -u openclaw-decrypt.service`
3. ✅ Backup `.cipher/` directory (contains TPM keys!)
4. ✅ Read full documentation: `docs/ARCHITECTURE.md`

---

## Common Commands

```bash
# Encrypt all data
node ~/.openclaw/workspace/production-encrypt.js

# Decrypt on boot
node ~/.openclaw/workspace/auto-decrypt.js

# Manual encrypt file
node ~/.openclaw/cipher-helper.js encrypt file.json

# Manual decrypt file
node ~/.openclaw/cipher-helper.js decrypt file.json.enc

# Check TPM
tpm2_getcap properties-fixed

# Service status
sudo systemctl status openclaw-decrypt.service
```

---

**🎉 Done! Your OpenClaw is now encrypted with quantum-resistant, hardware-bound security!**

Need help? See [FAQ.md](docs/FAQ.md) or open an issue.

# Troubleshooting Guide

Common issues and their solutions.

---

## TPM Issues

### ❌ "Permission denied" on /dev/tpm0

**Symptoms:**
```
Error: EACCES: permission denied, open '/dev/tpm0'
```

**Solution:**
```bash
# Add user to tss group
sudo usermod -a -G tss $USER

# Verify
groups | grep tss

# Logout and login again (REQUIRED!)
logout
```

**Why?** Group membership only applies after re-login.

---

### ❌ "No TPM device found"

**Symptoms:**
```
ls /dev/tpm*
# No such file or directory
```

**Solution (Physical Machine):**
1. Reboot into BIOS/UEFI
2. Enable TPM/Security Device
3. Save and reboot
4. Verify: `ls -l /dev/tpm*`

**Solution (Virtual Machine):**

**Proxmox/TrueNAS Scale:**
```
1. Shutdown VM
2. VM Settings → Hardware → Add → TPM
3. TPM Version: 2.0
4. Storage: Default
5. Start VM
6. Verify: ls -l /dev/tpm*
```

**VirtualBox:**
```
VBoxManage modifyvm "VM-Name" --tpm-type 2.0
```

**VMware:**
```
VM Settings → Add Hardware → Trusted Platform Module
```

---

### ❌ "TPM primary key not found"

**Symptoms:**
```
Error: primary.ctx does not exist
```

**Solution:**
```bash
# Delete corrupted TPM files
cd ~/.openclaw/.cipher
rm -f primary.ctx tpm.pub tpm.priv tpm.key

# Reinitialize
node ~/.openclaw/workspace/production-encrypt.js
```

**Warning:** Only do this if you have `.plain.bak` backups!

---

### ❌ "TPM unseal failed"

**Symptoms:**
```
Error: tpm2_unseal: failed to unseal
```

**Possible Causes:**
1. TPM was reset
2. Hardware changed
3. Primary key deleted
4. Corrupted private key

**Solution:**
```bash
# Check if TPM is working
tpm2_getrandom 32

# If works, reinitialize cipher
cd ~/.openclaw/.cipher
rm -f *.ctx *.pub *.priv *.key
node ~/.openclaw/workspace/production-encrypt.js
```

---

### ❌ TPM files owned by root

**Symptoms:**
```bash
ls -la ~/.openclaw/.cipher/
# -rw-rw---- root root primary.ctx
# -rw-rw---- root root tpm.pub
# -rw-rw---- root root tpm.priv
```

**Problem:** TPM commands ran with `sudo`, files got root ownership.

**Solution (Manual Fix):**
```bash
# Fix ownership
sudo chown $USER:$USER ~/.openclaw/.cipher/primary.ctx
sudo chown $USER:$USER ~/.openclaw/.cipher/tpm.pub
sudo chown $USER:$USER ~/.openclaw/.cipher/tpm.priv

# Fix permissions
chmod 600 ~/.openclaw/.cipher/primary.ctx
chmod 600 ~/.openclaw/.cipher/tpm.pub
chmod 600 ~/.openclaw/.cipher/tpm.priv

# Verify
ls -la ~/.openclaw/.cipher/
```

**Why does this happen?**
- TPM 2.0 tools require `sudo` to access `/dev/tpm0`
- Files created by `sudo` get root ownership
- **Fixed in v1.0.1+:** tpm-manager.js now auto-fixes ownership after creation

**Prevention:**
- Use v1.0.1+ which auto-fixes ownership
- Or run fix script after initialization:
  ```bash
  sudo bash fix-tpm-permissions.sh
  ```

---

## Encryption Issues

### ❌ "Salt file missing"

**Symptoms:**
```
Error: Cannot read salt.bin
```

**Solution:**
```bash
# Check if salt exists
ls -lh ~/.openclaw/.cipher/salt.bin

# If missing, regenerate (BREAKS EXISTING ENCRYPTION!)
dd if=/dev/urandom of=~/.openclaw/.cipher/salt.bin bs=32 count=1
chmod 600 ~/.openclaw/.cipher/salt.bin

# You MUST re-encrypt all files!
node ~/.openclaw/workspace/production-encrypt.js
```

**Warning:** New salt = different encryption key!

---

### ❌ "Encrypted file corrupted"

**Symptoms:**
```
Error: Invalid Base64 encoding
Error: Decryption failed
```

**Solution:**
```bash
# Restore from backup
cp file.json.plain.bak file.json

# Re-encrypt
node ~/.openclaw/cipher-helper.js encrypt file.json

# Verify
node ~/.openclaw/cipher-helper.js decrypt file.json.enc
cat file.json
```

---

### ❌ "Encrypt/decrypt not symmetrical"

**Symptoms:**
```
Original: {"key":"value"}
Decrypted: garbage or error
```

**Cause:** Salt mismatch or rotor not reset

**Solution:**
```bash
# Verify salt is persistent
ls -lh ~/.openclaw/.cipher/salt.bin
# Should be 32 bytes, 0600 permissions

# Update to latest version
cd ~/openclaw-tpm-cipher
git pull
sudo ./install.sh
```

---

## Performance Issues

### ⏱️ "Auto-decrypt too slow"

**Symptoms:**
```
Boot decrypt: 2+ minutes
```

**Diagnosis:**
```bash
# Time each phase
time tpm2_unseal -c ~/.openclaw/.cipher/key.ctx
# Should be: ~300ms

time node -e "require('argon2').hash('test', {memoryCost:65536})"
# Should be: ~1400ms

# Count encrypted files
find ~/.openclaw -name "*.enc" | wc -l
```

**Solutions:**

**1. Reduce Dataset:**
```bash
# Only encrypt critical files
# Edit production-encrypt.js to exclude large dirs
```

**2. Parallel Decryption:**
```javascript
// In auto-decrypt.js
const workers = 4;
await Promise.all(
  chunks.map(chunk => decryptChunk(chunk))
);
```

**3. Faster CPU:**
```
Argon2id is CPU-bound
Upgrade VM cores or use physical machine
```

---

### 💾 "Out of disk space"

**Symptoms:**
```
Error: ENOSPC: no space left on device
```

**Diagnosis:**
```bash
df -h ~/.openclaw
```

**Solutions:**

**1. Delete .plain.bak backups:**
```bash
find ~/.openclaw -name "*.plain.bak" -delete
find ~/.config/openclaw -name "*.plain.bak" -delete
```

**2. Compress old backups:**
```bash
tar -czf ~/old-backups.tar.gz ~/openclaw-backup-*.tar.gz
rm ~/openclaw-backup-*.tar.gz
```

**3. Expand disk:**
```bash
# VM: Expand virtual disk in hypervisor
# Then: resize partition
sudo resize2fs /dev/sda1
```

---

## OpenClaw Integration Issues

### ❌ "WhatsApp fails to connect after decrypt"

**Symptoms:**
```
WhatsApp: Disconnected (QR code required)
```

**Diagnosis:**
```bash
# Check if sessions were decrypted
ls -lh ~/.openclaw/.whatsapp-sessions/creds.json
# Should exist and not be .enc

# Check manifest
cat ~/.openclaw/.encryption-manifest.json | jq '.stats'
```

**Solution:**
```bash
# Re-decrypt WhatsApp sessions
node ~/.openclaw/workspace/auto-decrypt.js

# Restart gateway
openclaw gateway restart

# Check status
openclaw gateway status
```

---

### ❌ "Gateway fails to start after encryption"

**Symptoms:**
```
Error: Cannot read openclaw.json
Gateway: Offline
```

**Diagnosis:**
```bash
# Check if config was decrypted
ls -lh ~/.openclaw/openclaw.json
# Should exist and be readable JSON

cat ~/.openclaw/openclaw.json | jq .
# Should parse successfully
```

**Solution:**
```bash
# Decrypt config
node ~/.openclaw/workspace/auto-decrypt.js

# Verify
cat ~/.openclaw/openclaw.json | jq . | head

# Restart
openclaw gateway restart
```

---

## Boot Service Issues

### ❌ "Systemd service fails"

**Symptoms:**
```bash
sudo systemctl status openclaw-decrypt.service
# Failed (code=exited, status=1)
```

**Diagnosis:**
```bash
# View logs
sudo journalctl -u openclaw-decrypt.service -n 50

# Test manual decrypt
node ~/.openclaw/workspace/auto-decrypt.js
```

**Common Causes:**

**1. Permission denied:**
```bash
# Service runs as user, check ownership
ls -la ~/.openclaw/.cipher
# Should be owned by your user
```

**2. TPM not ready:**
```bash
# Add delay to service
sudo nano /etc/systemd/system/openclaw-decrypt.service
# Add: ExecStartPre=/bin/sleep 3
sudo systemctl daemon-reload
```

**3. Node.js not in PATH:**
```bash
# Use full path in service
which node
# e.g., /usr/bin/node
# Update service file with full path
```

---

## Backup & Recovery

### ❌ "Lost all encrypted files"

**Symptoms:**
```
Deleted .cipher/ directory by accident
```

**Recovery:**

**If you have .plain.bak files:**
```bash
# Restore from backups
find ~/.openclaw -name "*.plain.bak" -exec bash -c 'cp "$1" "${1%.plain.bak}"' _ {} \;
```

**If you have tar backup:**
```bash
# Extract backup
tar -xzf ~/openclaw-backup-YYYYMMDD.tar.gz -C ~/

# Verify
ls -lh ~/.openclaw/openclaw.json
```

**If no backups:**
```
🚨 DATA LOSS - Cannot recover encrypted files without key
```

---

### ❌ "Corrupted backup"

**Symptoms:**
```
tar: Unexpected EOF
tar: Error is not recoverable
```

**Prevention:**
```bash
# Always verify backups after creation
tar -tzf backup.tar.gz | head
```

**Solution:**
```bash
# Try partial extraction
tar -xzf backup.tar.gz --ignore-command-error

# Use older backup
ls -lt ~/openclaw-backup-*.tar.gz
tar -xzf ~/openclaw-backup-OLDER.tar.gz
```

---

## Security Issues

### ⚠️ "Root can read plaintext in RAM"

**Expected Behavior:** Yes, this is by design.

**Explanation:**
- Plaintext exists in RAM during runtime
- Root can always read process memory
- This is acceptable tradeoff (boot auto-decrypt)

**Mitigation:**
- Don't give root access to untrusted users
- Use full disk encryption (LUKS) for additional layer
- Consider memory encryption (AMD SME, Intel TME)

---

### ⚠️ "TPM can be reset physically"

**Expected Behavior:** Yes, physical access = game over.

**Explanation:**
- Evil maid attack: Physical access to hardware
- Attacker can reset TPM, reinstall OS
- Encrypted data remains inaccessible (without key)

**Mitigation:**
- Physical security (locked server room)
- Boot integrity checks (Secure Boot)
- Tamper-evident seals on hardware

---

## Debugging

### Enable Verbose Logging

**In tpm-manager.js:**
```javascript
const DEBUG = true;
console.log('[TPM] Verbose logs...');
```

**In zodiac-cipher.js:**
```javascript
const DEBUG = true;
console.log('[Cipher] Rotor states...');
```

**In auto-decrypt.js:**
```javascript
const VERBOSE = true;
console.log('[Decrypt] File: ...', progress);
```

---

### Check System State

```bash
# TPM info
tpm2_getcap properties-fixed | grep -A5 "TPM2_PT_FAMILY_INDICATOR"

# Cipher files
ls -lah ~/.openclaw/.cipher/

# Encrypted files count
find ~/.openclaw -name "*.enc" | wc -l

# Manifest
cat ~/.openclaw/.encryption-manifest.json | jq '.stats'

# Service status
sudo systemctl status openclaw-decrypt.service

# Gateway logs
openclaw logs --tail 50
```

---

## Getting Help

### Before Opening Issue

1. ✅ Check this troubleshooting guide
2. ✅ Read FAQ.md
3. ✅ Search existing issues
4. ✅ Collect logs and system info

### System Info Template

```bash
# Run this and paste output in issue
cat << EOF
**System Info:**
- OS: $(lsb_release -d | cut -f2)
- Kernel: $(uname -r)
- Node.js: $(node --version)
- TPM: $(ls /dev/tpm* 2>/dev/null || echo "Not found")
- OpenClaw: $(openclaw --version 2>/dev/null || echo "N/A")

**Cipher Info:**
- Files encrypted: $(cat ~/.openclaw/.encryption-manifest.json 2>/dev/null | jq '.stats.total_files' || echo "N/A")
- Salt exists: $([ -f ~/.openclaw/.cipher/salt.bin ] && echo "Yes" || echo "No")
- TPM key sealed: $([ -f ~/.openclaw/.cipher/tpm.priv ] && echo "Yes" || echo "No")

**Error:**
\`\`\`
[Paste error message here]
\`\`\`
EOF
```

### Open Issue

https://github.com/YOUR_USERNAME/openclaw-tpm-cipher/issues/new

---

**Last Updated:** 2026-02-05  
**Version:** 1.0.0

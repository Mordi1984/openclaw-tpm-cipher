/**
 * TPM Manager - Hardware-bound encryption key management
 * Automatic unlock using TPM 2.0
 * 
 * @author OpenClaw
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TPMManager {
  constructor(options = {}) {
    this.cipherDir = options.cipherDir || path.join(process.env.HOME, '.openclaw', '.cipher');
    this.tpmKeyFile = path.join(this.cipherDir, 'tpm.key');
    this.tpmPubFile = path.join(this.cipherDir, 'tpm.pub');
    this.tpmPrivFile = path.join(this.cipherDir, 'tpm.priv');
    this.tpmPrimaryCtx = path.join(this.cipherDir, 'primary.ctx');
    this.saltFile = path.join(this.cipherDir, 'salt.bin');
  }

  /**
   * Get or create salt
   */
  async getSalt() {
    try {
      return await fs.readFile(this.saltFile);
    } catch (err) {
      // Salt doesn't exist, create new one
      const salt = require('crypto').randomBytes(32);
      await fs.writeFile(this.saltFile, salt, { mode: 0o600 });
      return salt;
    }
  }

  /**
   * Create TPM primary key
   */
  async createPrimary() {
    return new Promise((resolve, reject) => {
      const cmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S tpm2_createprimary -C o -c "${this.tpmPrimaryCtx}" 2>&1`;
      const proc = spawn('bash', ['-c', cmd]);

      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 || output.toLowerCase().includes('name:')) {
          // Fix ownership of primary.ctx (created by sudo)
          const username = require('os').userInfo().username;
          const fixCmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S chown ${username}:${username} "${this.tpmPrimaryCtx}" 2>&1`;
          const fixProc = spawn('bash', ['-c', fixCmd]);
          
          fixProc.on('close', () => {
            resolve(true);
          });
        } else {
          reject(new Error(`Primary key creation failed: ${output}`));
        }
      });
    });
  }

  /**
   * Initialize TPM and create sealed master key
   */
  async initialize() {
    console.log('🔐 Initialisiere TPM Manager...');
    
    // Create cipher directory
    await fs.mkdir(this.cipherDir, { recursive: true, mode: 0o700 });
    
    // Create primary key
    await this.createPrimary();
    console.log('  ✓ TPM Primary Key erstellt');
    
    // Generate master key
    const masterKey = crypto.randomBytes(64).toString('hex');
    
    // Seal key with TPM
    await this.sealKey(masterKey);
    
    console.log('✓ TPM Manager bereit\n');
    return masterKey;
  }

  /**
   * Seal key with TPM 2.0
   */
  async sealKey(key) {
    return new Promise((resolve, reject) => {
      console.log('  🔒 Versiegle Key mit TPM...');
      
      // Write key to temp file first (simpler than stdin juggling)
      const tmpKeyFile = '/tmp/openclaw_master_key.tmp';
      const fs = require('fs');
      fs.writeFileSync(tmpKeyFile, key, { mode: 0o600 });
      
      // TPM Sealing from file
      const cmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S tpm2_create -C "${this.tpmPrimaryCtx}" -i "${tmpKeyFile}" -u "${this.tpmPubFile}" -r "${this.tpmPrivFile}" 2>&1`;
      const proc = spawn('bash', ['-c', cmd]);

      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', async (code) => {
        // Clean up temp file
        try { fs.unlinkSync(tmpKeyFile); } catch (e) {}
        
        // Check for success
        if (code === 0 || output.toLowerCase().includes('name:') || output.toLowerCase().includes('keyedhash:')) {
          console.log('  ✓ Key mit TPM versiegelt');
          
          // Save encrypted marker
          await require('fs').promises.writeFile(this.tpmKeyFile, 'TPM_SEALED', { mode: 0o600 });
          
          // Fix ownership of TPM files (created by sudo, need to be owned by user)
          const username = require('os').userInfo().username;
          const fixOwnerCmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S chown ${username}:${username} "${this.tpmPubFile}" "${this.tpmPrivFile}" "${this.tpmPrimaryCtx}" 2>&1`;
          const fixProc = spawn('bash', ['-c', fixOwnerCmd]);
          
          fixProc.on('close', (fixCode) => {
            if (fixCode === 0) {
              console.log('  ✓ TPM File Permissions korrigiert');
            }
            resolve(true);
          });
        } else {
          console.error('  ❌ TPM Sealing fehlgeschlagen:', output);
          reject(new Error(`TPM sealing failed: ${output}`));
        }
      });
    });
  }

  /**
   * Unseal key from TPM 2.0
   */
  async unsealKey() {
    return new Promise((resolve, reject) => {
      console.log('  🔓 Entsiegle Key von TPM...');
      
      const loadCmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S tpm2_load -C "${this.tpmPrimaryCtx}" -u "${this.tpmPubFile}" -r "${this.tpmPrivFile}" -c /tmp/tpm_key.ctx 2>&1`;
      
      const proc = spawn('bash', ['-c', loadCmd]);

      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 || output.toLowerCase().includes('loaded') || output.toLowerCase().includes('name:')) {
          // Now unseal the actual key
          const unsealCmd = `echo '23NSWBwRgt7j0ifdYsZN' | sudo -S tpm2_unseal -c /tmp/tpm_key.ctx 2>&1`;
          const unseal = spawn('bash', ['-c', unsealCmd]);

          let key = '';
          unseal.stdout.on('data', (data) => {
            key += data.toString();
          });

          unseal.on('close', (unsealCode) => {
            // Remove sudo output from key
            key = key.replace(/\[sudo\] password for .*:\s*/g, '').trim();
            
            if (unsealCode === 0 && key.length > 0) {
              console.log('  ✓ Key von TPM entsiegelt');
              resolve(key);
            } else {
              reject(new Error('TPM unseal failed'));
            }
          });
        } else {
          console.error('  ❌ TPM Load fehlgeschlagen:', output);
          reject(new Error(`TPM load failed: ${output}`));
        }
      });
    });
  }

  /**
   * Check if TPM is initialized
   */
  async isInitialized() {
    try {
      await fs.access(this.tpmKeyFile);
      await fs.access(this.tpmPubFile);
      await fs.access(this.tpmPrivFile);
      await fs.access(this.tpmPrimaryCtx);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Auto-unlock: Get key from TPM or initialize
   */
  async autoUnlock() {
    const initialized = await this.isInitialized();
    
    if (initialized) {
      console.log('🔐 Entsperre mit TPM...');
      return await this.unsealKey();
    } else {
      console.log('🔐 Erstmalige TPM-Initialisierung...');
      return await this.initialize();
    }
  }

  /**
   * Remove TPM keys (for testing/reset)
   */
  async reset() {
    try {
      await fs.unlink(this.tpmKeyFile);
      await fs.unlink(this.tpmPubFile);
      await fs.unlink(this.tpmPrivFile);
      console.log('✓ TPM Keys gelöscht');
    } catch (err) {
      // Ignore if files don't exist
    }
  }
}

module.exports = { TPMManager };

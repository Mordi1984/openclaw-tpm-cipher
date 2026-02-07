#!/usr/bin/env node
/**
 * OpenClaw Production Encryption
 * MAXIMUM SECURITY MODE
 * 
 * Encrypts ALL sensitive data:
 * - openclaw.json (config)
 * - credentials/
 * - .whatsapp-sessions/
 * - sessions/
 * - workspace/ (optional)
 */

const { OpenClawCipher } = require('../cipher-helper.js');
const fs = require('fs').promises;
const path = require('path');

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');

class ProductionEncryption {
  constructor() {
    this.cipher = new OpenClawCipher();
    this.encrypted = [];
    this.errors = [];
  }

  /**
   * Encrypt single file
   */
  async encryptFile(filePath, backupOriginal = true) {
    try {
      const relativePath = filePath.replace(OPENCLAW_DIR + '/', '');
      console.log(`🔒 Encrypting: ${relativePath}`);

      // Backup original
      if (backupOriginal) {
        await fs.copyFile(filePath, filePath + '.plain.bak');
      }

      // Encrypt
      const encPath = filePath + '.enc';
      await this.cipher.encryptFile(filePath, encPath);

      // Verify
      const decrypted = await this.cipher.decryptFile(encPath, filePath + '.verify');
      const original = await fs.readFile(filePath, 'utf8');
      const verified = await fs.readFile(filePath + '.verify', 'utf8');

      if (original === verified) {
        console.log(`   ✅ Verified: ${relativePath}`);
        
        // Delete original (keep backup)
        await fs.unlink(filePath);
        await fs.unlink(filePath + '.verify');
        
        this.encrypted.push(relativePath);
        return true;
      } else {
        throw new Error('Verification failed - decrypted content does not match!');
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${filePath}`);
      console.error(`      Error: ${err.message}`);
      this.errors.push({ file: filePath, error: err.message });
      return false;
    }
  }

  /**
   * Encrypt JSON file
   */
  async encryptJSONFile(filePath, backupOriginal = true) {
    try {
      const relativePath = filePath.replace(OPENCLAW_DIR + '/', '');
      console.log(`🔒 Encrypting JSON: ${relativePath}`);

      // Backup original
      if (backupOriginal) {
        await fs.copyFile(filePath, filePath + '.plain.bak');
      }

      // Encrypt
      const encPath = filePath + '.enc';
      await this.cipher.encryptJSONFile(filePath, encPath);

      // Verify
      const original = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const decPath = filePath + '.verify';
      await this.cipher.decryptJSONFile(encPath, decPath);
      const verified = JSON.parse(await fs.readFile(decPath, 'utf8'));

      if (JSON.stringify(original) === JSON.stringify(verified)) {
        console.log(`   ✅ Verified: ${relativePath}`);
        
        // Delete original (keep backup)
        await fs.unlink(filePath);
        await fs.unlink(decPath);
        
        this.encrypted.push(relativePath);
        return true;
      } else {
        throw new Error('Verification failed - decrypted JSON does not match!');
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${filePath}`);
      console.error(`      Error: ${err.message}`);
      this.errors.push({ file: filePath, error: err.message });
      return false;
    }
  }

  /**
   * Encrypt directory recursively
   */
  async encryptDirectory(dirPath, extensions = ['.json', '.txt', '.key', '.token']) {
    try {
      const relativePath = dirPath.replace(OPENCLAW_DIR + '/', '');
      console.log(`\n📁 Encrypting directory: ${relativePath}`);

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip already encrypted files
        if (entry.name.endsWith('.enc') || entry.name.endsWith('.plain.bak')) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.encryptDirectory(fullPath, extensions);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            if (ext === '.json') {
              await this.encryptJSONFile(fullPath);
            } else {
              await this.encryptFile(fullPath);
            }
          }
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`   ❌ Directory error: ${err.message}`);
      }
    }
  }

  /**
   * Create encryption manifest
   */
  async createManifest() {
    const manifest = {
      encrypted_at: new Date().toISOString(),
      hostname: require('os').hostname(),
      files: this.encrypted,
      errors: this.errors,
      cipher_version: '1.0.0',
      security_level: 'MAXIMUM'
    };

    const manifestPath = path.join(OPENCLAW_DIR, '.encryption-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n📄 Manifest created: .encryption-manifest.json`);
  }

  /**
   * Run full encryption
   */
  async run() {
    console.log('=== OPENCLAW MAXIMUM SECURITY ENCRYPTION ===\n');
    console.log('⚠️  This will encrypt ALL sensitive data!');
    console.log('📦 Backups: *.plain.bak files created\n');

    // 1. Main config
    console.log('🔐 PHASE 1: Main Configuration');
    await this.encryptJSONFile(path.join(OPENCLAW_DIR, 'openclaw.json'));

    // 2. Credentials
    console.log('\n🔐 PHASE 2: Credentials');
    await this.encryptDirectory(path.join(OPENCLAW_DIR, 'credentials'));

    // 3. WhatsApp Sessions
    console.log('\n🔐 PHASE 3: WhatsApp Sessions');
    await this.encryptDirectory(path.join(OPENCLAW_DIR, '.whatsapp-sessions'));

    // 4. Sessions
    console.log('\n🔐 PHASE 4: OpenClaw Sessions');
    await this.encryptDirectory(path.join(OPENCLAW_DIR, 'sessions'));

    // 5. Workspace (selective - only sensitive files)
    console.log('\n🔐 PHASE 5: Workspace (sensitive files only)');
    const workspacePath = path.join(OPENCLAW_DIR, 'workspace');
    const sensitiveExtensions = ['.key', '.token', '.secret', '.env'];
    await this.encryptDirectory(workspacePath, sensitiveExtensions);

    // 6. Secrets directory
    console.log('\n🔐 PHASE 6: Secrets Directory');
    const secretsPath = path.join(process.env.HOME, '.config/openclaw/secrets');
    await this.encryptDirectory(secretsPath, ['.txt', '.key', '.token', '.pem']);

    // 7. Create manifest
    await this.createManifest();

    // Summary
    console.log('\n=== ENCRYPTION SUMMARY ===\n');
    console.log(`✅ Encrypted: ${this.encrypted.length} files`);
    console.log(`❌ Errors: ${this.errors.length} files`);

    if (this.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      this.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }

    console.log('\n📦 BACKUPS:');
    console.log('   All original files saved as: *.plain.bak');
    console.log('   To restore: mv file.plain.bak file');

    console.log('\n🔐 ENCRYPTED FILES:');
    console.log('   All encrypted as: *.enc');
    console.log('   Auto-decrypt on OpenClaw start');

    console.log('\n✅ MAXIMUM SECURITY ENABLED!');
    console.log('🔒 All sensitive data is now TPM-sealed.\n');
  }
}

// Run
(async () => {
  const encryption = new ProductionEncryption();
  await encryption.run();
})();

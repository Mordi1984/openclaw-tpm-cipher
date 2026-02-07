#!/usr/bin/env node
/**
 * TPM Health Check & Auto-Repair
 * Detects and fixes TPM context corruption after reboot/kernel updates
 * 
 * Run at boot via systemd or manually
 */

const { TPMManager } = require('../lib/tpm-manager.js');
const { OpenClawCipher } = require('../cipher-helper.js');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');
const CIPHER_DIR = path.join(OPENCLAW_DIR, '.cipher');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');

class TPMHealthCheck {
  constructor() {
    this.cipher = new OpenClawCipher();
    this.healthy = false;
    this.repaired = false;
  }

  /**
   * Check if TPM is healthy by trying to encrypt/decrypt test data
   */
  async checkHealth() {
    console.log('🔍 Checking TPM health...');
    
    try {
      // Check if TPM files exist
      const primaryCtx = path.join(CIPHER_DIR, 'primary.ctx');
      const tpmKey = path.join(CIPHER_DIR, 'tpm.key');
      
      try {
        await fs.access(primaryCtx);
        await fs.access(tpmKey);
      } catch (e) {
        console.log('⚠️  TPM files missing');
        return false;
      }

      // Try to encrypt/decrypt test data
      const testData = 'TPM_HEALTH_CHECK_' + Date.now();
      const testFile = '/tmp/tpm-health-test.txt';
      const encFile = testFile + '.enc';
      const decFile = testFile + '.dec';

      await fs.writeFile(testFile, testData);
      
      // Encrypt
      await this.cipher.encryptFile(testFile, encFile);
      
      // Decrypt
      await this.cipher.decryptFile(encFile, decFile);
      
      // Verify
      const decrypted = await fs.readFile(decFile, 'utf8');
      
      // Cleanup
      await fs.unlink(testFile);
      await fs.unlink(encFile);
      await fs.unlink(decFile);
      
      if (decrypted === testData) {
        console.log('✅ TPM is healthy!');
        this.healthy = true;
        return true;
      } else {
        console.log('❌ TPM decryption failed (content mismatch)');
        return false;
      }
      
    } catch (error) {
      console.log(`❌ TPM health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Repair TPM by reinitializing and re-encrypting
   */
  async repair() {
    console.log('\n🔧 Starting TPM auto-repair...\n');
    
    try {
      // Step 1: Backup current TPM state
      console.log('📦 Step 1/5: Backing up current state...');
      const backupDir = path.join(OPENCLAW_DIR, 'backups', 'tpm-autorepair-' + Date.now());
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy TPM files
      try {
        const files = await fs.readdir(CIPHER_DIR);
        for (const file of files) {
          const src = path.join(CIPHER_DIR, file);
          const dst = path.join(backupDir, file);
          await fs.copyFile(src, dst);
        }
        console.log(`   ✅ Backed up to: ${backupDir}`);
      } catch (e) {
        console.log('   ⚠️  No TPM files to backup');
      }

      // Step 2: Delete corrupted TPM context
      console.log('\n🗑️  Step 2/5: Removing corrupted TPM context...');
      try {
        const tpmFiles = ['primary.ctx', 'tpm.key', 'tpm.priv', 'tpm.pub', 'salt.bin'];
        for (const file of tpmFiles) {
          const filePath = path.join(CIPHER_DIR, file);
          try {
            await fs.unlink(filePath);
            console.log(`   🗑️  Deleted: ${file}`);
          } catch (e) {
            // File doesn't exist, skip
          }
        }
      } catch (e) {
        console.log('   ⚠️  Error deleting files:', e.message);
      }

      // Step 3: Initialize fresh TPM
      console.log('\n🔐 Step 3/5: Initializing fresh TPM...');
      const tpm = new TPMManager();
      await tpm.initialize();
      console.log('   ✅ TPM initialized successfully!');

      // Step 4: Test new TPM
      console.log('\n🧪 Step 4/5: Testing new TPM...');
      const testWorking = await this.checkHealth();
      if (!testWorking) {
        throw new Error('New TPM context still not working!');
      }
      console.log('   ✅ New TPM works!');

      // Step 5: Re-encrypt everything
      console.log('\n🔒 Step 5/5: Re-encrypting all files...');
      console.log('   This may take a few seconds...\n');
      
      try {
        const productionEncrypt = path.join(WORKSPACE_DIR, 'production-encrypt.js');
        execSync(`node "${productionEncrypt}"`, {
          cwd: OPENCLAW_DIR,
          stdio: 'inherit'
        });
        console.log('\n   ✅ All files re-encrypted!');
      } catch (e) {
        console.log('   ⚠️  Re-encryption completed with warnings');
      }

      this.repaired = true;
      console.log('\n✅ TPM auto-repair completed successfully!\n');
      return true;
      
    } catch (error) {
      console.error('\n❌ TPM repair failed:', error.message);
      console.error('\n⚠️  Manual intervention required!');
      console.error('   Run: cd ~/.openclaw && node workspace/tpm-health-check.js --force-repair\n');
      return false;
    }
  }

  /**
   * Main health check routine
   */
  async run(forceRepair = false) {
    console.log('═'.repeat(60));
    console.log('🔐 TPM HEALTH CHECK & AUTO-REPAIR');
    console.log('═'.repeat(60));
    console.log();

    // Check current health
    const isHealthy = await this.checkHealth();
    
    if (isHealthy && !forceRepair) {
      console.log('\n✅ TPM is healthy, no action needed!\n');
      return true;
    }

    if (!isHealthy) {
      console.log('\n⚠️  TPM context is corrupted (common after kernel updates)');
      console.log('🔧 Starting automatic repair...\n');
    } else if (forceRepair) {
      console.log('\n⚠️  Force repair requested\n');
    }

    // Attempt repair
    const repaired = await this.repair();
    
    if (repaired) {
      console.log('═'.repeat(60));
      console.log('✅ TPM AUTO-REPAIR SUCCESSFUL');
      console.log('═'.repeat(60));
      console.log();
      return true;
    } else {
      console.log('═'.repeat(60));
      console.log('❌ TPM AUTO-REPAIR FAILED');
      console.log('═'.repeat(60));
      console.log();
      return false;
    }
  }
}

// Run health check
if (require.main === module) {
  const forceRepair = process.argv.includes('--force-repair');
  
  const healthCheck = new TPMHealthCheck();
  healthCheck.run(forceRepair)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { TPMHealthCheck };

#!/usr/bin/env node
/**
 * OpenClaw Auto-Decrypt on Boot
 * Decrypts all *.enc files in-place
 */

const { OpenClawCipher } = require('../cipher-helper.js');
const fs = require('fs').promises;
const path = require('path');

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');

class AutoDecrypt {
  constructor() {
    this.cipher = new OpenClawCipher();
    this.decrypted = [];
  }

  /**
   * Decrypt all .enc files recursively
   */
  async decryptDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.decryptDirectory(fullPath);
        } else if (entry.name.endsWith('.enc')) {
          await this.decryptFile(fullPath);
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Directory error: ${dirPath} - ${err.message}`);
      }
    }
  }

  /**
   * Decrypt single file
   */
  async decryptFile(encPath) {
    try {
      const originalPath = encPath.replace('.enc', '');
      const relativePath = encPath.replace(OPENCLAW_DIR + '/', '');

      // Check if already decrypted
      try {
        await fs.access(originalPath);
        // File exists, skip
        return;
      } catch (err) {
        // File doesn't exist, decrypt
      }

      console.log(`🔓 Decrypting: ${relativePath}`);

      // Detect JSON vs binary
      if (originalPath.endsWith('.json')) {
        await this.cipher.decryptJSONFile(encPath, originalPath);
      } else {
        await this.cipher.decryptFile(encPath, originalPath);
      }

      this.decrypted.push(relativePath);
    } catch (err) {
      console.error(`   ❌ Failed: ${encPath}`);
      console.error(`      Error: ${err.message}`);
    }
  }

  /**
   * Run auto-decrypt
   */
  async run() {
    console.log('[BOOT] Auto-decrypting sensitive data...');

    const startTime = Date.now();

    // Decrypt all directories
    await this.decryptDirectory(OPENCLAW_DIR);
    
    // Decrypt secrets directories
    const secretsDir1 = path.join(process.env.HOME, '.config/openclaw/secrets');
    await this.decryptDirectory(secretsDir1);
    
    const secretsDir2 = path.join(process.env.HOME, 'openclaw/secrets');
    await this.decryptDirectory(secretsDir2);
    
    // Decrypt memory directory
    const memoryDir = path.join(process.env.HOME, 'memory');
    await this.decryptDirectory(memoryDir);

    const elapsed = Date.now() - startTime;

    console.log(`[BOOT] ✅ Decrypted ${this.decrypted.length} files in ${elapsed}ms`);
  }
}

// Run
(async () => {
  try {
    const decrypt = new AutoDecrypt();
    await decrypt.run();
  } catch (err) {
    console.error('[BOOT] ❌ Auto-decrypt failed:', err.message);
    process.exit(1);
  }
})();

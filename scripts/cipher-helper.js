#!/usr/bin/env node
/**
 * OpenClaw Cipher Helper
 * Production-ready encryption/decryption utilities
 */

const { ZodiacCipher } = require('./lib/zodiac-cipher.js');
const { TPMManager } = require('./lib/tpm-manager.js');
const fs = require('fs').promises;
const path = require('path');

class OpenClawCipher {
  constructor() {
    this.cipher = null;
    this.initialized = false;
  }

  /**
   * Initialize cipher with TPM auto-unlock
   */
  async initialize() {
    if (this.initialized) return;

    const tpm = new TPMManager();
    const masterKey = await tpm.autoUnlock();
    const salt = await tpm.getSalt();  // Get or create salt
    
    this.cipher = new ZodiacCipher(masterKey, { salt });
    await this.cipher.initialize();
    
    this.initialized = true;
  }

  /**
   * Encrypt file
   */
  async encryptFile(inputPath, outputPath) {
    await this.initialize();
    
    const data = await fs.readFile(inputPath, 'utf8');
    const encrypted = this.cipher.encryptToBase64(data);
    
    await fs.writeFile(outputPath, encrypted, { mode: 0o600 });
    return outputPath;
  }

  /**
   * Decrypt file
   */
  async decryptFile(inputPath, outputPath) {
    await this.initialize();
    
    const encrypted = await fs.readFile(inputPath, 'utf8');
    const decrypted = this.cipher.decryptFromBase64(encrypted);
    
    await fs.writeFile(outputPath, decrypted, { mode: 0o600 });
    return outputPath;
  }

  /**
   * Encrypt JSON file
   */
  async encryptJSONFile(inputPath, outputPath) {
    await this.initialize();
    
    const data = await fs.readFile(inputPath, 'utf8');
    const json = JSON.parse(data);
    const encrypted = this.cipher.encryptJSON(json);
    
    await fs.writeFile(outputPath, encrypted, { mode: 0o600 });
    return outputPath;
  }

  /**
   * Decrypt JSON file
   */
  async decryptJSONFile(inputPath, outputPath) {
    await this.initialize();
    
    const encrypted = await fs.readFile(inputPath, 'utf8');
    const decrypted = this.cipher.decryptJSON(encrypted);  // decryptJSON handles reset
    
    const pretty = JSON.stringify(decrypted, null, 2);
    await fs.writeFile(outputPath, pretty, { mode: 0o600 });
    return outputPath;
  }

  /**
   * Encrypt string
   */
  async encryptString(data) {
    await this.initialize();
    return this.cipher.encryptToBase64(data);
  }

  /**
   * Decrypt string
   */
  async decryptString(encrypted) {
    await this.initialize();
    return this.cipher.decryptFromBase64(encrypted).toString('utf8');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const helper = new OpenClawCipher();

  try {
    switch (command) {
      case 'encrypt':
        if (args.length < 3) {
          console.error('Usage: cipher-helper.js encrypt <input> <output>');
          process.exit(1);
        }
        await helper.encryptFile(args[1], args[2]);
        console.log('✅ Encrypted:', args[2]);
        break;

      case 'decrypt':
        if (args.length < 3) {
          console.error('Usage: cipher-helper.js decrypt <input> <output>');
          process.exit(1);
        }
        await helper.decryptFile(args[1], args[2]);
        console.log('✅ Decrypted:', args[2]);
        break;

      case 'encrypt-json':
        if (args.length < 3) {
          console.error('Usage: cipher-helper.js encrypt-json <input.json> <output.enc>');
          process.exit(1);
        }
        await helper.encryptJSONFile(args[1], args[2]);
        console.log('✅ Encrypted JSON:', args[2]);
        break;

      case 'decrypt-json':
        if (args.length < 3) {
          console.error('Usage: cipher-helper.js decrypt-json <input.enc> <output.json>');
          process.exit(1);
        }
        await helper.decryptJSONFile(args[1], args[2]);
        console.log('✅ Decrypted JSON:', args[2]);
        break;

      case 'test':
        console.log('=== Cipher Helper Test ===\n');
        await helper.initialize();
        console.log('✅ Cipher initialized');
        
        const testStr = 'OpenClaw Test Message';
        const encrypted = await helper.encryptString(testStr);
        console.log('✅ Encrypted:', encrypted.substring(0, 40) + '...');
        
        const decrypted = await helper.decryptString(encrypted);
        console.log('✅ Decrypted:', decrypted);
        
        if (decrypted === testStr) {
          console.log('🎉 Test passed!');
        } else {
          console.log('❌ Test failed!');
        }
        break;

      default:
        console.log('OpenClaw Cipher Helper\n');
        console.log('Commands:');
        console.log('  encrypt <input> <output>          Encrypt file');
        console.log('  decrypt <input> <output>          Decrypt file');
        console.log('  encrypt-json <input> <output>     Encrypt JSON file');
        console.log('  decrypt-json <input> <output>     Decrypt JSON file');
        console.log('  test                              Run test');
        console.log('\nExamples:');
        console.log('  node cipher-helper.js encrypt-json ~/.openclaw/openclaw.json config.enc');
        console.log('  node cipher-helper.js decrypt-json config.enc openclaw.json');
        break;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Export for use as library
if (require.main === module) {
  main();
} else {
  module.exports = { OpenClawCipher };
}

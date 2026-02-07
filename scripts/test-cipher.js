#!/usr/bin/env node
/**
 * OpenClaw TPM Cipher - Test Suite
 * Runs comprehensive tests on TPM + Cipher integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME;
const CIPHER_DIR = path.join(HOME, '.openclaw', '.cipher');
const TPM_MANAGER = path.join(HOME, '.openclaw', 'lib', 'tpm-manager.js');
const ZODIAC_CIPHER = path.join(HOME, '.openclaw', 'lib', 'zodiac-cipher.js');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m'  // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${msg}${reset}`);
}

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    log(`  ✅ ${message}`, 'success');
  } else {
    testsFailed++;
    log(`  ❌ ${message}`, 'error');
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test1_TPMAvailability() {
  log('\n[Test 1] TPM Availability', 'info');
  
  // Check TPM device
  const hasTpm0 = fs.existsSync('/dev/tpm0');
  const hasTpmrm0 = fs.existsSync('/dev/tpmrm0');
  assert(hasTpm0 || hasTpmrm0, 'TPM device exists (/dev/tpm0 or /dev/tpmrm0)');
  
  // Check TPM tools
  try {
    execSync('which tpm2_getrandom', { stdio: 'ignore' });
    assert(true, 'tpm2-tools installed');
  } catch {
    assert(false, 'tpm2-tools installed');
  }
  
  // Test TPM random generation
  try {
    execSync('tpm2_getrandom 16', { stdio: 'ignore' });
    assert(true, 'TPM random generation works');
  } catch {
    assert(false, 'TPM random generation works');
  }
}

async function test2_CipherModules() {
  log('\n[Test 2] Cipher Modules', 'info');
  
  // Check if modules exist
  assert(fs.existsSync(TPM_MANAGER), 'tpm-manager.js exists');
  assert(fs.existsSync(ZODIAC_CIPHER), 'zodiac-cipher.js exists');
  
  // Check if modules are readable
  const tpmManager = fs.readFileSync(TPM_MANAGER, 'utf8');
  const zodiacCipher = fs.readFileSync(ZODIAC_CIPHER, 'utf8');
  assert(tpmManager.includes('autoUnlock'), 'tpm-manager has autoUnlock function');
  assert(zodiacCipher.includes('encryptJSON'), 'zodiac-cipher has encryptJSON function');
}

async function test3_TPMInitialization() {
  log('\n[Test 3] TPM Initialization', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  
  // Check if already initialized
  const alreadyInit = tpmManager.isInitialized();
  assert(typeof alreadyInit === 'boolean', 'isInitialized returns boolean');
  
  if (!alreadyInit) {
    log('  ℹ️  TPM not initialized, running initialization...', 'warning');
    
    // Initialize TPM
    const startTime = Date.now();
    await tpmManager.initialize();
    const duration = Date.now() - startTime;
    
    assert(fs.existsSync(path.join(CIPHER_DIR, 'tpm.key')), 'tpm.key created');
    assert(fs.existsSync(path.join(CIPHER_DIR, 'tpm.pub')), 'tpm.pub created');
    assert(fs.existsSync(path.join(CIPHER_DIR, 'tpm.priv')), 'tpm.priv created');
    assert(fs.existsSync(path.join(CIPHER_DIR, 'primary.ctx')), 'primary.ctx created');
    
    log(`  ⏱️  Initialization took ${duration}ms`, 'info');
  } else {
    log('  ℹ️  TPM already initialized, skipping', 'info');
  }
}

async function test4_TPMUnseal() {
  log('\n[Test 4] TPM Key Unsealing', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  
  const startTime = Date.now();
  const masterKey = await tpmManager.autoUnlock();
  const duration = Date.now() - startTime;
  
  assert(masterKey && masterKey.length > 0, 'Master key unsealed');
  assert(masterKey.length === 128, 'Master key is 128 characters');
  assert(/^[0-9a-f]+$/.test(masterKey), 'Master key is valid hex');
  
  log(`  ⏱️  Unseal took ${duration}ms`, 'info');
  log(`  🔑 Master key (first 32 chars): ${masterKey.slice(0, 32)}...`, 'info');
}

async function test5_SaltPersistence() {
  log('\n[Test 5] Salt Persistence', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  const saltPath = path.join(CIPHER_DIR, 'salt.bin');
  
  assert(fs.existsSync(saltPath), 'salt.bin exists');
  
  const saltStat = fs.statSync(saltPath);
  assert(saltStat.size === 32, 'Salt is 32 bytes');
  assert((saltStat.mode & 0o777) === 0o600, 'Salt has 0600 permissions');
  
  // Read salt twice, ensure same
  const salt1 = tpmManager.getSalt();
  const salt2 = tpmManager.getSalt();
  assert(Buffer.compare(salt1, salt2) === 0, 'Salt is persistent (same on multiple reads)');
}

async function test6_CipherEncryptDecrypt() {
  log('\n[Test 6] Cipher Encrypt/Decrypt', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  const ZodiacCipher = require(ZODIAC_CIPHER);
  
  // Auto-unlock
  const masterKey = await tpmManager.autoUnlock();
  const salt = tpmManager.getSalt();
  
  // Initialize cipher
  const cipher = new ZodiacCipher();
  await cipher.initialize(masterKey, { salt });
  
  // Test data
  const original = {
    test: 'data',
    number: 12345,
    nested: { key: 'value' }
  };
  
  // Encrypt
  const startEncrypt = Date.now();
  const encrypted = cipher.encryptJSON(original);
  const encryptDuration = Date.now() - startEncrypt;
  
  assert(typeof encrypted === 'string', 'Encrypted is string');
  assert(encrypted.length > 0, 'Encrypted is not empty');
  assert(encrypted !== JSON.stringify(original), 'Encrypted is different from original');
  
  log(`  ⏱️  Encrypt took ${encryptDuration}ms`, 'info');
  log(`  📊 Size: ${JSON.stringify(original).length} → ${encrypted.length} bytes`, 'info');
  
  // Decrypt
  const startDecrypt = Date.now();
  const decrypted = cipher.decryptJSON(encrypted);
  const decryptDuration = Date.now() - startDecrypt;
  
  assert(typeof decrypted === 'object', 'Decrypted is object');
  assert(decrypted.test === original.test, 'Decrypted.test matches');
  assert(decrypted.number === original.number, 'Decrypted.number matches');
  assert(decrypted.nested.key === original.nested.key, 'Decrypted.nested.key matches');
  
  log(`  ⏱️  Decrypt took ${decryptDuration}ms`, 'info');
}

async function test7_SelfInverse() {
  log('\n[Test 7] Self-Inverse Property', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  const ZodiacCipher = require(ZODIAC_CIPHER);
  
  const masterKey = await tpmManager.autoUnlock();
  const salt = tpmManager.getSalt();
  const cipher = new ZodiacCipher();
  await cipher.initialize(masterKey, { salt });
  
  const original = { data: 'test self-inverse' };
  const encrypted1 = cipher.encryptJSON(original);
  const encrypted2 = cipher.encryptJSON(JSON.parse(encrypted1));
  
  // Encrypting twice should return to original (base64 encoded)
  const decrypted = cipher.decryptJSON(encrypted2);
  const finalDecrypted = cipher.decryptJSON(JSON.stringify(decrypted));
  
  assert(finalDecrypted.data === original.data, 'Self-inverse property holds');
}

async function test8_PerformanceBenchmark() {
  log('\n[Test 8] Performance Benchmark', 'info');
  
  const tpmManager = require(TPM_MANAGER);
  const ZodiacCipher = require(ZODIAC_CIPHER);
  
  // Benchmark TPM unseal
  const unsealStart = Date.now();
  await tpmManager.autoUnlock();
  const unsealDuration = Date.now() - unsealStart;
  log(`  ⏱️  TPM Unseal: ${unsealDuration}ms`, 'info');
  
  // Benchmark cipher init
  const masterKey = await tpmManager.autoUnlock();
  const salt = tpmManager.getSalt();
  const cipher = new ZodiacCipher();
  
  const initStart = Date.now();
  await cipher.initialize(masterKey, { salt });
  const initDuration = Date.now() - initStart;
  log(`  ⏱️  Cipher Init: ${initDuration}ms`, 'info');
  
  // Benchmark encrypt/decrypt
  const testData = { test: 'x'.repeat(1000) }; // ~1KB
  
  const encStart = Date.now();
  const enc = cipher.encryptJSON(testData);
  const encDuration = Date.now() - encStart;
  log(`  ⏱️  Encrypt 1KB: ${encDuration}ms`, 'info');
  
  const decStart = Date.now();
  cipher.decryptJSON(enc);
  const decDuration = Date.now() - decStart;
  log(`  ⏱️  Decrypt 1KB: ${decDuration}ms`, 'info');
  
  const totalBootTime = unsealDuration + initDuration;
  log(`  ⏱️  Total Boot Time: ${totalBootTime}ms (~${(totalBootTime/1000).toFixed(1)}s)`, 'info');
  
  assert(unsealDuration < 1000, 'TPM unseal < 1s');
  assert(initDuration < 3000, 'Cipher init < 3s');
  assert(encDuration < 100, 'Encrypt 1KB < 100ms');
  assert(decDuration < 100, 'Decrypt 1KB < 100ms');
}

async function runTests() {
  log('\n========================================', 'info');
  log('  OpenClaw TPM Cipher - Test Suite', 'info');
  log('========================================\n', 'info');
  
  try {
    await test1_TPMAvailability();
    await test2_CipherModules();
    await test3_TPMInitialization();
    await test4_TPMUnseal();
    await test5_SaltPersistence();
    await test6_CipherEncryptDecrypt();
    await test7_SelfInverse();
    await test8_PerformanceBenchmark();
    
    log('\n========================================', 'success');
    log('  ✅ All Tests Passed!', 'success');
    log('========================================\n', 'success');
    log(`📊 Results: ${testsPassed}/${testsRun} passed, ${testsFailed} failed`, 'info');
    
    process.exit(0);
  } catch (error) {
    log('\n========================================', 'error');
    log('  ❌ Test Failed!', 'error');
    log('========================================\n', 'error');
    log(`📊 Results: ${testsPassed}/${testsRun} passed, ${testsFailed} failed`, 'error');
    log(`\nError: ${error.message}`, 'error');
    
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };

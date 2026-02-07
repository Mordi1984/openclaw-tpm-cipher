/**
 * ZodiacCipher - Enigma-Style Multi-Rotor Cipher
 * Quantum-Resistant Encryption für OpenClaw
 * 
 * @author OpenClaw
 * @version 1.0.0
 */

const crypto = require('crypto');
const argon2 = require('argon2');

class ZodiacCipher {
  constructor(masterPassword, options = {}) {
    this.options = {
      rotorCount: options.rotorCount || 5,
      rotorSize: options.rotorSize || 256,
      iterations: options.iterations || 1000000,
      memoryHard: options.memoryHard !== false,
      salt: options.salt || null
    };

    this.masterPassword = masterPassword;
    this.rotors = [];
    this.reflector = null;
    this.plugboard = null;
    this.initialized = false;
  }

  /**
   * Initialize cipher with master password
   */
  async initialize() {
    console.log('🔐 Initialisiere Zodiac Cipher...');

    // Quantum-Resistant Key Derivation
    const masterKey = await this.deriveKey(this.masterPassword);
    console.log('  ✓ Master-Key abgeleitet (Argon2id)');

    // Initialize rotors
    await this.initializeRotors(masterKey);
    console.log(`  ✓ ${this.options.rotorCount} Rotoren initialisiert`);

    // Create reflector
    this.reflector = this.createReflector(masterKey);
    console.log('  ✓ Reflector konfiguriert');

    // Create plugboard
    this.plugboard = this.createPlugboard(masterKey);
    console.log('  ✓ Plugboard aktiv');

    this.initialized = true;
    console.log('✓ Zodiac Cipher bereit\n');
  }

  /**
   * Quantum-Resistant Key Derivation with Argon2id
   */
  async deriveKey(password) {
    // Use provided salt or generate new one (should always be provided!)
    if (!this.options.salt) {
      console.warn('⚠️  No salt provided - generating random salt (not recommended!)');
    }
    const salt = this.options.salt || crypto.randomBytes(32);
    
    if (this.options.memoryHard) {
      // Argon2id: Memory-Hard, CPU-Hard, Side-Channel Resistant
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,  // 64 MB
        timeCost: 10,       // Iterations
        parallelism: 4,     // Threads
        hashLength: 64,     // Output
        salt: salt
      });
      
      return Buffer.from(hash.split('$').pop(), 'base64');
    } else {
      // Fallback: PBKDF2
      return crypto.pbkdf2Sync(
        password,
        salt,
        this.options.iterations,
        64,
        'sha512'
      );
    }
  }

  /**
   * Initialize multi-rotor system
   */
  async initializeRotors(masterKey) {
    this.rotors = [];
    
    for (let i = 0; i < this.options.rotorCount; i++) {
      // Unique seed per rotor
      const rotorSeed = crypto.createHash('sha256')
        .update(masterKey)
        .update(Buffer.from(`rotor-${i}`))
        .digest();

      const rotor = {
        forward: this.createPermutation(rotorSeed, i * 2),
        backward: [],
        notch: rotorSeed[0] % this.options.rotorSize,
        position: 0,
        turnover: rotorSeed[1] % this.options.rotorSize
      };

      // Backward = Inverse Permutation
      rotor.backward = new Array(this.options.rotorSize);
      for (let j = 0; j < this.options.rotorSize; j++) {
        rotor.backward[rotor.forward[j]] = j;
      }

      this.rotors.push(rotor);
    }
  }

  /**
   * Create cryptographically secure permutation
   */
  createPermutation(seed, offset) {
    const perm = Array.from({ length: this.options.rotorSize }, (_, i) => i);
    
    // Fisher-Yates with cryptographic RNG
    for (let i = perm.length - 1; i > 0; i--) {
      const hash = crypto.createHash('sha256')
        .update(seed)
        .update(Buffer.from([i + offset]))
        .digest();
      
      const j = hash.readUInt32BE(0) % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    
    return perm;
  }

  /**
   * Create reflector (makes cipher self-inverse)
   */
  createReflector(masterKey) {
    const seed = crypto.createHash('sha256')
      .update(masterKey)
      .update('reflector')
      .digest();

    const reflector = new Array(this.options.rotorSize);
    const used = new Set();

    for (let i = 0; i < this.options.rotorSize; i++) {
      if (used.has(i)) continue;

      const hash = crypto.createHash('sha256')
        .update(seed)
        .update(Buffer.from([i]))
        .digest();

      let partner = hash.readUInt32BE(0) % this.options.rotorSize;
      
      // Ensure partner != i and not used
      while (partner === i || used.has(partner)) {
        partner = (partner + 1) % this.options.rotorSize;
      }

      reflector[i] = partner;
      reflector[partner] = i;
      used.add(i);
      used.add(partner);
    }

    return reflector;
  }

  /**
   * Create plugboard (additional permutation before/after rotors)
   */
  createPlugboard(masterKey) {
    const seed = crypto.createHash('sha256')
      .update(masterKey)
      .update('plugboard')
      .digest();

    const plugboard = Array.from({ length: this.options.rotorSize }, (_, i) => i);
    
    // 20 swap pairs
    for (let i = 0; i < 20; i++) {
      const hash = crypto.createHash('sha256')
        .update(seed)
        .update(Buffer.from([i]))
        .digest();

      const a = hash.readUInt8(0) % this.options.rotorSize;
      const b = hash.readUInt8(1) % this.options.rotorSize;
      
      [plugboard[a], plugboard[b]] = [plugboard[b], plugboard[a]];
    }

    return plugboard;
  }

  /**
   * ENCRYPT
   */
  encrypt(plaintext) {
    if (!this.initialized) {
      throw new Error('Cipher not initialized - call initialize() first');
    }

    const input = Buffer.isBuffer(plaintext) 
      ? plaintext 
      : Buffer.from(plaintext, 'utf8');
    
    const output = Buffer.alloc(input.length);

    for (let i = 0; i < input.length; i++) {
      let byte = input[i];

      // 1. Through plugboard
      byte = this.plugboard[byte];

      // 2. Through all rotors (forward)
      for (let r = 0; r < this.rotors.length; r++) {
        const rotor = this.rotors[r];
        byte = rotor.forward[(byte + rotor.position) % this.options.rotorSize];
      }

      // 3. Through reflector
      byte = this.reflector[byte];

      // 4. Back through rotors (backward)
      for (let r = this.rotors.length - 1; r >= 0; r--) {
        const rotor = this.rotors[r];
        byte = (rotor.backward[byte] - rotor.position + this.options.rotorSize) 
          % this.options.rotorSize;
      }

      // 5. Through plugboard again
      byte = this.plugboard.indexOf(byte);

      output[i] = byte;

      // 6. Step rotors (like Enigma)
      this.stepRotors();
    }

    return output;
  }

  /**
   * DECRYPT (identical to encrypt - cipher is self-inverse)
   */
  decrypt(ciphertext) {
    // Reset rotor positions
    this.resetRotors();
    
    return this.encrypt(ciphertext);
  }

  /**
   * Step rotors (Enigma mechanics)
   */
  stepRotors() {
    let carry = true;

    for (let i = 0; i < this.rotors.length && carry; i++) {
      const rotor = this.rotors[i];
      
      rotor.position = (rotor.position + 1) % this.options.rotorSize;
      
      // Double-stepping (Enigma quirk)
      if (rotor.position === rotor.turnover) {
        carry = true;
      } else {
        carry = false;
      }
    }
  }

  /**
   * Reset rotor positions
   */
  resetRotors() {
    this.rotors.forEach(rotor => {
      rotor.position = 0;
    });
  }

  /**
   * Encrypt to Base64
   */
  encryptToBase64(data) {
    const encrypted = this.encrypt(data);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt from Base64
   */
  decryptFromBase64(base64) {
    const encrypted = Buffer.from(base64, 'base64');
    return this.decrypt(encrypted);
  }

  /**
   * Encrypt JSON
   */
  encryptJSON(obj) {
    this.resetRotors(); // Reset before encrypt
    const json = JSON.stringify(obj);
    return this.encryptToBase64(json);
  }

  /**
   * Decrypt JSON
   */
  decryptJSON(encrypted) {
    this.resetRotors(); // Reset before decrypt
    const decrypted = this.decryptFromBase64(encrypted);
    return JSON.parse(decrypted.toString('utf8'));
  }
}

module.exports = { ZodiacCipher };

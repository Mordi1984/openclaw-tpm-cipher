# Credits & Acknowledgments

OpenClaw TPM Cipher builds upon the work of many open-source projects and research papers.

---

## 🙏 External Dependencies

### Argon2
- **Description:** Memory-hard password hashing algorithm
- **License:** CC0 1.0 Universal (Public Domain)
- **Source:** https://github.com/P-H-C/phc-winner-argon2
- **Paper:** [Argon2: the memory-hard function for password hashing and other applications](https://github.com/P-H-C/phc-winner-argon2/blob/master/argon2-specs.pdf)
- **Authors:** Alex Biryukov, Daniel Dinu, Dmitry Khovratovich
- **Used For:** Quantum-resistant key derivation function (KDF)

### Node.js Argon2 Binding
- **Package:** `argon2` npm package
- **License:** MIT
- **Source:** https://github.com/ranisalt/node-argon2
- **Author:** Ranieri Sthel (@ranisalt)
- **Used For:** Node.js interface to Argon2

### TPM 2.0 Tools
- **Description:** Command-line tools for TPM 2.0
- **License:** BSD 3-Clause
- **Source:** https://github.com/tpm2-software/tpm2-tools
- **Organization:** Trusted Computing Group (TCG)
- **Used For:** Hardware key sealing and unsealing

---

## 🏛️ Cryptographic Foundations

### Enigma Machine (Historical Inspiration)
- **Description:** Electro-mechanical cipher machine (1918-1945)
- **Status:** Public Domain (Historical)
- **Reference:** https://en.wikipedia.org/wiki/Enigma_machine
- **Note:** Our implementation is a *modern interpretation* with 5 rotors, reflector, and plugboard. Not a faithful reproduction.
- **Used For:** Multi-rotor cipher design concept

### TPM 2.0 Specification
- **Description:** Trusted Platform Module Library Specification
- **Version:** Family 2.0, Level 00, Revision 01.59
- **Organization:** Trusted Computing Group (TCG)
- **License:** TCG Copyright (freely available)
- **Source:** https://trustedcomputinggroup.org/resource/tpm-library-specification/
- **Used For:** Hardware key storage and sealing

### NIST Post-Quantum Cryptography
- **Description:** Research on quantum-resistant cryptography
- **Organization:** National Institute of Standards and Technology (NIST)
- **Source:** https://csrc.nist.gov/projects/post-quantum-cryptography
- **Used For:** Security analysis and threat modeling

---

## 📚 Research Papers & Standards

### Password Hashing Competition (PHC)
- **Year:** 2015
- **Winner:** Argon2
- **Paper:** [Argon2 Specification](https://github.com/P-H-C/phc-winner-argon2/blob/master/argon2-specs.pdf)
- **Authors:** Alex Biryukov, Daniel Dinu, Dmitry Khovratovich (University of Luxembourg)

### NIST SP 800-132
- **Title:** Recommendation for Password-Based Key Derivation
- **Organization:** NIST
- **Year:** 2010
- **Source:** https://csrc.nist.gov/publications/detail/sp/800-132/final

### NIST SP 800-57
- **Title:** Recommendation for Key Management
- **Organization:** NIST
- **Year:** 2020 (Rev. 5)
- **Source:** https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final

### RFC 9106
- **Title:** Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications
- **Year:** 2021
- **IETF RFC:** https://datatracker.ietf.org/doc/html/rfc9106

---

## 🛠️ Development Tools

### Node.js
- **License:** MIT
- **Source:** https://nodejs.org
- **Used For:** Runtime environment

### npm (Node Package Manager)
- **License:** Artistic License 2.0
- **Source:** https://www.npmjs.com
- **Used For:** Dependency management

---

## 🧑‍💻 Original Authors

### Lucas & Clawdy 🐾
- **Project:** OpenClaw TPM Cipher
- **Year:** 2026
- **Contribution:** Original implementation, integration, testing
- **Contact:** (Add your email/GitHub)

**Design Philosophy:**
- Inspired by historical Enigma machine
- Modernized with quantum-resistant Argon2id KDF
- Hardware-bound security via TPM 2.0
- Built for OpenClaw ecosystem

---

## 🌟 Special Thanks

### OpenClaw Community
- **Project:** OpenClaw AI Assistant Framework
- **Website:** https://openclaw.ai
- **Community:** https://discord.com/invite/clawd
- **GitHub:** https://github.com/openclaw/openclaw
- **Used For:** Platform this encryption system protects

### Trusted Computing Group (TCG)
- **Organization:** Industry standards body
- **Website:** https://trustedcomputinggroup.org
- **Contribution:** TPM 2.0 specification and ecosystem

### Password Hashing Competition Team
- **Organization:** PHC 2015
- **Website:** https://password-hashing.net
- **Contribution:** Argon2 selection and validation

---

## 📜 License Compliance

This project (OpenClaw TPM Cipher) is licensed under **MIT License**.

**External dependencies maintain their original licenses:**
- Argon2: CC0 1.0 (Public Domain)
- node-argon2: MIT
- tpm2-tools: BSD 3-Clause
- Node.js: MIT

All external components are compatible with MIT licensing.

---

## 🔍 Attribution Requirements

When using or modifying this project:

1. ✅ Keep this CREDITS.md file
2. ✅ Maintain LICENSE file (MIT)
3. ✅ Credit original authors (Lucas & Clawdy)
4. ✅ Acknowledge Argon2 authors (Biryukov, Dinu, Khovratovich)
5. ✅ Reference Trusted Computing Group for TPM spec

---

## 🤝 Contributing

If you contribute to this project, you agree:
- Your contributions are licensed under MIT
- You have rights to contribute the code
- You credit any external sources used

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📧 Contact

**Security Issues:** security@yourdomain.com (replace with your email)  
**General Questions:** GitHub Issues

---

**Last Updated:** 2026-02-05  
**Version:** 1.0.0

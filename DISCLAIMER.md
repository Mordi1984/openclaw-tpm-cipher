# Disclaimer / Haftungsausschluss

**OpenClaw TPM Cipher** - Legal Disclaimer and Terms of Use

---

## 🇺🇸 English Version

### No Warranty

This software is provided **"AS-IS"**, without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

### Limitation of Liability

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This includes but is not limited to:
- ❌ Data loss
- ❌ System failures
- ❌ Encryption key loss
- ❌ TPM failures
- ❌ Security breaches
- ❌ Business interruption
- ❌ Loss of profits

### User Responsibilities

By using this software, you agree to:

1. ✅ **Create backups** before encrypting any data
2. ✅ **Test in non-production** environment first
3. ✅ **Understand encryption risks** (irreversible without key)
4. ✅ **Secure your TPM keys** (`.cipher/` directory)
5. ✅ **Follow documentation** carefully
6. ✅ **Accept full responsibility** for data loss

### Security Disclaimer

While this software implements **quantum-resistant encryption** and follows security best practices, we make **NO GUARANTEES** about:

- ⚠️ Absolute security (no system is 100% secure)
- ⚠️ Protection against all attack vectors
- ⚠️ Compatibility with all systems
- ⚠️ Future-proofing against new threats

**Use at your own risk.**

### Backup Requirements

**🚨 CRITICAL: BACKUP YOUR DATA BEFORE ENCRYPTING! 🚨**

Encryption is **IRREVERSIBLE**. Without a backup:
- ❌ Lost master key = lost data forever
- ❌ TPM failure = inaccessible data
- ❌ Corrupted files = unrecoverable

**Recommendation:**
```bash
# Before encryption
tar -czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/.whatsapp-sessions/ \
  ~/.config/openclaw/secrets/

# After encryption (encrypted backup)
tar -czf ~/openclaw-encrypted-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/.cipher/
```

### Third-Party Dependencies

This software relies on external libraries:
- **Argon2** (CC0 1.0, Public Domain)
- **TPM 2.0 Tools** (BSD 3-Clause)
- **Node.js Argon2** (MIT)

We are **NOT responsible** for bugs or issues in these dependencies.

### Legal Compliance

**You are responsible for:**
- ✅ Compliance with local encryption laws
- ✅ Export control regulations (if applicable)
- ✅ Data protection regulations (GDPR, HIPAA, etc.)

Some countries **restrict or ban** strong encryption. Check your local laws.

### No Support Obligation

The authors provide this software **without any obligation** to:
- ❌ Provide support
- ❌ Fix bugs
- ❌ Add features
- ❌ Maintain updates

Community contributions are welcome but not guaranteed.

---

## 🇩🇪 German Version / Deutsche Version

### Keine Gewährleistung

Diese Software wird **"WIE BESEHEN"** ohne jegliche ausdrückliche oder stillschweigende Gewährleistung bereitgestellt. Die Autoren übernehmen keine Haftung für Schäden, die durch die Nutzung dieser Software entstehen.

DIE SOFTWARE WIRD OHNE JEGLICHE AUSDRÜCKLICHE ODER STILLSCHWEIGENDE GEWÄHRLEISTUNG BEREITGESTELLT, EINSCHLIESSLICH, ABER NICHT BESCHRÄNKT AUF DIE GEWÄHRLEISTUNG DER MARKTGÄNGIGKEIT, DER EIGNUNG FÜR EINEN BESTIMMTEN ZWECK UND DER NICHTVERLETZUNG VON RECHTEN DRITTER.

### Haftungsbeschränkung

IN KEINEM FALL HAFTEN DIE AUTOREN ODER URHEBERRECHTSINHABER FÜR ANSPRÜCHE, SCHÄDEN ODER ANDERE VERPFLICHTUNGEN, OB AUS VERTRAG, UNERLAUBTER HANDLUNG ODER ANDERWEITIG, DIE SICH AUS, AUS ODER IM ZUSAMMENHANG MIT DER SOFTWARE ODER DER NUTZUNG DER SOFTWARE ERGEBEN.

Dies umfasst unter anderem:
- ❌ Datenverlust
- ❌ Systemausfälle
- ❌ Verlust von Verschlüsselungsschlüsseln
- ❌ TPM-Ausfälle
- ❌ Sicherheitsverletzungen
- ❌ Betriebsunterbrechungen
- ❌ Gewinnausfälle

### Benutzerverantwortung

Durch die Nutzung dieser Software stimmen Sie zu:

1. ✅ **Backups erstellen** vor der Verschlüsselung
2. ✅ **In Nicht-Produktionsumgebung testen** zuerst
3. ✅ **Verschlüsselungsrisiken verstehen** (nicht umkehrbar ohne Schlüssel)
4. ✅ **TPM-Schlüssel sichern** (`.cipher/` Verzeichnis)
5. ✅ **Dokumentation befolgen** sorgfältig
6. ✅ **Volle Verantwortung übernehmen** für Datenverlust

### Sicherheitshinweis

Obwohl diese Software **quantenresistente Verschlüsselung** implementiert und bewährte Sicherheitspraktiken befolgt, geben wir **KEINE GARANTIEN** für:

- ⚠️ Absolute Sicherheit (kein System ist 100% sicher)
- ⚠️ Schutz vor allen Angriffsvektoren
- ⚠️ Kompatibilität mit allen Systemen
- ⚠️ Zukunftssicherheit gegen neue Bedrohungen

**Nutzung auf eigenes Risiko.**

### Backup-Anforderungen

**🚨 KRITISCH: DATEN VOR VERSCHLÜSSELUNG SICHERN! 🚨**

Verschlüsselung ist **NICHT UMKEHRBAR**. Ohne Backup:
- ❌ Verlorener Hauptschlüssel = Daten für immer verloren
- ❌ TPM-Ausfall = Daten unzugänglich
- ❌ Beschädigte Dateien = nicht wiederherstellbar

**Empfehlung:**
```bash
# Vor Verschlüsselung
tar -czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/.whatsapp-sessions/ \
  ~/.config/openclaw/secrets/

# Nach Verschlüsselung (verschlüsseltes Backup)
tar -czf ~/openclaw-encrypted-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/.cipher/
```

### Drittanbieter-Abhängigkeiten

Diese Software basiert auf externen Bibliotheken:
- **Argon2** (CC0 1.0, Public Domain)
- **TPM 2.0 Tools** (BSD 3-Clause)
- **Node.js Argon2** (MIT)

Wir sind **NICHT verantwortlich** für Fehler oder Probleme in diesen Abhängigkeiten.

### Rechtliche Compliance

**Sie sind verantwortlich für:**
- ✅ Einhaltung lokaler Verschlüsselungsgesetze
- ✅ Exportkontrollvorschriften (falls zutreffend)
- ✅ Datenschutzbestimmungen (DSGVO, HIPAA, etc.)

Einige Länder **beschränken oder verbieten** starke Verschlüsselung. Prüfen Sie Ihre lokalen Gesetze.

### Keine Support-Verpflichtung

Die Autoren stellen diese Software **ohne jede Verpflichtung** bereit zu:
- ❌ Support leisten
- ❌ Fehler beheben
- ❌ Funktionen hinzufügen
- ❌ Updates bereitstellen

Community-Beiträge sind willkommen, aber nicht garantiert.

---

## 📜 License

This software is licensed under the **MIT License**. See [LICENSE](LICENSE) file for full terms.

---

## ✅ Acceptance

By installing, using, or modifying this software, you acknowledge that:

1. ✅ You have read and understood this disclaimer
2. ✅ You accept all risks associated with encryption
3. ✅ You have created backups of your data
4. ✅ You will not hold the authors liable for any damages
5. ✅ You comply with all applicable laws

**If you do not agree, DO NOT USE THIS SOFTWARE.**

---

## 📧 Contact

For questions (no support obligations):
- GitHub Issues: https://github.com/YOUR_USERNAME/openclaw-tpm-cipher/issues
- Email: security@yourdomain.com (replace with your email)

---

**Last Updated:** 2026-02-05  
**Version:** 1.0.0

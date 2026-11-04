---
id: encryption
title: Snapshot Encryption & Keys
type: Concept
product_version: "2.3.0"
owner: security@vaultlite.internal
last_verified: 2026-09-18
tags: [security, aes-256, encryption, secrets]
source_files:
  - src/crypto.py
---

# Snapshot Encryption & Keys

Security is central to VaultLite's repository architecture. All data blocks and file metadata are encrypted before leaving memory.

## Encryption Architecture
- **Cipher**: AES-256-GCM authenticated encryption.
- **Key Derivation**: Argon2id with 64MB memory cost and 4 parallel threads.
- **Salt Generation**: Unique 256-bit cryptographically secure random salt per repository.

## Master Key Management
Keys can be provided via environment variable or keyfile:
```bash
export VAULTLITE_PASSPHRASE="secure-passphrase-here"
```
Never store plain text passphrases in version control or shell history.

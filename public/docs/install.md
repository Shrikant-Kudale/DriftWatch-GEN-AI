---
id: install
title: Installing VaultLite
type: Task
product_version: "2.3.0"
owner: alex@vaultlite.internal
last_verified: 2026-10-12
tags: [setup, cli, installation, linux, macos]
source_files:
  - src/cli.py
  - setup.py
---

# Installing VaultLite

VaultLite is a lightweight, zero-dependency backup agent designed for development workstations and production servers.

## Prerequisites
- Python 3.10 or higher
- OpenSSL 1.1.1+ (for AES-256-GCM encrypted snapshots)
- Read access to files targeted for snapshot

## Installation Methods

### Homebrew (macOS & Linux)
```bash
brew tap vaultlite/tap
brew install vaultlite
```

### Direct Pip Binary
```bash
pip install vaultlite-agent
```

### Verifying the Installation
Check that the executable is available in your PATH:
```bash
vaultlite --version
```
Output:
`vaultlite version 2.3.0`

## Initial Configuration
Run the interactive initializer to create `~/.vaultlite/config.yaml`:
```bash
vaultlite init --default-storage /var/backups/vaultlite
```

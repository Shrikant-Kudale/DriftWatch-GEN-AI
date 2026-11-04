---
id: troubleshooting
title: Troubleshooting Common Failures
type: Reference
product_version: ""
owner: ""
last_verified: 2026-03-11
tags: [debug, errors, logs, troubleshooting]
source_files:
  - src/cli.py
  - src/errors.py
---

# Troubleshooting Common Failures

Guide for diagnosing snapshot lock errors, corruption alerts, and permission denials.

## Error: E_REPO_LOCKED
Another process is currently holding the repository lock.
1. Check running background jobs:
   ```bash
   ps aux | grep vaultlite
   ```
2. If confirmed orphaned, release lock safely:
   ```bash
   vaultlite unlock --force
   ```

## Error: E_INTEGRITY_MISMATCH
Occurs when an underlying block fails AES-GCM tag verification.
- Verify storage drive health with `smartctl`.
- Re-run restore specifying `--verify-blocks`.

## Stale Verification Notice
This document has unassigned ownership and needs verification against current release builds.

---
id: retention-policy
title: Retention Policies & Pruning
type: Concept
product_version: "2.3.0"
owner: alex@vaultlite.internal
last_verified: 2026-04-10
tags: [retention, pruning, storage, policy]
source_files:
  - src/retention.py
---

# Retention Policies & Pruning

VaultLite includes an automated pruning engine that enforces retention limits on snapshots to conserve disk space.

## Default Retention Period

Unless otherwise configured, VaultLite maintains all backups for a default window of 30 days. Snapshots older than 30 days are marked as expired during the next maintenance cycle.

## Overriding Retention on Backup Creation

When invoking `vaultlite backup`, use `--keep-days` to set an explicit duration in days:
```bash
vaultlite backup --src /logs --keep-days 7
```

## Running Prune Manually
You can manually prune expired snapshots:
```bash
vaultlite prune --dry-run
vaultlite prune --apply
```
The prune command inspects snapshot creation timestamps against the configured retention duration.

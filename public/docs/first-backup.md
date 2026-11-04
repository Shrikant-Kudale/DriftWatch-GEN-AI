---
id: first-backup
title: Creating Your First Backup
type: Task
product_version: "2.3.0"
owner: devops-lead@vaultlite.internal
last_verified: 2026-05-14
tags: [quickstart, backup, snapshots, cli]
source_files:
  - src/backup.py
  - src/retention.py
---

# Creating Your First Backup

This guide walks you through creating your first snapshot repository with VaultLite.

## Basic Snapshot Command

To create an immediate backup of a folder:
```bash
vaultlite backup --src /var/data --tag v1-initial
```

By default, VaultLite preserves snapshots according to the global retention window of 30 days.

## Custom Retention Override

If you need a specific retention duration for a single snapshot, supply the `--keep-days` flag:
```bash
vaultlite backup --src /var/data --tag release-archive --keep-days 90
```

> **Note**: If `--keep-days` is not specified, VaultLite falls back to the default 30-day purge cycle.

## Verifying Snapshot Status
List snapshots saved to your local or remote target:
```bash
vaultlite list --tag v1-initial
```

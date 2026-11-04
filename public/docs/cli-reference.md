---
id: cli-reference
title: CLI Command Reference
type: Reference
product_version: "2.3.0"
owner: alex@vaultlite.internal
last_verified: 2026-07-04
tags: [reference, flags, commands, options]
source_files:
  - src/cli.py
  - src/backup.py
  - src/restore.py
---

# CLI Command Reference

Comprehensive index of commands, options, and exit codes for `vaultlite`.

## vaultlite backup
Create a snapshot from a directory.
- `--src <path>`: Directory to snapshot (required).
- `--tag <label>`: User-friendly identifier string.
- `--keep-days <int>`: Days to retain snapshot before auto-pruning. Default: 30.
- `--quiet`: Suppress file-level progress bars.

## vaultlite restore
Restore file or entire archive from repository.
- `--snapshot <id>`: Snapshot hash or tag to restore (required).
- `--dest <path>`: Local target directory for extracted files (required).
- `--file <path>`: Relative path of a specific file inside snapshot to recover.
- `--no-clobber`: Skip files if destination already exists.

## vaultlite prune
Scan and purge expired snapshots.
- `--dry-run`: List items that would be purged without deleting.
- `--apply`: Perform immediate deletion of expired data chunks.

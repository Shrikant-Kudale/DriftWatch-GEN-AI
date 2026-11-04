---
id: restore-file
title: Restoring Files from Snapshots
type: Task
product_version: "2.3.0"
owner: sara@vaultlite.internal
last_verified: 2026-06-01
tags: [restore, recovery, disaster-recovery, cli]
source_files:
  - src/restore.py
  - src/cli.py
---

# Restoring Files from Snapshots

When files are corrupted, deleted, or rolled back, VaultLite can extract individual files or entire directory trees from any snapshot.

## Restoring a Specific File

To recover a single file to a destination folder:
```bash
vaultlite restore --snapshot snap-94821 --file config/database.yml --dest /tmp/restored/
```

VaultLite checks data integrity hashes prior to writing the file to disk.

## Full Directory Extraction

To restore all contents from a given snapshot ID:
```bash
vaultlite restore --snapshot snap-94821 --dest /data/recovery/
```

## Previewing Restores
Prior to VaultLite 2.4, full directory restores directly overwrite target files unless `--no-clobber` is passed. Always double-check target paths before triggering a restore operation.

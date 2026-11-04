/**
 * VaultLite Sample Project Data
 * Embedded directly for 100% reliable, zero-latency loading in any environment
 * (Vercel serverless, static hosting, dev server, or offline mode).
 */

export interface RawSampleDoc {
  filename: string;
  content: string;
}

export const SAMPLE_CHANGE = `PR #142: Update snapshot retention defaults and add restore simulation

Summary of Changes:
1. Default retention window reduced from 30 days to 14 days across all repositories to align with compliance guidelines and reduce unnecessary cloud storage expenses.
2. CLI flag --keep-days has been renamed to --retain across vaultlite backup and scheduler configurations for naming clarity. The old flag is deprecated with a warning.
3. Added --dry-run flag to vaultlite restore command: allows users to preview files that would be extracted or overwritten without performing any disk write operations.
4. Added validation check in src/restore.py to notify when target destination files already exist during dry run.

Touched source files:
- src/retention.py
- src/backup.py
- src/restore.py
- src/cli.py`;

export const SAMPLE_DOCS: RawSampleDoc[] = [
  {
    filename: 'retention-policy.md',
    content: `---
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

When invoking \`vaultlite backup\`, use \`--keep-days\` to set an explicit duration in days:
\`\`\`bash
vaultlite backup --src /logs --keep-days 7
\`\`\`

## Running Prune Manually
You can manually prune expired snapshots:
\`\`\`bash
vaultlite prune --dry-run
vaultlite prune --apply
\`\`\`
The prune command inspects snapshot creation timestamps against the configured retention duration.
`,
  },
  {
    filename: 'first-backup.md',
    content: `---
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
\`\`\`bash
vaultlite backup --src /var/data --tag v1-initial
\`\`\`

By default, VaultLite preserves snapshots according to the global retention window of 30 days.

## Custom Retention Override

If you need a specific retention duration for a single snapshot, supply the \`--keep-days\` flag:
\`\`\`bash
vaultlite backup --src /var/data --tag release-archive --keep-days 90
\`\`\`

> **Note**: If \`--keep-days\` is not specified, VaultLite falls back to the default 30-day purge cycle.

## Verifying Snapshot Status
List snapshots saved to your local or remote target:
\`\`\`bash
vaultlite list --tag v1-initial
\`\`\`
`,
  },
  {
    filename: 'cli-reference.md',
    content: `---
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

Comprehensive index of commands, options, and exit codes for \`vaultlite\`.

## vaultlite backup
Create a snapshot from a directory.
- \`--src <path>\`: Directory to snapshot (required).
- \`--tag <label>\`: User-friendly identifier string.
- \`--keep-days <int>\`: Days to retain snapshot before auto-pruning. Default: 30.
- \`--quiet\`: Suppress file-level progress bars.

## vaultlite restore
Restore file or entire archive from repository.
- \`--snapshot <id>\`: Snapshot hash or tag to restore (required).
- \`--dest <path>\`: Local target directory for extracted files (required).
- \`--file <path>\`: Relative path of a specific file inside snapshot to recover.
- \`--no-clobber\`: Skip files if destination already exists.

## vaultlite prune
Scan and purge expired snapshots.
- \`--dry-run\`: List items that would be purged without deleting.
- \`--apply\`: Perform immediate deletion of expired data chunks.
`,
  },
  {
    filename: 'restore-file.md',
    content: `---
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
\`\`\`bash
vaultlite restore --snapshot snap-94821 --file config/database.yml --dest /tmp/restored/
\`\`\`

VaultLite checks data integrity hashes prior to writing the file to disk.

## Full Directory Extraction

To restore all contents from a given snapshot ID:
\`\`\`bash
vaultlite restore --snapshot snap-94821 --dest /data/recovery/
\`\`\`

## Previewing Restores
Prior to VaultLite 2.4, full directory restores directly overwrite target files unless \`--no-clobber\` is passed. Always double-check target paths before triggering a restore operation.
`,
  },
  {
    filename: 'schedule-backups.md',
    content: `---
id: schedule-backups
title: Scheduling Automated Backups
type: Task
product_version: "2.3.0"
owner: devops-lead@vaultlite.internal
last_verified: 2026-08-20
tags: [automation, cron, systemd, scheduling]
source_files:
  - src/backup.py
  - src/scheduler.py
---

# Scheduling Automated Backups

You can run automated backup jobs using cron, systemd timers, or CI/CD pipelines.

## Crontab Configuration
Add a job to \`/etc/cron.d/vaultlite-nightly\`:
\`\`\`cron
0 2 * * * root /usr/local/bin/vaultlite backup --src /data/db --tag nightly --keep-days 30 >> /var/log/vaultlite.log 2>&1
\`\`\`

In the crontab above, \`--keep-days 30\` ensures nightly snapshots are retired after 30 days.

## Systemd Timer Unit
Create \`/etc/systemd/system/vaultlite.service\`:
\`\`\`ini
[Unit]
Description=VaultLite Daily Backup
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/vaultlite backup --src /var/www --tag daily --keep-days 14
\`\`\`
`,
  },
  {
    filename: 'install.md',
    content: `---
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
\`\`\`bash
brew tap vaultlite/tap
brew install vaultlite
\`\`\`

### Direct Pip Binary
\`\`\`bash
pip install vaultlite-agent
\`\`\`

### Verifying the Installation
Check that the executable is available in your PATH:
\`\`\`bash
vaultlite --version
\`\`\`
Output:
\`vaultlite version 2.3.0\`

## Initial Configuration
Run the interactive initializer to create \`~/.vaultlite/config.yaml\`:
\`\`\`bash
vaultlite init --default-storage /var/backups/vaultlite
\`\`\`
`,
  },
  {
    filename: 'encryption.md',
    content: `---
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
\`\`\`bash
export VAULTLITE_PASSPHRASE="secure-passphrase-here"
\`\`\`
Never store plain text passphrases in version control or shell history.
`,
  },
  {
    filename: 'troubleshooting.md',
    content: `---
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
   \`\`\`bash
   ps aux | grep vaultlite
   \`\`\`
2. If confirmed orphaned, release lock safely:
   \`\`\`bash
   vaultlite unlock --force
   \`\`\`

## Error: E_INTEGRITY_MISMATCH
Occurs when an underlying block fails AES-GCM tag verification.
- Verify storage drive health with \`smartctl\`.
- Re-run restore specifying \`--verify-blocks\`.

## Stale Verification Notice
This document has unassigned ownership and needs verification against current release builds.
`,
  },
];

/**
 * Pre-grounded impact proposals for the sample PR #142
 * Used as fallback or instant demo if Gemini API quota is exceeded or offline.
 */
export const SAMPLE_PROPOSALS = [
  {
    page_id: 'retention-policy',
    confidence: 'High' as const,
    reason: 'PR #142 reduced default retention from 30 days to 14 days and renamed --keep-days to --retain in src/retention.py.',
    before: `## Default Retention Period\n\nUnless otherwise configured, VaultLite maintains all backups for a default window of 30 days. Snapshots older than 30 days are marked as expired during the next maintenance cycle.\n\n## Overriding Retention on Backup Creation\n\nWhen invoking \`vaultlite backup\`, use \`--keep-days\` to set an explicit duration in days:\n\`\`\`bash\nvaultlite backup --src /logs --keep-days 7\n\`\`\``,
    after: `## Default Retention Period\n\nUnless otherwise configured, VaultLite maintains all backups for a default window of 14 days. Snapshots older than 14 days are marked as expired during the next maintenance cycle.\n\n## Overriding Retention on Backup Creation\n\nWhen invoking \`vaultlite backup\`, use \`--retain\` to set an explicit duration in days:\n\`\`\`bash\nvaultlite backup --src /logs --retain 7\n\`\`\`\n\n> **Note**: The legacy flag \`--keep-days\` is deprecated and will be removed in a future release.`,
    retrievedSnippets: [
      { heading: 'Default Retention Period', text: 'Unless otherwise configured, VaultLite maintains all backups for a default window of 30 days.', score: 0.892 },
      { heading: 'Overriding Retention on Backup Creation', text: 'When invoking vaultlite backup, use --keep-days to set an explicit duration in days', score: 0.844 }
    ]
  },
  {
    page_id: 'cli-reference',
    confidence: 'High' as const,
    reason: 'PR #142 renamed backup flag --keep-days to --retain (default 14) and added --dry-run flag to restore.',
    before: `## vaultlite backup\nCreate a snapshot from a directory.\n- \`--src <path>\`: Directory to snapshot (required).\n- \`--tag <label>\`: User-friendly identifier string.\n- \`--keep-days <int>\`: Days to retain snapshot before auto-pruning. Default: 30.\n- \`--quiet\`: Suppress file-level progress bars.\n\n## vaultlite restore\nRestore file or entire archive from repository.\n- \`--snapshot <id>\`: Snapshot hash or tag to restore (required).\n- \`--dest <path>\`: Local target directory for extracted files (required).\n- \`--file <path>\`: Relative path of a specific file inside snapshot to recover.\n- \`--no-clobber\`: Skip files if destination already exists.`,
    after: `## vaultlite backup\nCreate a snapshot from a directory.\n- \`--src <path>\`: Directory to snapshot (required).\n- \`--tag <label>\`: User-friendly identifier string.\n- \`--retain <int>\`: Days to retain snapshot before auto-pruning. Default: 14. (Replaces deprecated \`--keep-days\`).\n- \`--quiet\`: Suppress file-level progress bars.\n\n## vaultlite restore\nRestore file or entire archive from repository.\n- \`--snapshot <id>\`: Snapshot hash or tag to restore (required).\n- \`--dest <path>\`: Local target directory for extracted files (required).\n- \`--dry-run\`: Simulate restore without writing files to disk.\n- \`--file <path>\`: Relative path of a specific file inside snapshot to recover.\n- \`--no-clobber\`: Skip files if destination already exists.`,
    retrievedSnippets: [
      { heading: 'vaultlite backup', text: '--keep-days <int>: Days to retain snapshot before auto-pruning. Default: 30.', score: 0.914 },
      { heading: 'vaultlite restore', text: 'Restore file or entire archive from repository.', score: 0.862 }
    ]
  },
  {
    page_id: 'first-backup',
    confidence: 'High' as const,
    reason: 'PR #142 updated default retention duration and replaced --keep-days with --retain flag.',
    before: `By default, VaultLite preserves snapshots according to the global retention window of 30 days.\n\n## Custom Retention Override\n\nIf you need a specific retention duration for a single snapshot, supply the \`--keep-days\` flag:\n\`\`\`bash\nvaultlite backup --src /var/data --tag release-archive --keep-days 90\n\`\`\`\n\n> **Note**: If \`--keep-days\` is not specified, VaultLite falls back to the default 30-day purge cycle.`,
    after: `By default, VaultLite preserves snapshots according to the global retention window of 14 days.\n\n## Custom Retention Override\n\nIf you need a specific retention duration for a single snapshot, supply the \`--retain\` flag:\n\`\`\`bash\nvaultlite backup --src /var/data --tag release-archive --retain 90\n\`\`\`\n\n> **Note**: If \`--retain\` is not specified, VaultLite falls back to the default 14-day purge cycle (previously 30 days).`,
    retrievedSnippets: [
      { heading: 'Basic Snapshot Command', text: 'By default, VaultLite preserves snapshots according to the global retention window of 30 days.', score: 0.881 },
      { heading: 'Custom Retention Override', text: 'If you need a specific retention duration for a single snapshot, supply the --keep-days flag', score: 0.867 }
    ]
  },
  {
    page_id: 'restore-file',
    confidence: 'High' as const,
    reason: 'PR #142 added --dry-run simulation mode to vaultlite restore.',
    before: `## Previewing Restores\nPrior to VaultLite 2.4, full directory restores directly overwrite target files unless \`--no-clobber\` is passed. Always double-check target paths before triggering a restore operation.`,
    after: `## Previewing Restores with Simulation\nUse the \`--dry-run\` flag to inspect restore actions without modifying any files on disk:\n\`\`\`bash\nvaultlite restore --snapshot snap-94821 --dest /data/recovery/ --dry-run\n\`\`\`\nVaultLite will list each file that would be extracted or overwritten and verify hash integrity.`,
    retrievedSnippets: [
      { heading: 'Previewing Restores', text: 'full directory restores directly overwrite target files unless --no-clobber is passed.', score: 0.875 }
    ]
  },
  {
    page_id: 'schedule-backups',
    confidence: 'Medium' as const,
    reason: 'PR #142 updated --keep-days to --retain in cron automation examples and changed default retention.',
    before: `## Crontab Configuration\nAdd a job to \`/etc/cron.d/vaultlite-nightly\`:\n\`\`\`cron\n0 2 * * * root /usr/local/bin/vaultlite backup --src /data/db --tag nightly --keep-days 30 >> /var/log/vaultlite.log 2>&1\n\`\`\`\n\nIn the crontab above, \`--keep-days 30\` ensures nightly snapshots are retired after 30 days.`,
    after: `## Crontab Configuration\nAdd a job to \`/etc/cron.d/vaultlite-nightly\`:\n\`\`\`cron\n0 2 * * * root /usr/local/bin/vaultlite backup --src /data/db --tag nightly --retain 14 >> /var/log/vaultlite.log 2>&1\n\`\`\`\n\nIn the crontab above, \`--retain 14\` aligns with the 14-day global retention standard.`,
    retrievedSnippets: [
      { heading: 'Crontab Configuration', text: '--keep-days 30 ensures nightly snapshots are retired after 30 days.', score: 0.835 }
    ]
  }
];

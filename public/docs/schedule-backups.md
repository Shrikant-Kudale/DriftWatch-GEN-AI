---
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
Add a job to `/etc/cron.d/vaultlite-nightly`:
```cron
0 2 * * * root /usr/local/bin/vaultlite backup --src /data/db --tag nightly --keep-days 30 >> /var/log/vaultlite.log 2>&1
```

In the crontab above, `--keep-days 30` ensures nightly snapshots are retired after 30 days.

## Systemd Timer Unit
Create `/etc/systemd/system/vaultlite.service`:
```ini
[Unit]
Description=VaultLite Daily Backup
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/vaultlite backup --src /var/www --tag daily --keep-days 14
```

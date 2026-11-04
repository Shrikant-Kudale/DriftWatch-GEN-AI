#!/usr/bin/env python3
"""
DriftWatch CI Drift Checker
Reads git diff changed files, inspects documentation front matter for source_files mappings,
and detects stale documentation whose `last_verified` date is older than the product change date.

Exit code 1 if stale documentation matches changed code.
Exit code 0 if docs are fresh or no code matches.
"""

import sys
import os
import glob
import re
import argparse
import subprocess
from datetime import datetime, date

try:
    import yaml
except ImportError:
    yaml = None


def parse_frontmatter(content: str):
    """Extract and parse YAML front matter from markdown file."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not match:
        return {}, content
    yaml_block, body = match.group(1), match.group(2)
    if yaml is not None:
        try:
            data = yaml.safe_load(yaml_block) or {}
            return data, body
        except Exception as e:
            print(f"[WARN] Failed to parse YAML: {e}", file=sys.stderr)
            return {}, body
    else:
        # Fallback simple parser if PyYAML is not installed
        data = {}
        current_list_key = None
        for raw_line in yaml_block.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("- ") and current_list_key:
                val = line[2:].strip().strip('"').strip("'")
                data[current_list_key].append(val)
            elif ":" in line:
                key, val = line.split(":", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if not val:
                    data[key] = []
                    current_list_key = key
                elif val.startswith("[") and val.endswith("]"):
                    items = [x.strip().strip('"').strip("'") for x in val[1:-1].split(",") if x.strip()]
                    data[key] = items
                    current_list_key = None
                else:
                    data[key] = val
                    current_list_key = None
        return data, body


def get_changed_files(base_ref: str = None) -> list[str]:
    """Get list of changed files from git diff or command line."""
    if not os.path.exists(".git"):
        return []
    try:
        if base_ref:
            cmd = ["git", "diff", "--name-only", f"{base_ref}...HEAD"]
        else:
            cmd = ["git", "diff", "--name-only", "HEAD~1"]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]
    except Exception as e:
        print(f"[WARN] Git diff command failed: {e}", file=sys.stderr)
        return []


def parse_date(date_val) -> date:
    """Parse date from string or date object."""
    if isinstance(date_val, (date, datetime)):
        return date_val if isinstance(date_val, date) else date_val.date()
    if isinstance(date_val, str):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_val.strip(), fmt).date()
            except ValueError:
                continue
    return date.min


def run_check(docs_dir: str, changed_files: list[str], change_date: date):
    print("============================================================")
    print(" DriftWatch Doc Staleness & Drift Verification Pipeline")
    print(f" Target Change Date: {change_date.isoformat()}")
    print(f" Changed Code Files ({len(changed_files)}):")
    for f in changed_files:
        print(f"   • {f}")
    print("============================================================\n")

    doc_files_set = set()
    for pattern in (os.path.join(docs_dir, "*.md"), os.path.join(docs_dir, "**", "*.md")):
        doc_files_set.update(glob.glob(pattern, recursive=True))

    if not doc_files_set and os.path.exists("public/docs"):
        doc_files_set.update(glob.glob("public/docs/*.md"))

    doc_files = sorted(list(doc_files_set))
    print(f"Found {len(doc_files)} documentation files to evaluate.")

    affected_pages = []
    stale_pages = []

    for path in sorted(doc_files):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        meta, _ = parse_frontmatter(content)
        title = meta.get("title", os.path.basename(path))
        doc_id = meta.get("id", os.path.splitext(os.path.basename(path))[0])
        raw_source_files = meta.get("source_files", [])
        if isinstance(raw_source_files, str):
            raw_source_files = [s.strip() for s in raw_source_files.split(",")]
        elif not isinstance(raw_source_files, list):
            raw_source_files = []

        last_verified_raw = meta.get("last_verified")
        last_verified = parse_date(last_verified_raw)
        owner = meta.get("owner", "Unassigned")

        # Check if any changed code file is tracked in this doc's source_files
        matching_sources = [s for s in raw_source_files if any(c.endswith(s) or s.endswith(c) for c in changed_files)]

        if matching_sources:
            is_stale = last_verified < change_date
            item = {
                "id": doc_id,
                "title": title,
                "path": path,
                "owner": owner,
                "last_verified": last_verified.isoformat() if last_verified != date.min else "Never",
                "matching_sources": matching_sources,
                "is_stale": is_stale,
            }
            affected_pages.append(item)
            if is_stale:
                stale_pages.append(item)

    print(f"\nResults:")
    print(f"  • Matched Pages: {len(affected_pages)}")
    print(f"  • Stale / At-Risk Pages: {len(stale_pages)}\n")

    if stale_pages:
        print("❌ DRIFT DETECTED: The following documentation pages reference modified code")
        print("   but have last_verified dates older than this product change:\n")
        for p in stale_pages:
            print(f"   🚨 [{p['id']}] {p['title']}")
            print(f"      File:          {p['path']}")
            print(f"      Owner:         {p['owner']}")
            print(f"      Last Verified: {p['last_verified']}")
            print(f"      Code Link:     {', '.join(p['matching_sources'])}\n")
        print("Action required: Run DriftWatch web app to propose updates and approve edits.")
        return 1
    elif affected_pages:
        print("✅ ALL MATCHED DOCS FRESH: Documentation source files were touched,")
        print("   but all referenced documentation has been verified up to date.")
        return 0
    else:
        print("✅ NO DOC DRIFT: None of the changed code files are mapped in documentation front matter.")
        return 0


def main():
    parser = argparse.ArgumentParser(description="DriftWatch Git Pull Request Drift Checker")
    parser.add_argument("--docs-dir", default="public/docs", help="Path to docs directory")
    parser.add_argument("--files", nargs="*", default=None, help="Explicit list of changed files")
    parser.add_argument("--base", default=None, help="Base git ref (e.g. origin/main) for diff")
    parser.add_argument("--date", default=None, help="Change date YYYY-MM-DD (defaults to today)")

    args = parser.parse_args()

    target_date = datetime.now().date()
    if args.date:
        target_date = parse_date(args.date)

    if args.files:
        changed_files = args.files
    else:
        changed_files = get_changed_files(args.base)

    if not changed_files:
        # Fallback to sample changed files for testing if in clean repo
        print("[INFO] No git diff detected from environment, using sample change files:")
        changed_files = ["src/retention.py", "src/backup.py", "src/restore.py", "src/cli.py"]

    code = run_check(args.docs_dir, changed_files, target_date)
    sys.exit(code)


if __name__ == "__main__":
    main()

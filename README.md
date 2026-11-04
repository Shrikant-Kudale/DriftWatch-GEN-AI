# DriftWatch

> **"AI proposes. A human decides."**

When a product changes (a pull request, commit log, or ticket), **DriftWatch** finds which documentation pages have gone stale and proposes the surgical fixes. A human verifies and approves each fix before exporting a Git patch.

---

## Key Features

1. **RAG-Driven Drift Detection**: Markdown pages are chunked by heading and embedded using Gemini vector embeddings. When a product change is submitted, cosine similarity retrieves the affected candidate pages.
2. **Human Accuracy Gate**: Nothing exports until a human approves the proposed edit. Includes side-by-side visual diffs, inline markdown editing, and verification checkboxes.
3. **Secret Scanner**: Automatically intercepts API keys, passwords, bearer tokens, emails, and IP addresses before text is sent to the AI.
4. **Multi-Audience Briefings**: Automatically generates plain-language communications tailored for Administrators, Executives, and Support teams.
5. **Automation Efficiency Logger**: Tracks engineering hours saved per release cycle.
6. **Git Pipeline Automation**: Includes `scripts/drift_check.py` and GitHub Actions workflow (`.github/workflows/drift.yml`) to audit doc staleness on PRs.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
# Gemini API Key (injected automatically in Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# Gemini Generation & Reasoning Model
GEMINI_MODEL="gemini-3.8-flash"

# Gemini Embedding Model
GEMINI_EMBED_MODEL="gemini-embedding-2-preview"
```

---

## Local Development & Setup

### Install Dependencies
```bash
npm install
```

### Run Full-Stack Dev Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### Build for Production
```bash
npm run build
```

---

## Deploying to Vercel

DriftWatch is designed for deployment on Vercel:
- Frontend built with Vite into `/dist` (rewritten via `vercel.json`).
- Backend serverless functions in `/api`:
  - `/api/embed`: Vector embeddings generator.
  - `/api/analyze`: Impact analysis and JSON-schema edits generation with SSE streaming.
  - `/api/brief`: Audience release briefings generator.
- Configure `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_EMBED_MODEL` in your Vercel Project Settings > Environment Variables.

---

## Python Drift Checker (`scripts/drift_check.py`)

DriftWatch includes a Python CLI utility for Git pipelines that checks if any modified code files correspond to documentation whose `last_verified` date is older than the product change date:

### Requirements
```bash
pip install -r scripts/requirements.txt
```

### Running the Check
```bash
# Check modified files against HEAD~1
python3 scripts/drift_check.py

# Check PR branch against base
python3 scripts/drift_check.py --base origin/main

# Check specific files
python3 scripts/drift_check.py --files src/retention.py src/backup.py
```
*Exits with code 1 if stale documentation is detected, code 0 if all matched documentation is fresh.*

---

## License
Apache-2.0

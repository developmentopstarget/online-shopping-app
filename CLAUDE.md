# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project overview

Minimal mobile-first online shopping app — React frontend + FastAPI backend.

V1 is intentionally simple: browse products, add to cart, fake checkout. No real database or payments yet.

This project started as a sneaker shop MVP, but should be treated as a general **online-shopping-app** unless the user explicitly says to keep it sneaker-specific.

## External AI-OS context

Before doing meaningful work, read these Obsidian AI-OS context files:

* `/Users/user/Library/CloudStorage/Dropbox/Obsidian/AI-OS-Vault/_META/Claude-Context/master-context.md`
* `/Users/user/Library/CloudStorage/Dropbox/Obsidian/AI-OS-Vault/_META/Claude-Context/technical-context.md`
* `/Users/user/Library/CloudStorage/Dropbox/Obsidian/AI-OS-Vault/_META/Claude-Context/ai-workflows-context.md`
* `/Users/user/Library/CloudStorage/Dropbox/Obsidian/AI-OS-Vault/01-PROJECTS/Technical/Online-Shopping-App.md`

If a listed Obsidian file does not exist, say which file is missing and continue with the available repo context. Do not invent missing project history.

## External context rules

* Treat the Obsidian project note as long-term project memory.
* Treat this repository as the current working codebase.
* Do not edit Obsidian files unless explicitly asked.
* Before architecture changes, compare the repo state with the Obsidian project note.
* After major completed work, suggest the exact note update that should be added to the Obsidian project file.
* Do not copy large Obsidian content into repo files.
* Do not expose secrets, credentials, private notes, or personal data in commits.

## Development commands

### Backend — FastAPI

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### Frontend — React/Vite

```bash
cd frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

No test runner or linter is configured yet unless the repo has changed. Always inspect current config before assuming.

## Architecture

### Backend

Single-file FastAPI backend.

Current v1 structure:

* Routes, Pydantic models, and in-memory data live in `backend/app/main.py`.
* Products are stored in a plain Python list named `PRODUCTS`.
* Data resets on server restart.
* No real database in v1.

### Frontend

Current v1 structure:

* UI and state live in `frontend/src/App.jsx`.
* Cart is ephemeral React state.
* No cart persistence yet.
* `API_URL` may be hardcoded as `http://localhost:8000`.

Starting at M1, the frontend is migrating toward:

* TypeScript
* Tailwind CSS
* better component structure
* mobile-first UI

Do not revert new `.tsx` or Tailwind code back to old `.jsx` or plain CSS patterns unless explicitly instructed.

## API contract

Frontend ↔ backend contract:

```text
GET /api/products
→ List[Product]

GET /api/products/{id}
→ Product

POST /api/checkout
Body:
{
  "items": [
    {
      "product_id": number,
      "quantity": number
    }
  ]
}
→ CheckoutResponse
```

Preserve this contract unless the task explicitly changes it.

## CORS

Backend currently allows:

* `http://localhost:5173`
* `http://127.0.0.1:5173`

If Vite uses a different port, update `allow_origins` in `backend/app/main.py`.

Do not loosen CORS broadly unless the user explicitly asks or deployment requires it.

## Milestone roadmap

| Milestone      | Branch                       | Scope                                                                                             |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| **M1** current | `feature/m1-database-search` | Real SQLite database, product search/filter/sort, migrate frontend to TypeScript + Tailwind       |
| **M2**         | `feature/m2-cart-checkout`   | Cart persistence, checkout flow, order history                                                    |
| **M3**         | `feature/m3-auth`            | JWT auth register/login; local guest cart continues after login unless backend cart is introduced |
| **M4**         | `feature/m4-admin`           | Admin CRUD for products, role-gated                                                               |

## Workflow rules

* Each milestone lives on its own branch: `feature/m{n}-description`.
* Never commit milestone work directly to `main`.
* Before changing files, run:

```bash
git status --short
```

* Inspect the existing code before editing.
* Make minimal, production-safe changes.
* Prefer small patches over rewrites.
* Do not introduce new dependencies unless necessary.
* Preserve existing API contracts unless the task explicitly changes them.
* Do not edit secrets, `.env`, credential files, generated files, or cache files.
* Do not commit `.claude/` unless explicitly requested.
* Before merging a milestone, manually test against the milestone’s test gate.
* Open a PR into `main` for review when milestone work is complete.

## Backend workflow

Before backend edits, inspect relevant files, especially:

* `backend/app/main.py`
* backend dependency files
* backend environment/config files, if present

After backend edits, run the available backend check.

Default local check:

```bash
cd backend
source venv/bin/activate
python -m compileall app
```

If tests are added later, run the test command defined by the repo.

## Frontend workflow

Before frontend edits, inspect:

* `frontend/package.json`
* `frontend/src/`
* current Tailwind/TypeScript config, if present

After frontend edits, run the available frontend check.

Prefer, in order:

```bash
cd frontend
npm run build
```

Then run lint/test only if scripts exist:

```bash
npm run lint
npm test
```

Do not assume lint/test scripts exist. Check `package.json` first.

## Mobile-first UI rules

* Design mobile-first by default.
* Desktop must still work, but mobile layout, spacing, navigation, and usability are primary.
* Prefer simple responsive Tailwind layouts.
* Avoid overbuilt UI abstractions until the app needs them.
* Keep product cards, cart, checkout, and auth flows usable on small screens first.

## Debugging rules

* Fix the smallest confirmed issue first.
* If a bug involves frontend/backend interaction, inspect both sides.
* For API bugs, verify request URL, payload shape, response status, CORS, and backend route behavior.
* For deployment bugs, inspect environment variables, allowed hosts/CORS, build logs, and runtime logs before patching.
* Do not guess deployment causes without checking config or logs.
* If something cannot be verified locally, say exactly what could not be verified.

## Stack migration note

Starting at M1, the frontend is migrating from JavaScript/CSS to TypeScript + Tailwind CSS.

This is intentional.

Do not “fix” new `.tsx` or Tailwind code by reverting it to match old `.jsx` or plain-CSS patterns. The old patterns are being replaced.

## Final response format after work

After making changes, summarize:

```text
Changed files:
- ...

Root cause:
- ...

What changed:
- ...

Checks run:
- ...

Remaining risk:
- ...

Suggested Obsidian note update:
- ...
```

Keep explanations direct and implementation-focused.

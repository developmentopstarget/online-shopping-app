# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Minimal mobile-first sneaker shop — React frontend + FastAPI backend. V1 is intentionally simple: browse products, add to cart, fake checkout. No real database or payments yet.

## Development commands

### Backend (FastAPI)
```bash
cd backend
source venv/bin/activate          # activate virtual env (already created)
uvicorn app.main:app --reload     # runs on http://localhost:8000
```
API docs auto-generated at `http://localhost:8000/docs`.

### Frontend (React/Vite)
```bash
cd frontend
npm run dev    # runs on http://localhost:5173
```

No test runner or linter is configured yet.

## Architecture

**Single-file backend** — all routes, Pydantic models, and in-memory data live in `backend/app/main.py`. Products are a plain Python list (`PRODUCTS`) that resets on server restart — no database in v1.

**Single-component frontend** — all UI and state live in `frontend/src/App.jsx`. Cart is ephemeral React state (no persistence). `API_URL` is hardcoded as `http://localhost:8000`.

**API contract** (frontend ↔ backend):
- `GET /api/products` → `List[Product]`
- `GET /api/products/{id}` → `Product`
- `POST /api/checkout` body `{ items: [{ product_id, quantity }] }` → `CheckoutResponse`

**CORS** — backend allows `localhost:5173` and `127.0.0.1:5173` only. If Vite uses a different port, update `allow_origins` in `main.py`.

## Milestone roadmap

| Milestone | Branch | Scope |
|-----------|--------|-------|
| **M1** *(current)* | `feature/m1-database-search` | Real SQLite database, product search/filter/sort, migrate frontend to TypeScript + Tailwind |
| **M2** | `feature/m2-cart-checkout` | Cart persistence, checkout flow, order history |
| **M3** | `feature/m3-auth` | JWT auth (register/login), guest cart merges into user cart on login |
| **M4** | `feature/m4-admin` | Admin CRUD for products, role-gated |

## Workflow

Each milestone lives on its own branch (`feature/m{n}-description`). Before merging, manually test against the milestone's test gate. Then open a PR into `main` for review. Never commit milestone work directly to `main`.

## Stack migration note

Starting at M1, the frontend is migrating from JavaScript/CSS to **TypeScript + Tailwind CSS**. This is intentional. Do not "fix" new `.tsx`/Tailwind code by reverting it to match old `.jsx`/plain-CSS patterns — the old patterns are what's being replaced.

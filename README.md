# Sneaker shop — v1 (learning scaffold)

A minimal mobile-first online shopping app:
- **Frontend:** React (via Vite)
- **Backend:** FastAPI
- Fake/test checkout — no real payments yet
- 3 hardcoded products — no real database yet

This is intentionally simple. The goal is to get one thing working
end-to-end (browse → add to cart → fake checkout) before adding
search, categories, reviews, or a real database.

---

## 1. Run the backend (FastAPI)

Open a terminal:

```bash
cd backend
python3 -m venv venv

# Activate the virtual environment:
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload
```

You should see something like:
```
Uvicorn running on http://127.0.0.1:8000
```

Open **http://localhost:8000/docs** in your browser — this is FastAPI's
free auto-generated docs page. You can test every endpoint right there
without even touching the frontend yet. Do this first — if the backend
isn't working, the frontend won't be able to load any products either.

---

## 2. Run the frontend (React)

Open a **second** terminal (leave the backend running in the first one):

```bash
cd frontend
npm install
npm run dev
```

You should see something like:
```
Local: http://localhost:5173/
```

Open that URL in your browser. You should see the sneaker shop, with
products loaded live from your FastAPI backend.

---

## 3. What to try

- Add a few items to the cart, then tap "Checkout" — it'll show a fake
  order confirmation (no real payment happens).
- Resize your browser window narrow vs wide — notice the product list
  goes from 1 column → 2 columns → 3 columns. That's the mobile-first
  CSS in `frontend/src/index.css` in action.
- Open `backend/app/main.py` and change a product's price or name,
  save, and refresh the frontend — FastAPI's `--reload` flag picks up
  the change automatically.

---

## 4. If something goes wrong

**"Couldn't reach the backend" message in the browser:**
Check the first terminal — is uvicorn still running and showing no
errors? Check you're visiting `localhost:5173` (frontend), not 8000.

**CORS error in the browser console:**
Make sure the backend's `allow_origins` list in `main.py` matches the
exact URL your frontend is running on (check the terminal output from
`npm run dev` for the real port, in case it's not 5173).

**`npm install` fails:**
Make sure Node.js is installed (`node -v` should print a version).
If not, install it from nodejs.org first.

---

## 5. What's NOT in this version (on purpose)

- No real database (products are a Python list — resets on restart)
- No real payments (checkout is fake/test mode)
- No user accounts/login
- No search, categories, or reviews

These come next, once this version is solid. Don't add them yet —
get this working first.

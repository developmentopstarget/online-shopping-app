#!/usr/bin/env python3
"""
Promote a registered user to admin by email.

Usage (from the backend/ directory with venv active):
    python scripts/make_admin.py user@example.com
"""
import os
import sys

# Add the backend root to sys.path so `app.*` imports resolve.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# auth.py reads JWT_SECRET at import time; provide a placeholder since this
# script never issues tokens.
os.environ.setdefault("JWT_SECRET", "make-admin-placeholder")

from app.database import SessionLocal  # noqa: E402
from app.models import User  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python scripts/make_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No account found for: {email}")
            sys.exit(1)
        if user.is_admin:
            print(f"{email} is already an admin.")
            return
        user.is_admin = True
        db.commit()
        print(f"Done — {email} is now an admin.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

import os

# Must be set before app modules are imported, since auth.py reads it at module load time.
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")

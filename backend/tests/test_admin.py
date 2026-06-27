"""
pytest tests for admin product CRUD routes.
Uses an isolated in-memory SQLite DB per test.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Category, Product, User
from app.auth import hash_password
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    cat = Category(name="Runners")
    db.add(cat)
    db.flush()
    db.add(Product(
        name="AirStride Pro", price=119.99, category_id=cat.id,
        description="Lightweight trainer", rating=4.7, stock=10,
    ))
    # Regular user
    db.add(User(email="user@example.com", hashed_password=hash_password("pass1234"), is_admin=False))
    # Admin user
    db.add(User(email="admin@example.com", hashed_password=hash_password("pass1234"), is_admin=True))
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    del app.dependency_overrides[get_db]


client = TestClient(app)

REGISTER = "/auth/register"
LOGIN = "/auth/login"
ADMIN_PRODUCTS = "/admin/products"


def _login(email: str) -> str:
    resp = client.post(LOGIN, json={"email": email, "password": "pass1234"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _auth(email: str) -> dict:
    return {"Authorization": f"Bearer {_login(email)}"}


# ---------------------------------------------------------------------------
# 403 checks — non-admin blocked from all admin routes
# ---------------------------------------------------------------------------

def test_non_admin_cannot_list_products():
    resp = client.get(ADMIN_PRODUCTS, headers=_auth("user@example.com"))
    assert resp.status_code == 403


def test_non_admin_cannot_create_product():
    resp = client.post(
        ADMIN_PRODUCTS,
        json={"name": "X", "price": 10.0, "category_id": 1, "stock": 5},
        headers=_auth("user@example.com"),
    )
    assert resp.status_code == 403


def test_non_admin_cannot_update_product():
    resp = client.put(
        f"{ADMIN_PRODUCTS}/1",
        json={"price": 50.0},
        headers=_auth("user@example.com"),
    )
    assert resp.status_code == 403


def test_non_admin_cannot_patch_stock():
    resp = client.patch(
        f"{ADMIN_PRODUCTS}/1/stock",
        json={"stock": 99},
        headers=_auth("user@example.com"),
    )
    assert resp.status_code == 403


def test_non_admin_cannot_delete_product():
    resp = client.delete(f"{ADMIN_PRODUCTS}/1", headers=_auth("user@example.com"))
    assert resp.status_code == 403


def test_unauthenticated_cannot_access_admin_routes():
    assert client.get(ADMIN_PRODUCTS).status_code == 401
    assert client.post(ADMIN_PRODUCTS, json={}).status_code == 401
    assert client.put(f"{ADMIN_PRODUCTS}/1", json={}).status_code == 401
    assert client.patch(f"{ADMIN_PRODUCTS}/1/stock", json={}).status_code == 401
    assert client.delete(f"{ADMIN_PRODUCTS}/1").status_code == 401


# ---------------------------------------------------------------------------
# Admin CRUD happy paths
# ---------------------------------------------------------------------------

def test_admin_can_list_products():
    resp = client.get(ADMIN_PRODUCTS, headers=_auth("admin@example.com"))
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(p["name"] == "AirStride Pro" for p in data)


def test_admin_can_create_product():
    payload = {
        "name": "CloudRun X",
        "price": 149.99,
        "category_id": 1,
        "description": "Ultra-cushioned",
        "stock": 25,
    }
    resp = client.post(ADMIN_PRODUCTS, json=payload, headers=_auth("admin@example.com"))
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "CloudRun X"
    assert data["price"] == 149.99
    assert data["stock"] == 25

    # New product appears in public listing
    public = client.get("/api/products").json()
    assert any(p["name"] == "CloudRun X" for p in public["items"])


def test_admin_can_update_product():
    resp = client.put(
        f"{ADMIN_PRODUCTS}/1",
        json={"price": 89.99, "name": "AirStride Pro (Sale)"},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["price"] == 89.99
    assert data["name"] == "AirStride Pro (Sale)"

    # Change reflected in public API
    public = client.get("/api/products/1").json()
    assert public["price"] == 89.99


def test_admin_can_patch_stock():
    resp = client.patch(
        f"{ADMIN_PRODUCTS}/1/stock",
        json={"stock": 42},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 200
    assert resp.json()["stock"] == 42

    public = client.get("/api/products/1").json()
    assert public["stock"] == 42


def test_admin_can_delete_product():
    resp = client.delete(f"{ADMIN_PRODUCTS}/1", headers=_auth("admin@example.com"))
    assert resp.status_code == 204

    # Deleted product not in public listing
    public = client.get("/api/products").json()
    assert not any(p["id"] == 1 for p in public["items"])

    # Direct fetch returns 404
    assert client.get("/api/products/1").status_code == 404


# ---------------------------------------------------------------------------
# Validation — invalid data is rejected
# ---------------------------------------------------------------------------

def test_create_product_with_negative_price_rejected():
    resp = client.post(
        ADMIN_PRODUCTS,
        json={"name": "Bad", "price": -5.0, "category_id": 1, "stock": 1},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 422


def test_create_product_with_zero_price_rejected():
    resp = client.post(
        ADMIN_PRODUCTS,
        json={"name": "Free", "price": 0.0, "category_id": 1, "stock": 1},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 422


def test_create_product_with_negative_stock_rejected():
    resp = client.post(
        ADMIN_PRODUCTS,
        json={"name": "X", "price": 10.0, "category_id": 1, "stock": -1},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 422


def test_create_product_with_invalid_category_rejected():
    resp = client.post(
        ADMIN_PRODUCTS,
        json={"name": "X", "price": 10.0, "category_id": 9999, "stock": 1},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 422


def test_update_nonexistent_product_returns_404():
    resp = client.put(
        f"{ADMIN_PRODUCTS}/9999",
        json={"price": 10.0},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 404


def test_delete_nonexistent_product_returns_404():
    resp = client.delete(f"{ADMIN_PRODUCTS}/9999", headers=_auth("admin@example.com"))
    assert resp.status_code == 404

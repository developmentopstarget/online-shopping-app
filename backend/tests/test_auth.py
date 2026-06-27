"""
pytest tests for /auth/register, /auth/login, and auth-gated endpoints.
Uses an isolated in-memory SQLite DB per test.
"""

from datetime import datetime, UTC, timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import SECRET_KEY, ALGORITHM
from app.database import Base, get_db
from app.models import Category, Product
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
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    del app.dependency_overrides[get_db]


client = TestClient(app)

REGISTER = "/auth/register"
LOGIN = "/auth/login"


def test_register_succeeds_and_returns_token():
    resp = client.post(REGISTER, json={"email": "alice@example.com", "password": "secret123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@example.com"


def test_register_duplicate_email_returns_409():
    client.post(REGISTER, json={"email": "dup@example.com", "password": "secret123"})
    resp = client.post(REGISTER, json={"email": "dup@example.com", "password": "different"})
    assert resp.status_code == 409


def test_register_email_is_case_insensitive():
    client.post(REGISTER, json={"email": "Bob@Example.com", "password": "pass1234"})
    resp = client.post(REGISTER, json={"email": "bob@example.com", "password": "other"})
    assert resp.status_code == 409


def test_login_correct_credentials_returns_token():
    client.post(REGISTER, json={"email": "carol@example.com", "password": "mypassword"})
    resp = client.post(LOGIN, json={"email": "carol@example.com", "password": "mypassword"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password_returns_401():
    client.post(REGISTER, json={"email": "dave@example.com", "password": "correct"})
    resp = client.post(LOGIN, json={"email": "dave@example.com", "password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


def test_login_unknown_email_returns_401():
    resp = client.post(LOGIN, json={"email": "nobody@example.com", "password": "x"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


def test_orders_requires_auth():
    resp = client.get("/api/orders")
    assert resp.status_code == 401


def test_orders_rejects_invalid_token():
    resp = client.get("/api/orders", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_orders_rejects_expired_token():
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(seconds=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    resp = client.get("/api/orders", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401


def test_checkout_associates_order_with_user():
    resp = client.post(REGISTER, json={"email": "buyer@example.com", "password": "pass1234"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    checkout = client.post(
        "/api/checkout",
        json={"items": [{"product_id": 1, "quantity": 1}]},
        headers=headers,
    )
    assert checkout.status_code == 200
    order_id = checkout.json()["order_id"]

    orders = client.get("/api/orders", headers=headers).json()
    assert any(o["id"] == order_id for o in orders)


def test_guest_checkout_succeeds_without_token():
    resp = client.post("/api/checkout", json={"items": [{"product_id": 1, "quantity": 1}]})
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_guest_orders_not_visible_to_authenticated_user():
    # Guest places an order (no token)
    client.post("/api/checkout", json={"items": [{"product_id": 1, "quantity": 1}]})

    # A different authenticated user should not see the guest order
    resp = client.post(REGISTER, json={"email": "spy@example.com", "password": "pass1234"})
    token = resp.json()["access_token"]
    orders = client.get("/api/orders", headers={"Authorization": f"Bearer {token}"}).json()
    assert orders == []

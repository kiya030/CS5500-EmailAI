import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base

# Set up the test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fixture to create and provide a test database session
@pytest.fixture(scope="module")
def test_db():
  Base.metadata.create_all(bind=engine)  # Create tables for testing
  db = TestingSessionLocal()
  try:
    yield db
  finally:
    db.close()
    Base.metadata.drop_all(bind=engine)  # Clean up tables after tests

# Replace get_db dependency in the app with the test version using a function
def override_get_db():
  db = TestingSessionLocal()
  try:
    yield db
  finally:
    db.close()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

# Create a test client instance
client = TestClient(app)

# Test for user registration endpoint
def test_register_user():
  response = client.post("/register", json={
    "username": "testuser",
    "password": "testpassword",
    "verify_password": "testpassword"
  })
  assert response.status_code == 201
  assert response.json() == {"message": "User registered successfully"}

# Test for login endpoint
def test_login_user():
  response = client.post("/login", data={
    "username": "testuser",
    "password": "testpassword"
  })
  assert response.status_code == 200
  assert "access_token" in response.json()

# Test for generating an email
def test_generate_email():
  login_response = client.post("/login", data={
    "username": "testuser",
    "password": "testpassword"
  })
  token = login_response.json()["access_token"]

  response = client.post("/generate-email", json={
    "subject": "Test email subject",
    "tone": "formal"
  }, headers={"Authorization": f"Bearer {token}"})
  assert response.status_code == 200
  assert "email_body" in response.json()

# Test for retrieving email history
def test_get_email_history():
  login_response = client.post("/login", data={
    "username": "testuser",
    "password": "testpassword"
  })
  token = login_response.json()["access_token"]

  response = client.get("/email-history", headers={"Authorization": f"Bearer {token}"})
  assert response.status_code == 200
  assert isinstance(response.json(), list)

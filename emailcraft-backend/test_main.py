import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import User, EmailHistory
from sqlalchemy import inspect
from sqlalchemy.pool import StaticPool
# Set up the test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
# Note : The sqlite3.OperationalError: no such table: users occurs because the in-memory SQLite database is resetting between 
# requests. This happens because each request to FastAPI creates a new database connection via the TestingSessionLocal, 
# which results in a new, empty in-memory database.

# Use StaticPool to maintain a single connection
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)
print(inspect(engine).get_table_names())  # Debugging: Should print ['users', 'email_history']

# Fixture to create and provide a test database session
@pytest.fixture(scope="function")  # scope=module
def test_db():
  print("Starting test_db setup...")
  Base.metadata.create_all(bind=engine)  # Create tables
  print("Tables created:", inspect(engine).get_table_names())  # Debugging
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

  # Second attempt should fail with "Username already registered"
  response = client.post("/register", json={
      "username": "testuser",
      "password": "testpassword",
      "verify_password": "testpassword"
  })
  assert response.status_code == 400
  assert response.json() == {"detail": "Username already registered"}

# Test for user registration with mismatch password
def test_register_password_mismatch():
    response = client.post("/register", json={
        "username": "testuser2",
        "password": "TestPassword123!",
        "verify_password": "WrongPassword!"
    })
    assert response.status_code == 400
    assert response.json() == {"detail": "Error: Passwords do not match"}

# Test for login endpoint
def test_login_user():
  response = client.post("/login", data={
    "username": "testuser",
    "password": "testpassword"
  })
  assert response.status_code == 200
  assert "access_token" in response.json()
  assert response.json()["token_type"] == "bearer"

# Test for invalid login
def test_login_failure():
    response = client.post("/login", data={
        "username": "nonexistentuser",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}

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

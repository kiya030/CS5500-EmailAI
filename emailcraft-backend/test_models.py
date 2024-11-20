from models import User, EmailHistory
from sqlalchemy.orm import Session
import pytest

@pytest.fixture
def test_user():
  return User(username="test_user", hashed_password="hashed_test_password")

@pytest.fixture
def test_email_history(test_user):
  return EmailHistory(user_id=1, prompt="Test prompt", generated_email="Generated email content")

def test_user_model(test_user):
  assert test_user.username == "test_user"
  assert test_user.hashed_password == "hashed_test_password"

def test_email_history_model(test_email_history):
  assert test_email_history.prompt == "Test prompt"
  assert test_email_history.generated_email == "Generated email content"

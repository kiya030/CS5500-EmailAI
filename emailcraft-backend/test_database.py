from database import SessionLocal, engine, Base
import pytest

# Test database connection
def test_database_connection():
  db = SessionLocal()
  try:
    assert db is not None
  finally:
    db.close()

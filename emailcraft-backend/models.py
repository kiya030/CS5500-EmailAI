from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base  # Adjust this import based on your project structure

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Relationship with EmailHistory
    email_history = relationship("EmailHistory", back_populates="user")

class EmailHistory(Base):
    __tablename__ = "email_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Link to User table
    prompt = Column(String, nullable=False)
    generated_email = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Define relationship to User model if needed
    user = relationship("User", back_populates="email_history")
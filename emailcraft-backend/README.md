# FastAPI Testing Framework (EmailCraft Backend)

## Overview
This repository contains tests for a FastAPI-based application using SQLite for the database. 
The tests cover the following areas:
1. **Database Connectivity**: Ensures that the database can establish a connection.
2. **Models**: Verifies the integrity and correctness of the database models.
3. **API Endpoints**: Tests for critical API functionalities, including user registration, login, email generation, and retrieval of email history.

## Test Details
### 1. Database Tests
File: `test_database.py`\
Purpose: Verifies the database connection.

### 2. Model Tests
File: `test_model.py`\
Purpose: Tests the `User` and `EmailHistory` models for correct attribute storage.
* `test_user_model`: Ensures the User model attributes are correctly set.
* `test_email_history_model`: Verifies the EmailHistory model.

### 3. API Tests
File: `test_main.py`\
Purpose: Tests core functionalities of the API.\
**User Registration:**
* Valid registration.
* Duplicate username rejection.
* Password mismatch rejection.

**User Login:**
* Valid login credentials.
* Invalid login credentials.

**Email Generation:**
* Tests email generation endpoint using a logged-in user.

**Email History:**
* Retrieves email generation history for a logged-in user.

## Database Configuration
The application uses SQLite with different configurations for testing and development.
### Testing Database
* In-Memory SQLite: Ensures clean testing by using `sqlite:///:memory:` with `StaticPool` to maintain a single connection across requests.

### Notes:
* The database schema is created globally before tests begin to avoid timing issues with FastAPI's dependency injection.





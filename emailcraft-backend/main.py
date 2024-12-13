import os
import requests
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal, engine, Base
from models import User, EmailHistory
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import random

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Load environment variables (e.g., Hugging Face API token) from .env file
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expires after 30 minutes

# Check if Hugging Face API token is loaded; raise error if not
if not HF_API_TOKEN:
    raise EnvironmentError("HF_API_TOKEN not found. Make sure it is set in your .env file.")

if not SECRET_KEY:
    raise EnvironmentError("SECRET_KEY not found. Make sure it is set in your .env file.")

# Initialize FastAPI app
app = FastAPI()

# Password hashing context for securely storing user passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme for handling token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Define input structure for email generation requests
class EmailRequest(BaseModel):
    subject: str
    tone: str = "neutral"  # Default tone

# Define structure for user registration requests
class UserRegister(BaseModel):
    username: str
    password: str
    verify_password: str
    email_address: EmailStr
    
# Function to interact with Hugging Face's multilingual model for translation
def generate_english_from_multilingual(text):
    HF_API_URL = "https://api-inference.huggingface.co/models/facebook/mbart-large-50-many-to-one-mmt"
    # Set up the request headers with authorization
    # Prompt instructing the model to create a formal English email
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json; charset=utf-8"}
    prompt = f"convert this into English: {text}"
    payload = {"inputs": prompt}

    # Send the request
    response = requests.post(HF_API_URL, headers=headers, json=payload)
    
    # Check if response is successful
    if response.status_code == 200:
        return response.json()[0]["generated_text"]
    else:
        raise HTTPException(
            status_code=response.status_code, 
            detail=f"Hugging Face API error: {response.text}"
        )
    
# Function to reformat English text into a formal email based on tone
def generate_formal_email_from_english(text, tone):
    HF_GENERATE_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
    variations = [
    f"Please write a {tone} tone email based on this: {text}",
    f"Could you reformat this text into a {tone} email? {text}",
    f"Generate a {tone} email for this: {text}"]

    #prompt = f"Please reformat the following text as a {tone} tone English email: {text}"
    prompt = random.choice(variations)

    # Randomize temperature between 0.6 and 0.9
    temperature = random.uniform(0.2, 0.9)  # Random value between 0.6 and 0.9
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 1024},  # Adjust as needed  (token limit)
        "temperature": 0.9,  # Use randomized temperature
        "top_p": 1,  # Optional: Adjust for diversity
        "top_k": 150,  # Optional: Limit potential next tokens
    }
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    response = requests.post(HF_GENERATE_URL, headers=headers, json=payload)
    # Check if response is successful
    if response.status_code == 200:
        return response.json()[0]["generated_text"]
    else:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Hugging Face API error: {response.text}"
        )
    
# Function to create a JWT token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Hashing utility
def get_password_hash(password):
    return pwd_context.hash(password)

# Password hashing and verification
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Dependency to get a database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get the current user from the token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    This function is a dependency that extracts and validates the JWT token from the request.
    It decodes the token to obtain the user information (e.g., username) and ensures that 
    the user exists in the database. It is used to authenticate and authorize users for 
    protected routes.

    Steps:
    1. The function attempts to decode the JWT token using the SECRET_KEY and ALGORITHM 
       defined in the application settings. 
       - The token should contain a `sub` field representing the username of the authenticated user.
    2. If the token is invalid or expired, or if the `sub` field is missing, an HTTP 401 
       Unauthorized exception is raised with the message "Could not validate credentials".
    3. The function queries the database to check if the user with the decoded username exists.
       - If no matching user is found, an HTTP 401 Unauthorized exception is raised.
    4. If the user is valid and exists in the database, the `user` object is returned to the calling function.
    
    Parameters:
        token (str): The JWT token that is passed with the request (usually in the Authorization header as a Bearer token).
        db (Session): The database session used to query the user from the database.

    Returns:
        User: The authenticated user object retrieved from the database, which contains user-related information.

    Raises:
        HTTPException: 
            - If the JWT token is invalid, expired, or cannot be decoded, a 401 Unauthorized error is raised.
            - If the username is missing from the decoded token, a 401 Unauthorized error is raised.
            - If the user does not exist in the database, a 401 Unauthorized error is raised.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Endpoint for generating an email based on subject and tone
@app.post("/generate-email")
def generate_email(request: EmailRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generate a formal English email based on the user's subject and tone.
    
    - Retrieves the input 'subject' and 'tone' from the request.
    - Calls the Hugging Face API to translate the subject into English.
    - Reformats the translated text into a formal email with the specified tone.
    - Stores the generated email and prompt in the EmailHistory table, linked to the current user.

    Parameters:
        request (EmailRequest): The input data containing the subject and tone.
        current_user (User): The currently authenticated user, provided by the `get_current_user` dependency.
        db (Session): The database session, provided by the `get_db` dependency.

    Returns:
        dict: A JSON response containing the original subject, tone, and generated email body.
    """
    if len(request.subject) > 500:
            raise HTTPException(status_code=400,
                                detail="Subject text is too long. Please shorten it for optimal email generation.")
    
    english_output = generate_english_from_multilingual(request.subject)
    email_body = generate_formal_email_from_english(english_output, request.tone)
    try:
        if "\n\n---\n\n" in email_body:
            email_body = email_body.split("\n\n---\n\n")[0]
        index = email_body.index("Subject:") # starting index of the text
        email_body = email_body[index:]
        # Save email history in database
        email_entry = EmailHistory(
            user_id = current_user.id,
            prompt = request.subject,
            generated_email = email_body,
        )
        db.add(email_entry)
        db.commit()
    except ValueError:
        # If "Subject:" is not found, handle the case (no database save)
        email_body = "Subject not found in the generated email. Please re-enter your email content with a valid subject."

    return {"subject": request.subject, "tone": request.tone, "email_body": email_body}

# Endpoint for retrieving the email generation history
@app.get("/email-history")
def get_email_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieve the email generation history for the currently authenticated user.
    
    - Queries the EmailHistory table to find all past email generations linked to the current user.
    - Formats each entry with the original prompt, generated email content, and timestamp.
    - Returns the user's history as a list of generated email records for display in the sidebar.

    Parameters:
        current_user (User): The currently authenticated user, provided by the `get_current_user` dependency.
        db (Session): The database session, provided by the `get_db` dependency.

    Returns:
        list: A list of dictionaries, each containing a prompt, generated email, and timestamp of generation.
    """
    # Query the email history for the current user
    history = db.query(EmailHistory).filter(EmailHistory.user_id == current_user.id).all()
    
    # Format the response data
    return [{"prompt": entry.prompt, "generated_email": entry.generated_email, "timestamp": entry.timestamp} for entry in history]


# Endpoint for registering a new user
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    """
    This endpoint allows a new user to register by providing a username, password, 
    and password confirmation (verify_password). 

    Steps:
    1. Check if the provided username already exists in the database.
       - If the username is already taken, an HTTP 400 error is raised with the message "Username already registered".
    2. Ensure the provided password and verification password match.
       - If they do not match, an HTTP 400 error is raised with the message "Passwords do not match".
    3. Hash the user's password using a secure hashing function.
    4. Create a new user in the database with the given username and hashed password.
    5. Return a success message upon successful registration with HTTP status code 201 (Created).

    Parameters:
        user (UserRegister): The data sent by the user during registration, including username, password, and password verification.
        db (Session): The database session dependency used to interact with the database.

    Returns:
        dict: A JSON response indicating successful user registration with the message "User registered successfully".
    """
    # Check if the username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if the email already exists
    existing_email = db.query(User).filter(User.email_address == user.email_address).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    
    # Check if passwords match (without hashing)
    if user.password != user.verify_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error: Passwords do not match"
        )
    # Hash the password and create the user
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password, email_address=user.email_address)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User registered successfully",
        "username": new_user.username,
        "email": new_user.email_address,
        "created_at": new_user.created_at.strftime("%Y-%m-%d %H:%M:%S")  # Format datetime
    }



@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    This endpoint allows a user to log in by providing their email and password.
    It checks the provided credentials, and if they are correct, returns a JWT token.

    Steps:
    1. Retrieve the user from the database by their email.
       - If no user is found or the password doesn't match the stored hashed password, 
         an HTTP 401 error is raised with the message "Incorrect email or password".
    2. If credentials are valid, generate a JWT (JSON Web Token) for the user.
       - The token contains the username as the subject ("sub") and is valid for a specific duration 
         (defined by `ACCESS_TOKEN_EXPIRE_MINUTES`).
    3. Return the generated JWT token and the token type ("bearer") in the response.

    Parameters:
        form_data (OAuth2PasswordRequestForm): The form data containing the email and password provided by the user.
        db (Session): The database session used to query the user data.

    Returns:
        dict: A JSON response containing the generated access token and the token type ("bearer").
        - The response will look like: 
            {"access_token": "<JWT_TOKEN>", "token_type": "bearer"}.

    Raises:
        HTTPException: 
            - If the username does not exist or the password is incorrect, an HTTP 401 Unauthorized error is raised.
    """
    # Retrieve the user from the database by email
    user = db.query(User).filter(User.email_address == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Generate a JWT token for the user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Example of a protected route
@app.get("/protected-route")
def protected_route(current_user: User = Depends(get_current_user)):
    """
    This endpoint represents a protected route that requires user authentication. 
    It ensures that only authenticated users, who possess a valid JWT token, can access it.

    Steps:
    1. The `get_current_user` dependency is called to extract the current user based on the provided JWT token.
       - If the user is authenticated (i.e., the token is valid and the user exists), 
         the `current_user` object is returned containing the user's data (such as their username).
    2. If the user is authenticated, a personalized message is returned that includes the username of the authenticated user.

    Parameters:
        current_user (User): The current authenticated user retrieved from the JWT token, injected by the `get_current_user` dependency.

    Returns:
        dict: A JSON response containing a personalized message for the authenticated user.
        - The response will look like: 
            {"message": "Hello, <username>! You have access to this protected route."}.
        
    Raises:
        HTTPException:
            - If the user is not authenticated (invalid or missing token), an HTTP 401 Unauthorized error will be raised by the `get_current_user` dependency.
    """
    return {"message": f"Hello, {current_user.username}! You have access to this protected route."}

@app.get("/profile", status_code=status.HTTP_200_OK)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve the profile information of the currently authenticated user.

    This endpoint returns the user's username, email address, and account creation date.

    Parameters:
        current_user (User): The currently authenticated user, provided by the `get_current_user` dependency.

    Returns:
        dict: A JSON response containing the user's profile information.
    """
    return {
        "username": current_user.username,
        "email_address": current_user.email_address,
        "registration_date": current_user.created_at.strftime("%Y-%m-%d"),
    }

# Run the server
if __name__ == "__main__":
    import uvicorn
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    # Create database tables based on SQLAlchemy models
    Base.metadata.create_all(bind=engine)
    uvicorn.run("main:app",reload=True)

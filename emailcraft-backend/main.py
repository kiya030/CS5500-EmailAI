import os
import requests
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal, engine, Base
from models import User
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

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

# Create database tables based on SQLAlchemy models
Base.metadata.create_all(bind=engine)

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
    prompt = f"Please reformat the following text as a {tone} tone English email: {text}"
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 1024}  # Adjust as needed  (token limit)
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
def generate_email(request: EmailRequest):
    """API endpoint to generate email based on subject and tone."""
    if len(request.subject) > 500:
            raise HTTPException(status_code=400,
                                detail="Subject text is too long. Please shorten it for optimal email generation.")
    
    english_output = generate_english_from_multilingual(request.subject)
    email_body = generate_formal_email_from_english(english_output, request.tone)
    index = email_body.index("Subject:") # starting index of the text

    email_body = email_body[index:]
    return {"subject": request.subject, "tone": request.tone, "email_body": email_body}

# Endpoint for registering a new user
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    # Check if the username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if passwords match (without hashing)
    if user.password != user.verify_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error: Passwords do not match"
        )
    # Hash the password and create the user
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}



@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Retrieve the user from the database by username
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
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
    return {"message": f"Hello, {current_user.username}! You have access to this protected route."}

# Run the server
if __name__ == "__main__":
    import uvicorn
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run("main:app",reload=True)

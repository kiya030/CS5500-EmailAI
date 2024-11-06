import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

if not HF_API_TOKEN:
    raise EnvironmentError("HF_API_TOKEN not found. Make sure it is set in your .env file.")

# Base URL for Hugging Face Inference API (GPT-J model)
# HF_API_URL = "https://api-inference.huggingface.co/models/EleutherAI/gpt-j-6B"

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define input data structure
class EmailRequest(BaseModel):
    subject: str
    tone: str = "neutral"  # Default tone
    
# Define a function to send the request to Hugging Face API
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

# Run the server
if __name__ == "__main__":
    import uvicorn
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run("main:app",reload=True)

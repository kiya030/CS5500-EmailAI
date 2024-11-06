import os
import requests
import json
from dotenv import load_dotenv

# Load API token from .env file
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# Hugging Face API URL for mBART model
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/mbart-large-50-many-to-one-mmt"

# Set up the request headers with authorization
headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json; charset=utf-8"}

# Define a function to send the request to Hugging Face API
def generate_english_email_from_multilingual(text):
    # Set up the request headers with authorization
    # Prompt instructing the model to create a formal English email
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json; charset=utf-8"}
    prompt = f"Translate and convert this into a formal English email: {text}"
    payload = {"inputs": prompt}

    # Send the request
    response = requests.post(HF_API_URL, headers=headers, json=payload)
    
    # Check if response is successful
    if response.status_code == 200:
        return response.json()[0]["generated_text"]
    else:
        raise Exception(f"Hugging Face API error: {response.text}")
    
def generate_formal_email_from_english(text):
    HF_GENERATE_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
    prompt = f"Please reformat the following text as a polite, formal English email: {text}"
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 512}  # Adjust as needed  (token limit)
    }
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    response = requests.post(HF_GENERATE_URL, headers=headers, json=payload)
    return response.json()[0]["generated_text"]

# Test with a sample input in a different language (e.g., Spanish)
try:
    text = "Quisiera saber el estado de mi solicitud de empleo. Muchas gracias por su tiempo."
    #text = "我生病了，想請假"
    english_output = generate_english_email_from_multilingual(text)
    print(text, english_output)
    email_output = generate_formal_email_from_english(english_output)
    print("Generated Email in English:\n", email_output)
except Exception as e:
    print(e)
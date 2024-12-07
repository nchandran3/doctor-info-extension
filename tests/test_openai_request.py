import os
import json
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / 'config' / 'test.env')

# Configuration
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("Please set your OpenAI API key in the .env file")

# Test data - you can modify these names
TEST_NAMES = [
    "Dr. Sarah Johnson",
    "Dr. Michael Chen",
    "Jane Doe, NP"
]

# The prompt template used in the extension
PROMPT_TEMPLATE = """For each of the following healthcare professionals, 
    provide their educational background (undergraduate and medical school), 
    residency information, and board certifications if available. 
    Format the response clearly for each person.
    
    {names}"""

def send_openai_request(names):
    # Prepare the prompt by joining names with newlines
    prompt = PROMPT_TEMPLATE.replace('{names}', '\n'.join(names))
    
    # Prepare the API request
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'gpt-4o-mini',
        'messages': [{
            'role': 'user',
            'content': prompt
        }],
        'temperature': 0.7
    }
    
    # Send the request
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers=headers,
        json=data
    )
    
    # Check for errors
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None
    
    # Parse and return the response
    result = response.json()
    return result['choices'][0]['message']['content']

def main():
    print("Sending request to OpenAI API...")
    print("\nPrompt template:")
    print(PROMPT_TEMPLATE)
    print("\nTest names:")
    for name in TEST_NAMES:
        print(f"- {name}")
    
    print("\nSending request...")
    response = send_openai_request(TEST_NAMES)
    
    if response:
        print("\nResponse from OpenAI:")
        print(response)

if __name__ == "__main__":
    main()
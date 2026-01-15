"""Test which Claude models are available with the API key."""
import os
from anthropic import Anthropic

# Load API key from .env
from dotenv import load_dotenv
load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

models_to_test = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
    "claude-2.1",
    "claude-2.0",
]

print("Testing which models are available with your API key...")
print("=" * 80)

for model in models_to_test:
    try:
        response = client.messages.create(
            model=model,
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}]
        )
        print(f"✅ {model} - WORKS")
    except Exception as e:
        error_msg = str(e)
        if "not_found_error" in error_msg or "404" in error_msg:
            print(f"❌ {model} - NOT FOUND")
        elif "permission" in error_msg.lower():
            print(f"🔒 {model} - NO PERMISSION")
        else:
            print(f"⚠️  {model} - ERROR: {error_msg[:100]}")

print("=" * 80)

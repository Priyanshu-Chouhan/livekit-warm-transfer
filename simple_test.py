print("Starting test...")

try:
    import google.generativeai as genai
    print("✅ Google Generative AI imported successfully")
    
    # Test API key
    api_key = "AIzaSyAQEg9IaVaQmR8yaw0nrDeNkBMqc0Xfo8o"
    print(f"API Key: {api_key[:10]}...")
    
    # Configure
    genai.configure(api_key=api_key)
    print("✅ API configured")
    
    # Create model
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Model created")
    
    # Test generation
    response = model.generate_content("Hello, how are you?")
    print(f"✅ Response: {response.text}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("Test complete.")
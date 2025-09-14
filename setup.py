"""
Setup script for LiveKit Warm Transfer System
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def main():
    print("🚀 Setting up LiveKit Warm Transfer System")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    # Install Python dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install Python dependencies")
        sys.exit(1)
    
    # Install Node.js dependencies
    if not run_command("npm install", "Installing Node.js dependencies"):
        print("❌ Failed to install Node.js dependencies")
        sys.exit(1)
    
    # Create environment files if they don't exist
    if not os.path.exists("backend/.env"):
        print("\n📝 Creating backend environment file...")
        with open("backend/.env", "w") as f:
            f.write("""# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Optional: Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
""")
        print("✅ Created backend/.env - Please update with your credentials")
    
    if not os.path.exists(".env.local"):
        print("\n📝 Creating frontend environment file...")
        with open(".env.local", "w") as f:
            f.write("""# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
""")
        print("✅ Created .env.local - Please update with your credentials")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Get LiveKit credentials from https://cloud.livekit.io")
    print("2. Get OpenAI API key from https://platform.openai.com")
    print("3. Update backend/.env and .env.local with your credentials")
    print("4. Run: python backend/main.py (Terminal 1)")
    print("5. Run: npm run dev (Terminal 2)")
    print("6. Open http://localhost:3000")

if __name__ == "__main__":
    main()
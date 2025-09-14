"""
Run script for LiveKit Warm Transfer System
Starts both backend and frontend services
"""

import subprocess
import sys
import os
import time
import threading

def run_backend():
    """Run the Python backend"""
    print("🔄 Starting backend server...")
    os.chdir("backend")
    subprocess.run([sys.executable, "main.py"])

def run_frontend():
    """Run the Next.js frontend"""
    print("🔄 Starting frontend server...")
    subprocess.run(["npm", "run", "dev"])

def main():
    print("🚀 Starting LiveKit Warm Transfer System")
    print("=" * 50)
    
    # Check if environment files exist
    if not os.path.exists("backend/.env"):
        print("❌ backend/.env not found. Please run setup.py first")
        sys.exit(1)
    
    if not os.path.exists(".env.local"):
        print("❌ .env.local not found. Please run setup.py first")
        sys.exit(1)
    
    print("✅ Environment files found")
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()
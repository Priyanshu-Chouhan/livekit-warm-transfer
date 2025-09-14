# LiveKit Warm Transfer - Demo Guide

## 🎯 Demo Overview

This guide will walk you through demonstrating the LiveKit Warm Transfer system, showing how AI-powered call summaries enable seamless agent handoffs.

## 📋 Prerequisites

1. **LiveKit Cloud Account** (free tier available at https://cloud.livekit.io)
2. **OpenAI API Key** (free trial at https://platform.openai.com)
3. **3 Browser Tabs/Windows** for testing different participants
4. **Microphone and Camera** access enabled

## 🚀 Quick Start

### 1. Setup (5 minutes)

```bash
# Clone and setup
git clone <your-repo>
cd livekit-warm-transfer

# Install dependencies
python setup.py

# Configure credentials
# Edit backend/.env with your LiveKit credentials
# Edit .env.local with your LiveKit credentials
```

### 2. Start Services

```bash
# Terminal 1: Backend
python backend/main.py

# Terminal 2: Frontend  
npm run dev
```

### 3. Access Application

Open http://localhost:3000 in your browser

## 🎬 Demo Script

### Scene 1: Initial Call Setup (2 minutes)

1. **Open 3 browser tabs** to http://localhost:3000
2. **Tab 1 - Caller**: 
   - Select "Caller" 
   - Enter room name: `demo-call-001`
   - Click "Join Room"
   - Allow microphone/camera access

3. **Tab 2 - Agent A**:
   - Select "Agent A"
   - Enter same room name: `demo-call-001`
   - Click "Join Room"
   - Allow microphone/camera access

4. **Verify Connection**:
   - Both participants should see each other
   - Test audio/video functionality
   - Have a brief conversation

### Scene 2: Warm Transfer Initiation (3 minutes)

1. **Agent A initiates transfer**:
   - Click "Transfer Call" button
   - System generates AI call summary
   - Transfer modal appears with summary

2. **Show AI Summary**:
   - Highlight the AI-generated call summary
   - Explain how it captures conversation context
   - Note the key points extracted

3. **Agent B joins**:
   - **Tab 3 - Agent B**:
     - Select "Agent B"
     - Enter same room name: `demo-call-001`
     - Click "Join Room"

### Scene 3: Context Sharing (2 minutes)

1. **Agent A explains summary**:
   - Agent A reads the AI summary to Agent B
   - Demonstrates context preservation
   - Shows seamless knowledge transfer

2. **Transfer completion**:
   - Agent A clicks "Complete Transfer"
   - Agent A leaves the call
   - Caller and Agent B remain connected

### Scene 4: Verification (1 minute)

1. **Confirm transfer success**:
   - Caller and Agent B continue conversation
   - Agent B has full context from summary
   - No information loss during handoff

## 🎥 Recording Tips

### For Loom/Demo Recording:

1. **Screen Layout**:
   - Show all 3 browser tabs side by side
   - Highlight the transfer button and modal
   - Focus on the AI summary generation

2. **Audio Setup**:
   - Use a good microphone
   - Test audio levels before recording
   - Speak clearly when explaining features

3. **Key Moments to Highlight**:
   - AI summary generation (show the API call)
   - Transfer modal with context
   - Seamless handoff process
   - No data loss during transfer

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to connect to room"**:
   - Check LiveKit credentials in .env files
   - Ensure backend is running on port 8000
   - Verify network connectivity

2. **"No audio/video"**:
   - Check browser permissions
   - Ensure microphone/camera are not in use elsewhere
   - Try refreshing the page

3. **"Transfer failed"**:
   - Check OpenAI API key
   - Ensure backend is running
   - Check browser console for errors

### Debug Commands:

```bash
# Check backend logs
tail -f backend/logs/app.log

# Check frontend logs
# Open browser developer tools (F12)

# Test API endpoints
curl http://localhost:8000/api/rooms
```

## 📊 Demo Metrics

Track these metrics during your demo:

- **Connection Time**: < 5 seconds
- **Transfer Initiation**: < 2 seconds  
- **AI Summary Generation**: < 3 seconds
- **Total Transfer Time**: < 30 seconds
- **Context Preservation**: 100% (no data loss)

## 🎯 Key Selling Points

1. **Real-time Performance**: WebRTC ensures low latency
2. **AI Intelligence**: Context-aware summaries
3. **Seamless UX**: One-click transfers
4. **Scalable Architecture**: Handles multiple concurrent calls
5. **Optional Phone Integration**: Twilio for PSTN calls

## 📝 Post-Demo Questions

Be prepared to answer:

1. **"How does the AI generate summaries?"**
   - Uses OpenAI GPT models
   - Analyzes conversation history
   - Extracts key points and context

2. **"Can this scale to real production?"**
   - Yes, LiveKit handles enterprise scale
   - Backend can be deployed to cloud
   - Database integration available

3. **"What about security?"**
   - End-to-end encryption via WebRTC
   - Secure token-based authentication
   - GDPR compliant data handling

## 🚀 Next Steps

After the demo:

1. **Deploy to production** (AWS, GCP, Azure)
2. **Add database persistence** (PostgreSQL, MongoDB)
3. **Implement user authentication**
4. **Add call recording features**
5. **Integrate with CRM systems**

---

**Need help?** Check the README.md or create an issue in the repository.
# LiveKit Warm Transfer - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Caller        │    │   Agent A       │    │   Agent B       │
│   (Browser)     │    │   (Browser)     │    │   (Browser)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ WebRTC               │ WebRTC               │ WebRTC
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     LiveKit Cloud         │
                    │   (WebRTC Infrastructure) │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     Python Backend        │
                    │   (FastAPI + LiveKit SDK) │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     OpenAI GPT API        │
                    │   (Call Summary Gen)      │
                    └───────────────────────────┘
```

## 🔄 Warm Transfer Flow

### 1. Initial Call Setup
```
Caller ──WebRTC──> LiveKit Room 1 ──WebRTC──> Agent A
```

### 2. Transfer Initiation
```
Agent A clicks "Transfer" 
    ↓
Backend generates AI summary
    ↓
Agent A + Agent B in Room 2
    ↓
Agent A explains summary to Agent B
    ↓
Agent A exits Room 1
    ↓
Caller + Agent B connected
```

## 🛠️ Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **UI**: React + Tailwind CSS
- **Real-time**: LiveKit React Components
- **State**: React Hooks + Context

### Backend (Python)
- **Framework**: FastAPI
- **Real-time**: LiveKit Server SDK
- **AI**: OpenAI GPT-3.5/4
- **Optional**: Twilio for PSTN calls

### Infrastructure
- **WebRTC**: LiveKit Cloud (free tier)
- **AI**: OpenAI API
- **Optional**: Twilio for phone integration

## 📁 Project Structure

```
livekit-warm-transfer/
├── backend/
│   ├── main.py                 # FastAPI backend
│   ├── twilio_integration.py   # Optional phone integration
│   └── .env                    # Backend environment
├── app/
│   ├── page.tsx               # Home page
│   ├── room/[roomName]/
│   │   └── page.tsx           # Room interface
│   └── globals.css            # Styles
├── package.json               # Frontend dependencies
├── requirements.txt           # Backend dependencies
├── setup.py                  # Setup script
├── run.py                    # Run script
├── README.md                 # Main documentation
├── DEMO_GUIDE.md            # Demo instructions
└── ARCHITECTURE.md          # This file
```

## 🔌 API Endpoints

### Room Management
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join existing room
- `GET /api/rooms` - List active rooms
- `POST /api/rooms/{room}/leave` - Leave room

### Transfer Logic
- `POST /api/transfer/initiate` - Start warm transfer
- `POST /api/summary/generate` - Generate AI summary

### Optional Twilio
- `POST /api/twilio/transfer` - Phone transfer
- `POST /api/twilio/sms-summary` - SMS summary

## 🔐 Security Features

- **Authentication**: LiveKit JWT tokens
- **Encryption**: WebRTC end-to-end encryption
- **Authorization**: Role-based access (Caller/Agent A/Agent B)
- **Data Privacy**: No persistent storage of conversations

## 🚀 Deployment Options

### Development
```bash
python backend/main.py    # Backend on :8000
npm run dev              # Frontend on :3000
```

### Production
- **Backend**: Deploy to AWS/GCP/Azure
- **Frontend**: Deploy to Vercel/Netlify
- **Database**: Add PostgreSQL for persistence
- **Monitoring**: Add logging and metrics

## 📊 Performance Characteristics

- **Latency**: < 100ms (WebRTC)
- **Concurrent Calls**: 100+ (LiveKit free tier)
- **AI Response**: < 3 seconds (OpenAI)
- **Transfer Time**: < 30 seconds (end-to-end)

## 🔧 Configuration

### Required Environment Variables
```bash
# LiveKit
LIVEKIT_URL=wss://your-url.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI
OPENAI_API_KEY=your-openai-key

# Optional: Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number
```

## 🎯 Key Features Implemented

✅ **Real-time Audio/Video** - WebRTC via LiveKit  
✅ **Warm Transfer Logic** - Agent A → Agent B handoff  
✅ **AI Call Summaries** - OpenAI GPT integration  
✅ **Interactive UI** - Next.js with modern design  
✅ **Room Management** - Create/join/leave rooms  
✅ **Optional Phone Integration** - Twilio PSTN support  
✅ **Comprehensive Documentation** - README + Demo Guide  

## 🚀 Future Enhancements

- **Call Recording** - Store and replay conversations
- **CRM Integration** - Connect to Salesforce, HubSpot
- **Analytics Dashboard** - Transfer metrics and insights
- **Mobile Apps** - React Native implementation
- **Advanced AI** - Sentiment analysis, intent detection
- **Multi-language Support** - Internationalization
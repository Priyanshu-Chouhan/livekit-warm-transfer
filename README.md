# LiveKit Warm Transfer System

A real-time call transfer system that enables seamless handoffs between agents with AI-generated call summaries.

## 🚀 Features

- **Real-time Audio/Video Calls** using LiveKit WebRTC
- **Warm Transfer** between agents with context preservation
- **AI-Powered Call Summaries** using OpenAI GPT models
- **Interactive Web UI** built with Next.js
- **Unique Participant Names** with random ID generation
- **Optional Twilio Integration** for real phone number transfers

## 🏗️ Architecture

```
Caller → Agent A (LiveKit Room 1) → Transfer → Agent B (LiveKit Room 2)
                ↓
            LLM Summary Generation
                ↓
        Agent A explains to Agent B
                ↓
        Agent A exits, Caller + Agent B connected
```

## 🛠️ Tech Stack

- **Backend**: Python + FastAPI + LiveKit Server SDK
- **Frontend**: Next.js 14 + LiveKit React SDK
- **AI**: OpenAI GPT-3.5/4 for call summaries
- **Real-time**: WebRTC via LiveKit
- **Deployment**: Render.com
- **Optional**: Twilio for PSTN integration

## ⚡ Quick Start

### Prerequisites

1. **LiveKit Cloud Account** (free tier available)
2. **OpenAI API Key** (free trial credits)
3. **Node.js 18+** and **Python 3.8+**
4. **Optional**: Twilio account for phone integration

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/Priyanshu-Chouhan/livekit-warm-transfer.git
   cd livekit-warm-transfer
   npm install
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   
   Create `.env.local` file in project root:
   ```bash
   # LiveKit Configuration
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
   NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key
   
   # Backend API URL (Local)
   NEXT_PUBLIC_API_URL_LOCAL=http://localhost:8000
   ```
   
   Create `.env` file in backend directory:
   ```bash
   # LiveKit Configuration
   LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
   LIVEKIT_API_KEY=your-livekit-api-key
   LIVEKIT_API_SECRET=your-livekit-api-secret
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   
   # Optional: Twilio Configuration
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```

3. **Run Services**
   ```bash
   # Terminal 1: Backend
   python backend/main.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000
   - Join as Caller, Agent A, or Agent B
   - Test warm transfer functionality

## 🌐 Production Deployment (Render)

### Frontend Service
```
Name: livekit-warm-transfer-frontend
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
Environment Variables:
- NODE_ENV=production
- NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
- NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key
- NEXT_PUBLIC_API_URL_LIVE=https://livekit-warm-transfer-backend.onrender.com
```

### Backend Service
```
Name: livekit-warm-transfer-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: python backend/main.py
Environment Variables:
- LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
- LIVEKIT_API_KEY=your-livekit-api-key
- LIVEKIT_API_SECRET=your-livekit-api-secret
- OPENAI_API_KEY=your-openai-api-key
```

## 📱 Usage

1. **Start a Call**: Caller connects to Agent A
2. **Initiate Transfer**: Agent A clicks "Transfer Call"
3. **AI Summary**: System generates call context using LLM
4. **Warm Handoff**: Agent A explains summary to Agent B
5. **Complete Transfer**: Agent A exits, Caller + Agent B connected

## 🔧 API Endpoints

- `POST /api/rooms/create` - Create new LiveKit room
- `POST /api/transfer/initiate` - Start warm transfer
- `POST /api/transfer/complete` - Complete transfer
- `POST /api/summary/generate` - Generate call summary

## 🎯 Key Features

### Unique Participant Names
- Each participant gets a unique 4-digit random ID
- Format: `caller_1234`, `agent_a_5678`, `agent_b_9012`
- No duplicate names in the same room

### Environment Variable Management
- **Local**: `NEXT_PUBLIC_API_URL_LOCAL=http://localhost:8000`
- **Production**: `NEXT_PUBLIC_API_URL_LIVE=https://livekit-warm-transfer-backend.onrender.com`
- Automatic switching between local and live environments

## 🔗 Live Demo

- **Frontend**: https://livekit-warm-transfer-frontend.onrender.com
- **Backend**: https://livekit-warm-transfer-backend.onrender.com

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.
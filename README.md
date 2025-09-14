# LiveKit Warm Transfer System

A real-time call transfer system that enables seamless handoffs between agents with AI-generated call summaries.

## Features

- **Real-time Audio/Video Calls** using LiveKit WebRTC
- **Warm Transfer** between agents with context preservation
- **AI-Powered Call Summaries** using OpenAI GPT models
- **Interactive Web UI** built with Next.js
- **Optional Twilio Integration** for real phone number transfers

## Architecture

```
Caller → Agent A (LiveKit Room 1) → Transfer → Agent B (LiveKit Room 2)
                ↓
            LLM Summary Generation
                ↓
        Agent A explains to Agent B
                ↓
        Agent A exits, Caller + Agent B connected
```

## Tech Stack

- **Backend**: Python + LiveKit Server SDK
- **Frontend**: Next.js + LiveKit React SDK
- **AI**: OpenAI GPT-3.5/4 for call summaries
- **Real-time**: WebRTC via LiveKit
- **Optional**: Twilio for PSTN integration

## Quick Start

### Prerequisites

1. **LiveKit Cloud Account** (free tier available)
2. **OpenAI API Key** (free trial credits)
3. **Node.js 18+** and **Python 3.8+**
4. **Optional**: Twilio account for phone integration

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd livekit-warm-transfer
   npm install
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   ```bash
   # Backend (.env)
   LIVEKIT_URL=wss://your-livekit-url
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   OPENAI_API_KEY=your-openai-key
   
   # Frontend (.env.local)
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
   NEXT_PUBLIC_LIVEKIT_API_KEY=your-api-key
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

## Usage

1. **Start a Call**: Caller connects to Agent A
2. **Initiate Transfer**: Agent A clicks "Transfer Call"
3. **AI Summary**: System generates call context using LLM
4. **Warm Handoff**: Agent A explains summary to Agent B
5. **Complete Transfer**: Agent A exits, Caller + Agent B connected

## API Endpoints

- `POST /api/rooms/create` - Create new LiveKit room
- `POST /api/transfer/initiate` - Start warm transfer
- `POST /api/transfer/complete` - Complete transfer
- `POST /api/summary/generate` - Generate call summary

## Optional Twilio Integration

To enable real phone number transfers:

1. Get Twilio credentials
2. Add to environment variables
3. Uncomment Twilio routes in backend
4. Use phone numbers in transfer flow

## Demo Recording

[Loom Demo Link] - Shows complete warm transfer flow

## Quick Demo

1. **Setup** (2 min): Run `python setup.py` and configure credentials
2. **Start** (1 min): `python backend/main.py` + `npm run dev`
3. **Test** (5 min): Open 3 browser tabs as Caller, Agent A, Agent B
4. **Transfer**: Agent A clicks "Transfer Call" → AI summary → Agent B takes over

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for detailed demo script.

## License

MIT License - see LICENSE file for details"# livekit-warm-transfer" 

# Environment Setup Guide

## Local Development vs Production

### For Local Development:
Create `.env.local` file in project root:

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key

# Backend API URL (Local)
NEXT_PUBLIC_API_URL_LOCAL=http://localhost:8000
```

### For Production (Render Deployment):
In Render dashboard, set these environment variables:

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key

# Backend API URL (Live)
NEXT_PUBLIC_API_URL_LIVE=https://livekit-warm-transfer-backend.onrender.com
```

## How to Switch Between Local and Live:

### Environment Variables (Recommended)
- **Local**: Use `.env.local` file with `NEXT_PUBLIC_API_URL_LOCAL=http://localhost:8000`
- **Production**: Set environment variables in Render dashboard with `NEXT_PUBLIC_API_URL_LIVE=https://livekit-warm-transfer-backend.onrender.com`

### Code Implementation:
```javascript
// Uses local first, then live - automatic switching
const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || process.env.NEXT_PUBLIC_API_URL_LIVE
```

**No hard coding!** सिर्फ `.env` file से value use करते हैं।

## Current Setup:
- **Local Development**: `http://localhost:8000` ✅
- **Production**: `https://livekit-warm-transfer-backend.onrender.com` ✅

Both URLs are now configured and working!
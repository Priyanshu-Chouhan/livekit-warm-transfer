# Manual Render Deployment Guide (Blueprint नहीं है)

अगर Blueprint option नहीं दिख रहा है, तो यह manual deployment guide follow करें:

## Step 1: Render Dashboard में जाएं

1. [render.com](https://render.com) पर जाएं
2. Sign in करें
3. Dashboard पर "New +" button click करें

## Step 2: Frontend Service Deploy करें

### Web Service Create करें:
1. "New +" → "Web Service" select करें
2. "Build and deploy from a Git repository" choose करें
3. GitHub repository connect करें: `Priyanshu-Chouhan/livekit-warm-transfer`

### Frontend Configuration:
```
Name: livekit-warm-transfer-frontend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (leave empty)
Build Command: npm install && npm run build
Start Command: npm start
```

### Frontend Environment Variables:
```
NODE_ENV = production
NEXT_PUBLIC_LIVEKIT_URL = wss://your-livekit-url.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY = your-livekit-api-key
NEXT_PUBLIC_API_URL_LIVE = https://livekit-warm-transfer-backend.onrender.com
```

## Step 3: Backend Service Deploy करें

### दूसरा Web Service Create करें:
1. फिर से "New +" → "Web Service" select करें
2. Same repository connect करें

### Backend Configuration:
```
Name: livekit-warm-transfer-backend
Environment: Python 3
Region: Oregon (US West)
Branch: main
Root Directory: . (project root)
Build Command: pip install -r requirements.txt
Start Command: python backend/main.py
```

### Backend Environment Variables:
```
LIVEKIT_URL = wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY = your-livekit-api-key
LIVEKIT_API_SECRET = your-livekit-api-secret
OPENAI_API_KEY = your-openai-api-key
TWILIO_ACCOUNT_SID = your-twilio-account-sid (optional)
TWILIO_AUTH_TOKEN = your-twilio-auth-token (optional)
TWILIO_PHONE_NUMBER = your-twilio-phone-number (optional)
```

## Step 4: Deploy करें

1. दोनों services के लिए "Create Web Service" click करें
2. Render automatically build और deploy करेगा
3. आपको दो URLs मिलेंगे:
   - Frontend: `https://livekit-warm-transfer-frontend.onrender.com`
   - Backend: `https://livekit-warm-transfer-backend.onrender.com`

## Step 5: Environment Variables Update करें

Backend deploy होने के बाद:
1. Frontend service में जाएं
2. Environment tab में जाएं
3. `NEXT_PUBLIC_API_URL` को backend URL से update करें
4. "Save Changes" click करें

## Important Notes:

### Free Tier Limitations:
- Services 15 minutes बाद sleep हो जाते हैं
- Cold start 30-60 seconds लग सकता है
- 750 hours/month limit है

### Troubleshooting:
1. **Build Failures**: Environment variables check करें
2. **CORS Errors**: API URL correct है या नहीं check करें
3. **LiveKit Connection**: Credentials verify करें

## Testing:
1. Frontend URL open करें
2. Room create करें
3. Warm transfer test करें

यह manual process है अगर Blueprint option available नहीं है!
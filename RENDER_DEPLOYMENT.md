# Render Deployment Guide

This guide will help you deploy your LiveKit Warm Transfer System to Render for live hosting.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **LiveKit Account**: Get your LiveKit credentials
4. **OpenAI API Key**: For AI call summaries

## Deployment Steps

### Step 1: Connect GitHub Repository

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Blueprint"
3. Connect your GitHub account
4. Select your `livekit-warm-transfer` repository

### Step 2: Configure Services

The `render.yaml` file will automatically create two services:

#### Frontend Service (Next.js)
- **Name**: livekit-warm-transfer-frontend
- **Type**: Web Service
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Backend Service (Python)
- **Name**: livekit-warm-transfer-backend
- **Type**: Web Service
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python backend/main.py`

### Step 3: Environment Variables

Set these environment variables in Render dashboard:

#### Frontend Environment Variables:
```
NODE_ENV=production
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=your-livekit-api-key
NEXT_PUBLIC_API_URL=https://livekit-warm-transfer-backend.onrender.com
```

#### Backend Environment Variables:
```
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid (optional)
TWILIO_AUTH_TOKEN=your-twilio-auth-token (optional)
TWILIO_PHONE_NUMBER=your-twilio-phone-number (optional)
```

### Step 4: Deploy

1. Click "Apply" in the Blueprint
2. Render will automatically:
   - Build both services
   - Deploy them
   - Provide live URLs

### Step 5: Access Your Live Application

After deployment, you'll get:
- **Frontend URL**: `https://livekit-warm-transfer-frontend.onrender.com`
- **Backend URL**: `https://livekit-warm-transfer-backend.onrender.com`

## Important Notes

### Free Tier Limitations
- Services may sleep after 15 minutes of inactivity
- Cold starts may take 30-60 seconds
- Limited to 750 hours/month

### Production Considerations
- Consider upgrading to paid plans for production use
- Set up custom domains
- Configure SSL certificates
- Monitor logs and performance

### Troubleshooting

#### Common Issues:
1. **Build Failures**: Check environment variables are set correctly
2. **CORS Errors**: Ensure `NEXT_PUBLIC_API_URL` points to your backend URL
3. **LiveKit Connection**: Verify LiveKit credentials and URL format
4. **Cold Starts**: First request after sleep may be slow

#### Logs:
- Check Render dashboard → Your Service → Logs
- Monitor both frontend and backend logs

## Testing Your Deployment

1. Open your frontend URL
2. Create a room
3. Test the warm transfer functionality
4. Verify AI summaries are working

## Updating Your Deployment

To update your live application:
1. Push changes to your GitHub repository
2. Render will automatically redeploy
3. Check logs for any issues

## Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- LiveKit Documentation: [docs.livekit.io](https://docs.livekit.io)
- Project Issues: Create an issue in your GitHub repository
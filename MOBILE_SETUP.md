# 📱 Mobile & Local Network Setup Guide

## 🚀 Quick Start for Mobile Testing

### 1. **Start Backend (Mobile Access)**
```bash
cd backend
python main.py
```
Backend will run on `http://0.0.0.0:8000` (accessible from mobile)

### 2. **Start Frontend (Mobile Access)**
```bash
# Option 1: Mobile-friendly development server
npm run dev:mobile

# Option 2: Regular development server
npm run dev
```
Frontend will run on `http://0.0.0.0:3000` (accessible from mobile)

### 3. **Find Your Local IP Address**

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter

#### Mac/Linux:
```bash
ifconfig | grep "inet "
```

### 4. **Access from Mobile Device**

#### On your mobile device, open browser and go to:
```
http://YOUR_LOCAL_IP:3000
```

**Example:**
- If your local IP is `192.168.1.100`
- Access: `http://192.168.1.100:3000`

## 📱 Mobile Features

### ✅ **Responsive Design**
- **Single column layout** on mobile
- **Touch-friendly buttons** (larger tap targets)
- **Optimized font sizes** for mobile screens
- **Compact status indicators**

### ✅ **Mobile-Optimized Controls**
- **Smaller button padding** on mobile
- **Hidden text labels** on mobile (icons only)
- **Responsive video grid** (1 column on mobile)
- **Touch-friendly spacing**

### ✅ **Network Configuration**
- **CORS enabled** for local network access
- **Backend accessible** from mobile devices
- **LiveKit WebRTC** works on mobile browsers

## 🔧 Troubleshooting

### **Mobile Can't Connect**
1. **Check firewall** - Allow ports 3000 and 8000
2. **Same network** - Ensure mobile and computer on same WiFi
3. **Correct IP** - Use your computer's local IP address
4. **Port access** - Try `http://IP:3000` and `http://IP:8000`

### **Audio/Video Issues on Mobile**
1. **Browser permissions** - Allow microphone and camera
2. **HTTPS required** - Some browsers need HTTPS for WebRTC
3. **Network quality** - Ensure stable WiFi connection

### **Development vs Production**
- **Development**: Use `npm run dev:mobile` for mobile testing
- **Production**: Use `npm run start:mobile` for production mobile access

## 📋 Testing Checklist

### **Mobile Testing:**
- [ ] Home page loads correctly
- [ ] Participant selection works
- [ ] Room joining works
- [ ] Audio/video controls work
- [ ] Transfer functionality works
- [ ] Status indicators display correctly

### **Cross-Device Testing:**
- [ ] Desktop to mobile call
- [ ] Mobile to desktop call
- [ ] Multiple mobile devices
- [ ] Different browsers (Chrome, Safari, Firefox)

## 🌐 Network Configuration

### **Backend CORS Settings:**
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.*.*:3000",  # Local network
    "http://192.168.*.*:3001",
    "http://10.*.*.*:3000",     # Corporate network
    "http://10.*.*.*:3001",
]
```

### **Frontend Mobile Scripts:**
```json
{
  "dev:mobile": "next dev -H 0.0.0.0",
  "start:mobile": "next start -H 0.0.0.0"
}
```

## 📱 Mobile Browser Support

### **Supported Browsers:**
- ✅ **Chrome Mobile** (Android/iOS)
- ✅ **Safari Mobile** (iOS)
- ✅ **Firefox Mobile** (Android/iOS)
- ✅ **Edge Mobile** (Android/iOS)

### **WebRTC Requirements:**
- **HTTPS** (for production)
- **Microphone/Camera permissions**
- **Stable network connection**
- **Modern browser** (last 2 years)

## 🎯 Demo Flow for Mobile

1. **Desktop**: Join as "Caller" at `http://localhost:3000`
2. **Mobile**: Join as "Agent A" at `http://YOUR_IP:3000`
3. **Another Mobile**: Join as "Agent B" at `http://YOUR_IP:3000`
4. **Test transfer** from mobile Agent A to mobile Agent B
5. **Verify audio/video** works across all devices

---

**Ready for mobile testing! 🚀📱**
"""
LiveKit Warm Transfer Backend
Handles room management, transfer logic, and LLM integration
"""

import os
import asyncio
import json
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from livekit import api
# from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
# from livekit.agents.voice_assistant import VoiceAssistant
# from livekit.plugins import openai
import openai as openai_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="LiveKit Warm Transfer API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LiveKit configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize LiveKit client (will be created in async context)
livekit_client = None

# Initialize OpenAI client
openai_client.api_key = OPENAI_API_KEY

# In-memory storage for demo (replace with database in production)
active_rooms: Dict[str, Dict] = {}
call_contexts: Dict[str, List[str]] = {}
transfer_requests: Dict[str, Dict] = {}

# Pydantic models
class RoomCreateRequest(BaseModel):
    room_name: str
    participant_type: str  # "caller", "agent_a", "agent_b"

class TransferRequest(BaseModel):
    from_room: str
    to_room: str
    caller_room: str

class SummaryRequest(BaseModel):
    room_name: str
    conversation_history: List[str]

# API Routes
@app.get("/")
async def root():
    return {"message": "LiveKit Warm Transfer API", "status": "running"}

@app.post("/api/rooms/create")
async def create_room(request: RoomCreateRequest):
    """Create a new LiveKit room with token"""
    try:
        # Initialize LiveKit client
        global livekit_client
        if livekit_client is None:
            livekit_client = api.LiveKitAPI(
                url=LIVEKIT_URL,
                api_key=LIVEKIT_API_KEY,
                api_secret=LIVEKIT_API_SECRET,
            )
        
        room_name = request.room_name
        participant_type = request.participant_type
        
        # Create room
        room_info = await livekit_client.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                max_participants=10,
                metadata=json.dumps({
                    "participant_type": participant_type,
                    "created_at": datetime.now().isoformat()
                })
            )
        )
        
        # Generate token for participant
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(participant_type)
        token.with_name(f"{participant_type}_{room_name}")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True
        ))
        
        jwt_token = token.to_jwt()
        
        # Store room info
        active_rooms[room_name] = {
            "room_info": room_info,
            "participants": [participant_type],
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        return {
            "room_name": room_name,
            "token": jwt_token,
            "url": LIVEKIT_URL,
            "room_info": {
                "name": room_info.name,
                "num_participants": room_info.num_participants,
                "max_participants": room_info.max_participants,
                "creation_time": room_info.creation_time,
                "turn_password": room_info.turn_password,
                "enabled_codecs": [codec.mime_type for codec in room_info.enabled_codecs] if room_info.enabled_codecs else [],
                "metadata": room_info.metadata
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rooms/join")
async def join_room(room_name: str, participant_type: str):
    """Generate token for joining existing room"""
    try:
        if room_name not in active_rooms:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Generate token
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(participant_type)
        token.with_name(f"{participant_type}_{room_name}")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True
        ))
        
        jwt_token = token.to_jwt()
        
        # Add participant to room
        active_rooms[room_name]["participants"].append(participant_type)
        
        return {
            "room_name": room_name,
            "token": jwt_token,
            "url": LIVEKIT_URL,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transfer/initiate")
async def initiate_transfer(request: TransferRequest):
    """Initiate warm transfer between agents"""
    try:
        from_room = request.from_room
        to_room = request.to_room
        caller_room = request.caller_room
        
        # Validate rooms exist
        if from_room not in active_rooms:
            raise HTTPException(status_code=404, detail="Source room not found")
        if to_room not in active_rooms:
            raise HTTPException(status_code=404, detail="Target room not found")
        
        # Store transfer request
        transfer_id = f"transfer_{from_room}_{to_room}_{datetime.now().timestamp()}"
        transfer_requests[transfer_id] = {
            "from_room": from_room,
            "to_room": to_room,
            "caller_room": caller_room,
            "status": "initiated",
            "created_at": datetime.now().isoformat()
        }
        
        # Generate call summary
        summary = await generate_call_summary(caller_room)
        
        return {
            "transfer_id": transfer_id,
            "status": "initiated",
            "call_summary": summary,
            "next_steps": [
                "Agent A should explain summary to Agent B",
                "Agent A should exit original room",
                "Caller will be connected to Agent B"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summary/generate")
async def generate_summary(request: SummaryRequest):
    """Generate AI-powered call summary"""
    try:
        summary = await generate_call_summary(request.room_name, request.conversation_history)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_call_summary(room_name: str, conversation_history: Optional[List[str]] = None):
    """Generate call summary using OpenAI"""
    try:
        # Get conversation history
        if conversation_history is None:
            conversation_history = call_contexts.get(room_name, [])
        
        if not conversation_history:
            return "No conversation history available for summary generation."
        
        # Prepare prompt for OpenAI
        prompt = f"""
        Generate a concise call summary for a warm transfer. 
        Include key points, customer needs, and current status.
        
        Conversation History:
        {chr(10).join(conversation_history[-10:])}  # Last 10 messages
        
        Summary should be:
        - 2-3 sentences maximum
        - Focus on customer needs and current situation
        - Include any important details for the receiving agent
        """
        
        response = await openai_client.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI assistant that creates concise call summaries for warm transfers between customer service agents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Store summary
        if room_name not in call_contexts:
            call_contexts[room_name] = []
        call_contexts[room_name].append(f"[SUMMARY] {summary}")
        
        return summary
        
    except Exception as e:
        return f"Error generating summary: {str(e)}"

@app.get("/api/rooms")
async def list_rooms():
    """List all active rooms"""
    return {"rooms": active_rooms}

@app.get("/api/rooms/{room_name}")
async def get_room(room_name: str):
    """Get specific room information"""
    if room_name not in active_rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room": active_rooms[room_name]}

@app.post("/api/rooms/{room_name}/leave")
async def leave_room(room_name: str, participant_type: str):
    """Handle participant leaving room"""
    try:
        if room_name in active_rooms:
            if participant_type in active_rooms[room_name]["participants"]:
                active_rooms[room_name]["participants"].remove(participant_type)
            
            # If no participants left, mark room as inactive
            if not active_rooms[room_name]["participants"]:
                active_rooms[room_name]["status"] = "inactive"
        
        return {"status": "success", "message": f"{participant_type} left {room_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time updates (optional)
@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket, room_name: str):
    """WebSocket for real-time room updates"""
    await websocket.accept()
    try:
        while True:
            # Send room updates
            room_data = active_rooms.get(room_name, {})
            await websocket.send_text(json.dumps(room_data))
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
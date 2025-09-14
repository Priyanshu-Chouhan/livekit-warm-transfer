'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client'
import { 
  LiveKitRoom, 
  VideoConference, 
  GridLayout, 
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext
} from '@livekit/components-react'
import { 
  Phone, 
  PhoneOff, 
  Users, 
  ArrowRightLeft, 
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react'

interface CallSummary {
  summary: string
  status: string
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomName = params.roomName as string
  const participantType = searchParams.get('type') as 'caller' | 'agent_a' | 'agent_b'
  
  const [room, setRoom] = useState<Room | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferStatus, setTransferStatus] = useState<string>('')
  const [conversationHistory, setConversationHistory] = useState<string[]>([])

  const roomRef = useRef<Room | null>(null)

  // Initialize room connection
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        // Get room token from backend
        const response = await fetch('http://localhost:8000/api/rooms/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_name: roomName,
            participant_type: participantType
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', errorText)
          throw new Error(`Failed to create room: ${response.status} ${errorText}`)
        }

        const { token, url } = await response.json()
        console.log('Room created successfully:', { token: token.substring(0, 20) + '...', url })
        
        // Create LiveKit room
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: {
            videoSimulcastLayers: [
              { resolution: { width: 320, height: 180 }, encoding: { maxBitrate: 200_000 } },
              { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 500_000 } },
              { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: 1_000_000 } },
            ],
          },
        })

        // Set up event listeners
        newRoom.on(RoomEvent.Connected, () => {
          console.log('Connected to room')
          setIsConnected(true)
          setRoom(newRoom)
          roomRef.current = newRoom
        })

        newRoom.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room')
          setIsConnected(false)
          setRoom(null)
          roomRef.current = null
        })

        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('Participant connected:', participant.identity)
          setParticipants(prev => [...prev, participant])
        })

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('Participant disconnected:', participant.identity)
          setParticipants(prev => prev.filter(p => p.identity !== participant.identity))
        })

        // Connect to room
        await newRoom.connect(url, token)
        
      } catch (error) {
        console.error('Failed to initialize room:', error)
        alert('Failed to connect to room. Please check your connection and try again.')
      }
    }

    initializeRoom()

    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
    }
  }, [roomName, participantType])

  // Handle transfer initiation
  const handleTransferCall = async () => {
    if (participantType !== 'agent_a') {
      alert('Only Agent A can initiate transfers')
      return
    }

    try {
      setTransferStatus('Initiating transfer...')
      
      // Generate call summary
      const summaryResponse = await fetch('http://localhost:8000/api/summary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: roomName,
          conversation_history: conversationHistory
        })
      })

      const summaryData = await summaryResponse.json()
      setCallSummary(summaryData)
      setShowTransferModal(true)
      setTransferStatus('Transfer initiated. Please explain the summary to Agent B.')
      
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Failed to initiate transfer')
    }
  }

  // Complete transfer (Agent A leaves)
  const handleCompleteTransfer = async () => {
    if (participantType !== 'agent_a') return

    try {
      // Leave the room
      if (roomRef.current) {
        await roomRef.current.disconnect()
      }
      
      // Notify backend
      await fetch(`http://localhost:8000/api/rooms/${roomName}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_type: participantType
        })
      })

      setTransferStatus('Transfer completed! You have left the call.')
      setShowTransferModal(false)
      
    } catch (error) {
      console.error('Failed to complete transfer:', error)
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (!roomRef.current) return
    
    if (isMuted) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(true)
    } else {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false)
    }
    setIsMuted(!isMuted)
  }

  // Toggle video
  const toggleVideo = async () => {
    if (!roomRef.current) return
    
    if (isVideoEnabled) {
      await roomRef.current.localParticipant.setCameraEnabled(false)
    } else {
      await roomRef.current.localParticipant.setCameraEnabled(true)
    }
    setIsVideoEnabled(!isVideoEnabled)
  }

  if (!isConnected || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Connecting to room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <LiveKitRoom room={room} audio={true} video={true}>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Room: {roomName}</h1>
              <p className="text-sm text-gray-300">You are: {participantType}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{participants.length + 1} participants</span>
              </div>
              {participantType === 'agent_a' && (
                <button
                  onClick={handleTransferCall}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Call
                </button>
              )}
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 relative">
            <VideoConference />
            <RoomAudioRenderer />
          </div>

          {/* Control Bar */}
          <div className="bg-gray-800 p-4">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  !isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {!isVideoEnabled ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
              </button>

              <button
                onClick={() => room.disconnect()}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Warm Transfer Initiated</h2>
              
              {callSummary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">AI-Generated Call Summary:</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-800">{callSummary.summary}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Next Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Agent B should join the room</li>
                  <li>Explain the call summary to Agent B</li>
                  <li>Once Agent B is ready, complete the transfer</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCompleteTransfer}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Complete Transfer (Leave Call)
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Status */}
        {transferStatus && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-40">
            <p>{transferStatus}</p>
          </div>
        )}
      </LiveKitRoom>
    </div>
  )
}
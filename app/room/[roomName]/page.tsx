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
          
          // Get existing participants when connected
          const existingParticipants = Array.from(newRoom.remoteParticipants.values())
          console.log('Existing participants on connect:', existingParticipants.map(p => p.identity))
          setParticipants(existingParticipants)
        })

        newRoom.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room')
          setIsConnected(false)
          setRoom(null)
          roomRef.current = null
        })

        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('Participant connected:', participant.identity)
          setParticipants(prev => {
            // Check if participant already exists to avoid duplicates
            const exists = prev.some(p => p.identity === participant.identity)
            if (!exists) {
              return [...prev, participant]
            }
            return prev
          })
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
          {/* Google Meet Style Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">{roomName}</h1>
                <p className="text-sm text-gray-500">You are: {participantType}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{participants.length + 1} people</span>
                <span className="text-xs text-gray-500">({participantType})</span>
              </div>
              {participantType === 'agent_a' && (
                <button
                  onClick={handleTransferCall}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Call
                </button>
              )}
            </div>
          </div>

          {/* Google Meet Style Video Grid */}
          <div className="flex-1 relative bg-gray-100">
            <div className="h-full flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 p-4 w-full max-w-4xl">
                {/* Current User Video */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden aspect-video relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl font-bold">{participantType.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-medium">{participantType}</p>
                    </div>
                  </div>
                  {isMuted && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                      Muted
                    </div>
                  )}
                  {!isVideoEnabled && (
                    <div className="absolute bottom-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                      Camera Off
                    </div>
                  )}
                </div>

                {/* Other Participants */}
                {participants.length > 0 ? (
                  participants.map((participant, index) => {
                    // Get participant type from identity
                    const participantType = participant.identity.split('_')[0] || 'unknown'
                    const colors = {
                      'caller': 'from-red-500 to-pink-500',
                      'agent-a': 'from-blue-500 to-indigo-500',
                      'agent-b': 'from-green-500 to-emerald-500',
                      'agent_a': 'from-blue-500 to-indigo-500',
                      'agent_b': 'from-green-500 to-emerald-500',
                      'unknown': 'from-gray-500 to-gray-600'
                    }
                    const colorClass = colors[participantType as keyof typeof colors] || colors.unknown
                    
                    return (
                      <div key={participant.identity} className="bg-white rounded-lg shadow-lg overflow-hidden aspect-video relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                          <div className="text-center text-white">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-2xl font-bold">{participantType.charAt(0).toUpperCase()}</span>
                            </div>
                            <p className="text-sm font-medium">{participant.identity}</p>
                            <p className="text-xs opacity-75">{participantType}</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                          Online
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden aspect-video relative border-2 border-dashed border-gray-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for others to join...</p>
                        <p className="text-xs mt-1">You are: {participantType}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <RoomAudioRenderer />
          </div>

          {/* Google Meet Style Control Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  !isVideoEnabled 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={() => room.disconnect()}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Google Meet Style Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Warm Transfer Initiated</h2>
                <p className="text-gray-600">AI is preparing call summary for handoff</p>
              </div>
              
              {callSummary && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">AI-Generated Call Summary:</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-sm">AI</span>
                      </div>
                      <p className="text-gray-800 leading-relaxed">{callSummary.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Next Steps:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="text-gray-700">Agent B should join the room</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="text-gray-700">Explain the call summary to Agent B</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-gray-700">Complete the transfer when ready</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCompleteTransfer}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  Complete Transfer
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
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
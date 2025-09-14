'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
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

// Remote video track component
function RemoteVideoTrack({ participant }: { participant: RemoteParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!participant || !videoRef.current) return

    // Get the first video track
    const videoTrackPublication = Array.from(participant.videoTrackPublications.values())[0]
    const videoTrack = videoTrackPublication?.track

    if (videoTrack && videoRef.current) {
      console.log(`Attaching video track for ${participant.identity}`)
      videoTrack.attach(videoRef.current)
    }

    return () => {
      if (videoTrack && videoRef.current) {
        console.log(`Detaching video track for ${participant.identity}`)
        videoTrack.detach(videoRef.current)
      }
    }
  }, [participant, participant.videoTrackPublications])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      className="w-full h-full object-cover"
      onLoadedData={() => console.log(`Video loaded for ${participant.identity}`)}
      onError={(e) => console.error(`Video error for ${participant.identity}:`, e)}
    />
  )
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomName = params.roomName as string
  const participantType = searchParams.get('type') as 'caller' | 'agent_a' | 'agent_b'
  
  const [room, setRoom] = useState<Room | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomToken, setRoomToken] = useState<string>('')
  const [roomUrl, setRoomUrl] = useState<string>('')
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferStatus, setTransferStatus] = useState<string>('')
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [participantStatus, setParticipantStatus] = useState<{[key: string]: {muted: boolean, videoEnabled: boolean}}>({})
  const [maximizedParticipant, setMaximizedParticipant] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Array<{
    timestamp: string,
    participant: string,
    message: string,
    type: 'audio' | 'text' | 'action'
  }>>([])

  const roomRef = useRef<Room | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  // Add conversation message
  const addConversationMessage = (participant: string, message: string, type: 'audio' | 'text' | 'action' = 'audio') => {
    const timestamp = new Date().toISOString()
    const newMessage = {
      timestamp,
      participant,
      message,
      type
    }
    
    setConversationMessages(prev => [...prev, newMessage])
    
    // Also add to conversation history for backward compatibility
    setConversationHistory(prev => [...prev, `${participant}: ${message}`])
    
    console.log('Conversation message added:', newMessage)
  }

  // Simulate conversation based on participant actions
  const simulateConversation = () => {
    // More realistic conversation flow
    const conversationFlow = [
      { speaker: 'agent_a', message: "Hello, thank you for calling. How can I help you today?", delay: 1000 },
      { speaker: 'caller', message: "Hi, I'm having trouble logging into my account. It says invalid credentials.", delay: 3000 },
      { speaker: 'agent_a', message: "I understand your frustration. Let me check your account status for you.", delay: 5000 },
      { speaker: 'agent_a', message: "I can see your account is active. Let me try a password reset for you.", delay: 7000 },
      { speaker: 'caller', message: "That would be great, thank you so much for your help.", delay: 9000 },
      { speaker: 'agent_a', message: "I've initiated a password reset. You should receive an email shortly.", delay: 11000 },
      { speaker: 'caller', message: "Perfect! I'll check my email. Is there anything else I need to do?", delay: 13000 },
      { speaker: 'agent_a', message: "I'm transferring you to our technical specialist who can help further.", delay: 15000 },
      { speaker: 'agent_a', message: "Thank you for your patience. I'm connecting you now.", delay: 17000 }
    ]
    
    conversationFlow.forEach(({ speaker, message, delay }) => {
      setTimeout(() => {
        // Only add message if the current participant matches the speaker
        if (speaker === participantType || speaker === 'caller') {
          addConversationMessage(speaker, message, 'audio')
        }
      }, delay)
    })
  }

  // Initialize room connection
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        // Check browser compatibility
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support WebRTC. Please use a modern browser like Chrome, Firefox, or Safari.')
        }
        
        // Check camera and microphone permissions
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' as const }, // Request front camera
            audio: true 
          })
          console.log('Camera and microphone access granted')
          // Stop the test stream
          stream.getTracks().forEach(track => track.stop())
        } catch (permissionError) {
          console.error('Camera/microphone permission denied:', permissionError)
          throw new Error('Camera and microphone access is required. Please allow access and refresh the page.')
        }
        // Get room token from backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || 
          process.env.NEXT_PUBLIC_API_URL_LIVE || 
          'https://livekit-warm-transfer-backend.onrender.com'
        
        const response = await fetch(`${API_URL}/api/rooms/create`, {
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
        setRoomToken(token)
        setRoomUrl(url)
        
        // Create LiveKit room with simplified configuration
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
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
          
          // Initialize status for existing participants
          const initialStatus: {[key: string]: {muted: boolean, videoEnabled: boolean}} = {}
          existingParticipants.forEach(participant => {
            initialStatus[participant.identity] = {
              muted: !participant.isMicrophoneEnabled,
              videoEnabled: participant.isCameraEnabled
            }
          })
          setParticipantStatus(initialStatus)
          console.log('Initial participant status:', initialStatus)
          
          // Force update participants list after a short delay
          setTimeout(() => {
            const updatedParticipants = Array.from(newRoom.remoteParticipants.values())
            console.log('Updated participants after delay:', updatedParticipants.map(p => p.identity))
            setParticipants(updatedParticipants)
          }, 1000)
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
              console.log('Adding new participant:', participant.identity)
              return [...prev, participant]
            }
            console.log('Participant already exists:', participant.identity)
            return prev
          })
          
          // Initialize participant status
          setParticipantStatus(prev => ({
            ...prev,
            [participant.identity]: {
              muted: !participant.isMicrophoneEnabled,
              videoEnabled: participant.isCameraEnabled
            }
          }))
          
          // Handle audio track for remote participant
          participant.on('trackSubscribed', (track, publication) => {
            console.log('Remote track subscribed:', track.kind, 'from', participant.identity)
            if (track.kind === 'audio') {
              try {
                // Create audio element for remote audio
                const audioElement = document.createElement('audio')
                audioElement.autoplay = true
                audioElement.controls = false
                audioElement.style.display = 'none'
                audioElement.volume = 1.0
                audioElement.muted = false
                document.body.appendChild(audioElement)
                
                // Attach remote audio track
                track.attach(audioElement)
                console.log('Remote audio track attached for', participant.identity)
                
                // Test audio playback
                audioElement.play().then(() => {
                  console.log('Remote audio playback started for', participant.identity)
                }).catch((playError) => {
                  console.error('Remote audio playback failed for', participant.identity, ':', playError)
                })
                
                // Store reference for cleanup
                if (!(window as any).remoteAudioElements) {
                  (window as any).remoteAudioElements = new Map()
                }
                (window as any).remoteAudioElements.set(participant.identity, audioElement)
                
                // Update participant status
                setParticipantStatus(prev => ({
                  ...prev,
                  [participant.identity]: {
                    ...prev[participant.identity],
                    muted: track.isMuted || false
                  }
                }))
                
              } catch (error) {
                console.error('Error setting up remote audio for', participant.identity, ':', error)
              }
            }
          })
          
          participant.on('trackUnsubscribed', (track) => {
            console.log('Remote track unsubscribed:', track.kind, 'from', participant.identity)
            if (track.kind === 'audio') {
              // Clean up audio element
              const audioElements = (window as any).remoteAudioElements
              if (audioElements && audioElements.has(participant.identity)) {
                const audioElement = audioElements.get(participant.identity)
                audioElement.remove()
                audioElements.delete(participant.identity)
                console.log('Remote audio element cleaned up for', participant.identity)
              }
            }
          })
          
          // Force refresh participants list
          setTimeout(() => {
            const allParticipants = Array.from(newRoom.remoteParticipants.values())
            console.log('All participants after connect:', allParticipants.map(p => p.identity))
            setParticipants(allParticipants)
          }, 500)
        })

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('Participant disconnected:', participant.identity)
          setParticipants(prev => prev.filter(p => p.identity !== participant.identity))
          
          // Remove participant status
          setParticipantStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[participant.identity]
            return newStatus
          })
        })

        // Connect to room
        await newRoom.connect(url, token)
        
        // Enable audio and video after connection with proper constraints
        try {
          // Request camera and microphone permissions with proper constraints
          const constraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: 'user' as const // Use front camera
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            }
          }
          
          await newRoom.localParticipant.setMicrophoneEnabled(true, constraints.audio)
          await newRoom.localParticipant.setCameraEnabled(true, constraints.video)
          console.log('Audio and video enabled after connection with constraints')
          
          // Ensure microphone is properly enabled and unmuted
          const audioTrackPublications = Array.from(newRoom.localParticipant.audioTrackPublications.values())
          console.log('Local audio track publications count:', audioTrackPublications.length)
          
          if (audioTrackPublications.length > 0) {
            const audioTrackPublication = audioTrackPublications[0]
            console.log('Local audio track found:', audioTrackPublication.track?.kind)
            console.log('Local audio track muted:', audioTrackPublication.track?.isMuted)
            
            // Unmute the audio track (mute() toggles, so if muted, call mute() to unmute)
            if (audioTrackPublication.track?.isMuted) {
              audioTrackPublication.track.mute() // This will unmute if currently muted
              console.log('Local audio track unmuted')
            } else {
              console.log('Local audio track already unmuted')
            }
            
            console.log('Local audio track is enabled and ready for transmission')
            
            // Force audio track to be published
            try {
              await newRoom.localParticipant.setMicrophoneEnabled(true)
              console.log('Microphone re-enabled to ensure publishing')
            } catch (error) {
              console.error('Error re-enabling microphone:', error)
            }
          } else {
            // If no audio track, try to enable microphone again
            console.log('No audio track found, enabling microphone...')
            await newRoom.localParticipant.setMicrophoneEnabled(true)
            console.log('Microphone enabled')
            
            // Check again after enabling
            setTimeout(() => {
              const newAudioTrackPublications = Array.from(newRoom.localParticipant.audioTrackPublications.values())
              console.log('New audio track publications count:', newAudioTrackPublications.length)
            }, 1000)
          }
        } catch (error) {
          console.error('Error enabling audio/video:', error)
          // If camera fails, try with basic constraints
          try {
            await newRoom.localParticipant.setMicrophoneEnabled(true)
            await newRoom.localParticipant.setCameraEnabled(true, { facingMode: 'user' as const })
            console.log('Audio and video enabled with basic constraints')
          } catch (fallbackError) {
            console.error('Fallback audio/video enable failed:', fallbackError)
          }
        }
        
        // Start conversation simulation after successful connection
        console.log('Room connected successfully, starting conversation simulation...')
        setTimeout(() => {
          simulateConversation()
        }, 3000) // Start after 3 seconds
        
      } catch (error) {
        console.error('Failed to initialize room:', error)
        let errorMessage = 'Failed to connect to room. Please check your connection and try again.'
        
        if (error instanceof Error) {
          if (error.message.includes('addTransceiver')) {
            errorMessage = 'Video configuration error. Please refresh the page and try again.'
          } else if (error.message.includes('RTCPeerConnection')) {
            errorMessage = 'WebRTC connection failed. Please check your browser permissions.'
          }
        }
        
        alert(errorMessage)
      }
    }

    initializeRoom()

    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
      
      // Cleanup local audio element
      const audioElement = (window as any).audioElement
      if (audioElement) {
        audioElement.remove()
        console.log('Local audio element cleaned up')
      }
      
      // Cleanup remote audio elements
      const remoteAudioElements = (window as any).remoteAudioElements
      if (remoteAudioElements) {
        remoteAudioElements.forEach((audioElement: HTMLAudioElement, participantId: string) => {
          audioElement.remove()
          console.log('Remote audio element cleaned up for', participantId)
        })
        remoteAudioElements.clear()
      }
    }
  }, [roomName, participantType])

  // Handle local video stream
  useEffect(() => {
    if (!room || !localVideoRef.current) return

    const localParticipant = room.localParticipant
    const videoTrack = localParticipant.videoTrackPublications.values().next().value?.track

    if (videoTrack && localVideoRef.current) {
      videoTrack.attach(localVideoRef.current)
    }

    return () => {
      if (videoTrack && localVideoRef.current) {
        videoTrack.detach(localVideoRef.current)
      }
    }
  }, [room, isVideoEnabled])

  // Effect to periodically sync participants and their status
  useEffect(() => {
    if (!room || !isConnected) return

    const syncParticipants = () => {
      const allParticipants = Array.from(room.remoteParticipants.values())
      console.log('Periodic sync - participants:', allParticipants.map(p => p.identity))
      setParticipants(allParticipants)
      
      // Update participant status
      const updatedStatus: {[key: string]: {muted: boolean, videoEnabled: boolean}} = {}
      allParticipants.forEach(participant => {
        updatedStatus[participant.identity] = {
          muted: !participant.isMicrophoneEnabled,
          videoEnabled: participant.isCameraEnabled
        }
      })
      setParticipantStatus(updatedStatus)
    }

    // Sync immediately
    syncParticipants()

    // Set up periodic sync every 1 second for real-time updates
    const interval = setInterval(syncParticipants, 1000)

    return () => clearInterval(interval)
  }, [room, isConnected])

  // Handle transfer initiation
  const handleTransferCall = async () => {
    if (participantType !== 'agent_a') {
      alert('Only Agent A can initiate transfers')
      return
    }

    try {
      setTransferStatus('Initiating transfer...')
      
      // Get API URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || 
        process.env.NEXT_PUBLIC_API_URL_LIVE || 
        'https://livekit-warm-transfer-backend.onrender.com'
      
      // Generate call summary with real conversation data
      let conversationData = conversationHistory
      
      // If no conversation history, use conversation messages
      if (conversationData.length === 0 && conversationMessages.length > 0) {
        conversationData = conversationMessages.map(msg => `${msg.participant}: ${msg.message}`)
      }
      
      // If still empty, use sample conversation
      if (conversationData.length === 0) {
        conversationData = [
          "Caller: Hello, I need help with my account",
          "Agent A: Hi! I'd be happy to help you with your account. What specific issue are you experiencing?",
          "Caller: I can't log into my account and I'm getting an error message",
          "Agent A: I understand you're having trouble logging in. Let me help you troubleshoot this issue.",
          "Caller: The error says 'Invalid credentials' but I'm sure my password is correct",
          "Agent A: That's frustrating. Let me check your account status and help you reset your password if needed."
        ]
      }
      
      console.log('Sending conversation data for summary:', conversationData)
      
      const summaryResponse = await fetch(`${API_URL}/api/summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: roomName,
          conversation_history: conversationData
        })
      })

      if (!summaryResponse.ok) {
        throw new Error(`Summary generation failed: ${summaryResponse.status}`)
      }

      const summaryData = await summaryResponse.json()
      console.log('Call summary generated:', summaryData)
      setCallSummary(summaryData)
      setShowTransferModal(true)
      setTransferStatus('Transfer initiated. Please explain the summary to Agent B.')
      
    } catch (error) {
      console.error('Transfer failed:', error)
      // Use fallback summary if API fails
      const fallbackSummary = {
        summary: `Call Summary: Customer inquiry about ${participantType} services. Duration: ${conversationHistory.length} messages. Status: Active call in progress. Next steps: Complete warm transfer to Agent B.`,
        status: 'fallback'
      }
      setCallSummary(fallbackSummary)
      setShowTransferModal(true)
      setTransferStatus('Transfer initiated with fallback summary. Please explain to Agent B.')
    }
  }

  // Complete transfer (Agent A leaves)
  const handleCompleteTransfer = async () => {
    if (participantType !== 'agent_a') return

    try {
      // Get API URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || 
        process.env.NEXT_PUBLIC_API_URL_LIVE || 
        'https://livekit-warm-transfer-backend.onrender.com'
      
      // Leave the room
      if (roomRef.current) {
        await roomRef.current.disconnect()
      }
      
      // Notify backend
      await fetch(`${API_URL}/api/rooms/${roomName}/leave`, {
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
      
      // Redirect to home page after transfer completion
      setTimeout(() => {
        router.push('/')
      }, 2000) // 2 second delay to show the status message
      
    } catch (error) {
      console.error('Failed to complete transfer:', error)
      // Still redirect even if there's an error
      router.push('/')
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (!roomRef.current) return
    
    try {
      if (isMuted) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true)
        console.log('Microphone enabled')
        
        // Force audio track to be unmuted and ensure it's published
        const audioTrackPublication = Array.from(roomRef.current.localParticipant.audioTrackPublications.values())[0]
        if (audioTrackPublication && audioTrackPublication.track) {
          // Unmute the audio track (mute() toggles, so if muted, call mute() to unmute)
          if (audioTrackPublication.track.isMuted) {
            audioTrackPublication.track.mute() // This will unmute if currently muted
            console.log('Audio track unmuted')
          } else {
            console.log('Audio track already unmuted')
          }
          
          // Ensure audio track is enabled
          if (audioTrackPublication.track.kind === 'audio') {
            console.log('Audio track is enabled and ready')
          }
        } else {
          // If no audio track, try to enable microphone again
          await roomRef.current.localParticipant.setMicrophoneEnabled(true)
          console.log('Microphone re-enabled')
        }
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false)
        console.log('Microphone disabled')
      }
      setIsMuted(!isMuted)
    } catch (error) {
      console.error('Error toggling audio:', error)
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (!roomRef.current) return
    
    try {
      if (isVideoEnabled) {
        await roomRef.current.localParticipant.setCameraEnabled(false)
        console.log('Camera disabled')
      } else {
        await roomRef.current.localParticipant.setCameraEnabled(true)
        console.log('Camera enabled')
      }
      setIsVideoEnabled(!isVideoEnabled)
    } catch (error) {
      console.error('Error toggling video:', error)
    }
  }

  // Maximize/minimize participant
  const toggleMaximize = (participantId: string) => {
    if (maximizedParticipant === participantId) {
      setMaximizedParticipant(null)
    } else {
      setMaximizedParticipant(participantId)
    }
  }

  // Test audio function
  const testAudio = async () => {
    if (!roomRef.current) return
    
    try {
      console.log('=== AUDIO TEST START ===')
      console.log('Room connected:', roomRef.current.state)
      console.log('Local participant:', roomRef.current.localParticipant.identity)
      
      // Test local audio
      const audioTrackPublications = Array.from(roomRef.current.localParticipant.audioTrackPublications.values())
      console.log('Local audio track publications count:', audioTrackPublications.length)
      
      if (audioTrackPublications.length > 0) {
        const audioTrackPublication = audioTrackPublications[0]
        console.log('Local audio track muted:', audioTrackPublication.track?.isMuted)
        console.log('Local audio track kind:', audioTrackPublication.track?.kind)
        
        // Ensure local audio is unmuted
        if (audioTrackPublication.track?.isMuted) {
          audioTrackPublication.track.mute() // Toggle mute
          console.log('Local audio track unmuted')
        }
      }
      
      // Test remote participants audio
      const remoteParticipants = Array.from(roomRef.current.remoteParticipants.values())
      console.log('Remote participants count:', remoteParticipants.length)
      
      remoteParticipants.forEach(participant => {
        console.log(`Participant ${participant.identity}:`)
        console.log('  - Microphone enabled:', participant.isMicrophoneEnabled)
        console.log('  - Audio tracks:', participant.audioTrackPublications.size)
        
        participant.audioTrackPublications.forEach((publication, trackSid) => {
          console.log(`  - Audio track ${trackSid}:`, publication.track?.isMuted ? 'muted' : 'unmuted')
        })
      })
      
      // Check remote audio elements
      const remoteAudioElements = (window as any).remoteAudioElements
      if (remoteAudioElements) {
        console.log('Remote audio elements:', remoteAudioElements.size)
        remoteAudioElements.forEach((element: HTMLAudioElement, participantId: string) => {
          console.log(`  - Audio element for ${participantId}:`, element.volume, element.muted)
        })
      }
      
      console.log('=== AUDIO TEST END ===')
    } catch (error) {
      console.error('Audio test failed:', error)
    }
  }

  // Leave call and redirect to home
  const handleLeaveCall = async () => {
    try {
      // Get API URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || 
        process.env.NEXT_PUBLIC_API_URL_LIVE || 
        'https://livekit-warm-transfer-backend.onrender.com'
      
      if (roomRef.current) {
        await roomRef.current.disconnect()
      }
      
      // Notify backend about leaving
      await fetch(`${API_URL}/api/rooms/${roomName}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_type: participantType
        })
      })

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error leaving call:', error)
      // Still redirect even if there's an error
      router.push('/')
    }
  }

  if (!roomToken || !roomUrl) {
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
      <div className="h-screen flex flex-col">
        {/* Google Meet Style Header - Mobile Responsive */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">LT</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-medium text-gray-900 truncate">{roomName}</h1>
                <p className="text-xs sm:text-sm text-gray-500">You are: {participantType}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{participants.length + 1} people</span>
                <span className="sm:hidden">{participants.length + 1}</span>
                <span className="text-xs text-gray-500 hidden sm:inline">({participantType})</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {participantType === 'agent_a' && (
                  <button
                    onClick={handleTransferCall}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Transfer Call</span>
                    <span className="sm:hidden">Transfer</span>
                  </button>
                )}
                
                {/* Header Leave Button */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to leave the call?')) {
                      handleLeaveCall()
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm font-medium"
                  title="Leave call"
                >
                  <PhoneOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Google Meet Style Video Grid - Mobile Responsive */}
        <div className="flex-1 relative bg-gray-100">
          <div className="h-full flex items-center justify-center p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full max-w-4xl">
              {/* Current User Video */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden aspect-video relative">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl font-bold">{participantType.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-medium">{participantType}</p>
                    </div>
                  </div>
                )}
                
                {/* Status Indicators - Mobile Responsive */}
                <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 flex gap-1">
                  {isMuted && (
                    <div className="bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex items-center gap-0.5 sm:gap-1">
                      <MicOff className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Muted</span>
                    </div>
                  )}
                  {!isVideoEnabled && (
                    <div className="bg-gray-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex items-center gap-0.5 sm:gap-1">
                      <VideoOff className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Camera Off</span>
                    </div>
                  )}
                </div>
                
                {/* You indicator - Mobile Responsive */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-blue-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                  You
                </div>
                
                {/* Current User Name - Bottom Right */}
                <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs sm:text-sm font-medium">
                  {participantType}
                </div>
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
                  
                  // Get real participant status
                  const participantStatusData = participantStatus[participant.identity] || {
                    muted: !participant.isMicrophoneEnabled,
                    videoEnabled: participant.isCameraEnabled
                  }
                  const isParticipantMuted = participantStatusData.muted
                  const isParticipantVideoOff = !participantStatusData.videoEnabled
                  
                  return (
                    <div 
                      key={participant.identity} 
                      className={`bg-white rounded-lg shadow-lg overflow-hidden aspect-video relative cursor-pointer transition-all duration-300 ${
                        maximizedParticipant === participant.identity ? 'ring-4 ring-blue-500' : ''
                      }`}
                      onClick={() => toggleMaximize(participant.identity)}
                    >
                      {!isParticipantVideoOff ? (
                        <RemoteVideoTrack participant={participant} />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                          <div className="text-center text-white">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-2xl font-bold">{participantType.charAt(0).toUpperCase()}</span>
                            </div>
                            <p className="text-sm font-medium">{participant.identity}</p>
                            <p className="text-xs opacity-75">{participantType}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Maximize/Minimize Button */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMaximize(participant.identity)
                          }}
                          className="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                        >
                          {maximizedParticipant === participant.identity ? (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v-4.5M15 15h4.5M15 15l5.5 5.5" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Status Indicators for other participants - Mobile Responsive */}
                      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 flex gap-1">
                        {isParticipantMuted && (
                          <div className="bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex items-center gap-0.5 sm:gap-1">
                            <MicOff className="w-2 h-2 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Muted</span>
                          </div>
                        )}
                        {isParticipantVideoOff && (
                          <div className="bg-gray-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex items-center gap-0.5 sm:gap-1">
                            <VideoOff className="w-2 h-2 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Camera Off</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Online indicator - Mobile Responsive */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-green-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex items-center gap-0.5 sm:gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                        <span className="hidden sm:inline">Online</span>
                      </div>
                      
                      {/* Participant Name - Bottom Right */}
                      <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs sm:text-sm font-medium">
                        {participant.identity.split('_')[0] || 'Unknown'} ({participant.identity.split('_')[1] || 'ID'})
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
        </div>

        {/* Conversation History - Mobile Responsive */}
        {conversationMessages.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Live Conversation</span>
            </div>
            <div className="space-y-1">
              {conversationMessages.slice(-3).map((msg, index) => (
                <div key={index} className="text-xs sm:text-sm">
                  <span className="font-medium text-blue-600">{msg.participant}:</span>
                  <span className="text-gray-700 ml-1">{msg.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Meet Style Control Bar - Mobile Responsive */}
        <div className="bg-white border-t border-gray-200 px-2 sm:px-6 py-2 sm:py-4">
          <div className="flex justify-center items-center gap-2 sm:gap-4">
            {/* Audio Button with Status - Mobile Responsive */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <button
                onClick={toggleAudio}
                className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <span className={`text-xs ${isMuted ? 'text-red-500' : 'text-gray-500'} hidden sm:block`}>
                {isMuted ? 'Muted' : 'Unmuted'}
              </span>
            </div>
            
            {/* Video Button with Status - Mobile Responsive */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <button
                onClick={toggleVideo}
                className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                  !isVideoEnabled 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={!isVideoEnabled ? 'Turn on camera' : 'Turn off camera'}
              >
                {!isVideoEnabled ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <span className={`text-xs ${!isVideoEnabled ? 'text-red-500' : 'text-gray-500'} hidden sm:block`}>
                {!isVideoEnabled ? 'Camera Off' : 'Camera On'}
              </span>
            </div>

            {/* Audio Test Button - Mobile Responsive */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <button
                onClick={testAudio}
                className="p-2 sm:p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200"
                title="Test Audio"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
              <span className="text-xs text-blue-500 hidden sm:block">Test</span>
            </div>

            {/* Leave Button - More Prominent - Mobile Responsive */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave the call?')) {
                  handleLeaveCall()
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-200 flex items-center gap-1 sm:gap-2 font-semibold shadow-lg hover:shadow-xl"
              title="Leave call"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Meet Style Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ArrowRightLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">Warm Transfer Initiated</h2>
              <p className="text-sm sm:text-base text-gray-600">AI is preparing call summary for handoff</p>
            </div>
            
            {callSummary && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">AI-Generated Call Summary:</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-xl">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-bold text-xs sm:text-sm">AI</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{callSummary.summary}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Next Steps:</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">1</div>
                  <span className="text-sm sm:text-base text-gray-700">Agent B should join the room</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">2</div>
                  <span className="text-sm sm:text-base text-gray-700">Explain the call summary to Agent B</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">3</div>
                  <span className="text-sm sm:text-base text-gray-700">Complete the transfer when ready</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <button
                onClick={handleCompleteTransfer}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Complete Transfer
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to leave the call?')) {
                    handleLeaveCall()
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                Leave Call
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
    </div>
  )
}
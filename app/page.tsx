'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Users, ArrowRightLeft, Brain } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [participantType, setParticipantType] = useState<'caller' | 'agent_a' | 'agent_b'>('caller')
  const [roomName, setRoomName] = useState('')

  const handleJoinRoom = () => {
    if (!roomName.trim()) {
      alert('Please enter a room name')
      return
    }
    router.push(`/room/${roomName}?type=${participantType}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            LiveKit Warm Transfer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Seamless call transfers with AI-powered context sharing
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Phone className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Calls</h3>
            <p className="text-gray-600">High-quality audio/video using WebRTC technology</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <ArrowRightLeft className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Warm Transfer</h3>
            <p className="text-gray-600">Smooth handoffs between agents with context preservation</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Brain className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Summaries</h3>
            <p className="text-gray-600">Intelligent call summaries powered by OpenAI GPT</p>
          </div>
        </div>

        {/* Join Room Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">Join a Call</h2>
          
          <div className="space-y-6">
            {/* Participant Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { type: 'caller', label: 'Caller', icon: '📞', desc: 'Customer calling in' },
                  { type: 'agent_a', label: 'Agent A', icon: '👨‍💼', desc: 'Initial agent' },
                  { type: 'agent_b', label: 'Agent B', icon: '👩‍💼', desc: 'Receiving agent' }
                ].map(({ type, label, icon, desc }) => (
                  <button
                    key={type}
                    onClick={() => setParticipantType(type as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      participantType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Room Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name (e.g., support-call-001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinRoom}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Join Room
            </button>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Demo Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Open multiple browser tabs/windows</li>
            <li>Join as "Caller" in one tab, "Agent A" in another</li>
            <li>Start a conversation in the call</li>
            <li>Agent A clicks "Transfer Call" to initiate warm transfer</li>
            <li>Join as "Agent B" in a third tab</li>
            <li>Agent A explains the AI-generated summary to Agent B</li>
            <li>Agent A leaves, completing the transfer</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
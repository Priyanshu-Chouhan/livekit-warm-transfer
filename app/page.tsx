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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl w-full">
        {/* Google Meet Style Header - Mobile Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
              <span className="text-white font-bold text-lg sm:text-2xl">LT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center">
              LiveKit Warm Transfer
            </h1>
          </div>
          <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            Seamless call transfers with AI-powered context sharing
          </p>
        </div>

        {/* Features - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <Phone className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Real-time Calls</h3>
            <p className="text-sm sm:text-base text-gray-600">High-quality audio/video using WebRTC technology</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <ArrowRightLeft className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Warm Transfer</h3>
            <p className="text-sm sm:text-base text-gray-600">Smooth handoffs between agents with context preservation</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg sm:col-span-2 lg:col-span-1">
            <Brain className="w-8 h-8 sm:w-12 sm:h-12 text-purple-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Summaries</h3>
            <p className="text-sm sm:text-base text-gray-600">Intelligent call summaries powered by OpenAI GPT</p>
          </div>
        </div>

        {/* Join Room Form - Mobile Responsive */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Join a Call</h2>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Google Meet Style Participant Selection - Mobile Responsive */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">
                Choose your role:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { type: 'caller', label: 'Caller', icon: '📞', desc: 'Customer calling in', color: 'from-red-500 to-pink-500' },
                  { type: 'agent_a', label: 'Agent A', icon: '👨‍💼', desc: 'Initial agent', color: 'from-blue-500 to-indigo-500' },
                  { type: 'agent_b', label: 'Agent B', icon: '👩‍💼', desc: 'Receiving agent', color: 'from-green-500 to-emerald-500' }
                ].map(({ type, label, icon, desc, color }) => (
                  <button
                    key={type}
                    onClick={() => setParticipantType(type as any)}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                      participantType === type
                        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${color} rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                      <span className="text-xl sm:text-2xl">{icon}</span>
                    </div>
                    <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{label}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Room Name Input - Mobile Responsive */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name (e.g., abc, support-call-001)"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom()
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Use same room name to join existing calls
              </p>
            </div>

            {/* Google Meet Style Join Button - Mobile Responsive */}
            <button
              onClick={handleJoinRoom}
              className="w-full bg-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <span className="text-sm sm:text-base">Join Meeting</span>
            </button>
          </div>
        </div>

        {/* Demo Instructions - Mobile Responsive */}
        <div className="mt-8 sm:mt-12 bg-blue-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">Demo Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-blue-800">
            <li>Enter same room name (e.g., "abc") in all tabs</li>
            <li>Join as "Caller" in one tab, "Agent A" in another</li>
            <li>You'll see each other in the same room - start talking!</li>
            <li>Agent A clicks "Transfer Call" to initiate warm transfer</li>
            <li>Join as "Agent B" in a third tab with same room name</li>
            <li>Agent A explains the AI-generated summary to Agent B</li>
            <li>Agent A leaves, completing the transfer</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Important:</strong> Use the same room name in all tabs to join the same call!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
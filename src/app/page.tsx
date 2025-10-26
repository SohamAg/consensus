'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Users, Sparkles, ArrowRight, Plus, Zap } from 'lucide-react';

export default function HomePage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [userName, setUserName] = useState('alice');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabaseClient
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    setRooms(data || []);
    setLoading(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newRoomTopic,
          creator: userName,
        }),
      });

      const room = await res.json();
      if (room.id) {
        router.push(`/room/${room.id}?as=${userName}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}?as=${userName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-7xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
                  Consensus
                </h1>
                <p className="text-lg text-slate-600 mt-2">AI-powered conversation facilitation</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Name Selection & Actions */}
            <div className="space-y-6">
              {/* Name Selection */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                  Choose Your Name
                </h2>
                <select
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 text-slate-900 font-semibold text-lg"
                >
                  <option value="alice" className="text-slate-900">👤 Alice</option>
                  <option value="bob" className="text-slate-900">👤 Bob</option>
                  <option value="carol" className="text-slate-900">👤 Carol</option>
                  <option value="dave" className="text-slate-900">👤 Dave</option>
                </select>
              </div>

              {/* Quick Test */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-xl border-2 border-emerald-500 p-6">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  🧪 Quick Test Room
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Test the Consensus AI agent with a fresh room and agent instance
                </p>
                <Button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/test/room');
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url.replace('as=alice', `as=${userName}`);
                      } else if (data.roomId) {
                        window.location.href = `/room/${data.roomId}?as=${userName}`;
                      }
                    } catch (error) {
                      console.error('Error:', error);
                    }
                  }}
                  className="w-full bg-white text-emerald-700 hover:bg-gray-50 font-bold py-3 rounded-xl shadow-lg"
                >
                  Create Test Room →
                </Button>
                <div className="mt-3 text-xs text-white/80">
                  <p>• Creates new Letta agent • AI monitoring • Multi-user support</p>
                </div>
              </div>

              {/* Create Room */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl border-2 border-indigo-500 p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-7 h-7" />
                  Create New Room
                </h2>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <input
                    type="text"
                    value={newRoomTopic}
                    onChange={(e) => setNewRoomTopic(e.target.value)}
                    placeholder="e.g., 'Product roadmap for Q2'"
                    required
                    className="w-full px-5 py-4 bg-white/90 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-white border-2 border-white/50 font-medium"
                  />
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="w-full bg-white text-indigo-700 hover:bg-gray-50 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {creating ? 'Creating...' : <>Create Room <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: Room List */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Active Rooms
                </h2>
                <p className="text-sm text-slate-500">Click any room to join as <span className="font-semibold text-indigo-600">{userName}</span></p>
              </div>
              {loading ? (
                <div className="text-center py-12 text-slate-500">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquarePlus className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">No rooms yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="border-2 border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-slate-50 to-white"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 mb-2">
                            {room.topic}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-200">
                              {room.created_by}
                            </span>
                            <span className="text-slate-400">
                              {new Date(room.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

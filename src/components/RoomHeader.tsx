'use client';

import { useEffect, useState } from 'react';

interface RoomHeaderProps {
  channel: any;
}

export function RoomHeader({ channel }: RoomHeaderProps) {
  const [roomName, setRoomName] = useState('Chat');
  
  useEffect(() => {
    // Get room name from channel data
    const name = channel?.data?.name || 
                 channel?.data?.id || 
                 channel?.data?.topic ||
                 channel?.state?.channel?.data?.name ||
                 'Chat';
    setRoomName(name);
  }, [channel]);
  
  const firstLetter = roomName.charAt(0).toUpperCase();
  
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
        {firstLetter}
      </div>
      <div className="flex-1">
        <h2 className="text-base font-semibold text-slate-900">{roomName}</h2>
      </div>
    </div>
  );
}


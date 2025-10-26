'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamChat } from 'stream-chat';
import { ChatRoom } from '@/components/ChatRoom';
import { LoadingIndicator } from 'stream-chat-react';

export default function RoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;
  const searchParams = useSearchParams();
  const userId = searchParams.get('as') || 'alice';
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    async function initChat() {
      try {
        console.log(`🚀 Initializing chat for user: ${userId} in room: ${roomId}`);
        
        // Get dev token
        const res = await fetch(`/api/stream/devToken?user_id=${userId}`);
        const { token } = await res.json();
        console.log('✓ Got dev token');

        // Initialize client with the API key from env
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
        const client = new StreamChat(apiKey);

        await client.connectUser({ id: userId }, token);
        console.log(`✓ Connected as ${userId}`);
        setChatClient(client);

        // Join the room (add user as member)
        try {
          console.log(`👋 Joining room ${roomId} as ${userId}`);
          await fetch(`/api/rooms/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          console.log('✓ Joined room');
        } catch (err) {
          console.log('⚠ User may already be a member:', err);
        }

        // Get or create channel with state
        const channel = client.channel('messaging', roomId);
        console.log('📺 Watching channel...');
        
        // Watch the channel and get state
        await channel.watch({
          state: true,
          watch: true,
          presence: true,
        });
        
        console.log('✓ Channel watched successfully');
        setChannel(channel);
      } catch (error) {
        console.error('❌ Error initializing chat:', error);
      }
    }

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  if (!chatClient || !channel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return <ChatRoom channel={channel} client={chatClient} userId={userId} roomId={roomId} />;
}


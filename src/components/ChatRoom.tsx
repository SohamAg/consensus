'use client';

import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Thread,
  Window,
  LoadingIndicator,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { ConsensusBanner } from './ConsensusBanner';
import { RoomHeader } from './RoomHeader';
import { useEffect, useRef, useState } from 'react';

interface ChatRoomProps {
  channel: any;
  client: any;
  userId: string;
  roomId: string;
}

export function ChatRoom({ channel, client, userId, roomId }: ChatRoomProps) {
  const processedMessagesRef = useRef(new Set<string>());
  const [aiMessages, setAiMessages] = useState<Array<{id: string, text: string, timestamp: string}>>([]);
  
  useEffect(() => {
    const handleMessage = async (event: any) => {
      const message = event.message;
      
      // Only trigger for THIS user's messages (user in current tab)
      if (message.user?.id !== userId) {
        return;
      }

      // Skip if from consensus or system
      if (message.user?.id === 'consensus' || message.type === 'system') {
        return;
      }

      // Dedupe: only process each message once
      const messageId = message.id;
      if (processedMessagesRef.current.has(messageId)) {
        console.log(`⏭️ Skipping duplicate message: ${messageId}`);
        return;
      }
      processedMessagesRef.current.add(messageId);
      
      console.log(`🚀 Triggering Letta for message ${messageId} from ${message.user?.id}`);

      try {
        const response = await fetch('/api/test/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: roomId,
            username: message.user?.name || message.user?.id,
            text: message.text || '',
          }),
        });
        const result = await response.json();
        console.log('✅ Letta triggered:', result.intervention ? 'INTERVENED' : 'STAYED QUIET');
        
        // If Letta intervened, fetch and display the AI response
        if (result.intervention) {
          console.log('🎯 Letta intervened! Fetching AI message...');
          // Poll for new consensus messages from DB
          const pollForAiMessage = async () => {
            console.log('📥 Fetching messages from /api/messages...');
            try {
              const msgResponse = await fetch(`/api/messages?room_id=${roomId}&username=consensus&limit=1`);
              console.log('Response status:', msgResponse.status);
              const messages = await msgResponse.json();
              console.log('Messages received:', messages);
              
              if (messages && messages.length > 0) {
                const latestMsg = messages[messages.length - 1];
                console.log('Latest AI message:', latestMsg.text);
                const msgId = `${latestMsg.id}-${Date.now()}`;
                
                console.log('Setting AI message in state:', latestMsg.text);
                setAiMessages(prev => {
                  console.log('Previous messages:', prev);
                  // Avoid duplicates
                  if (prev.some(m => m.text === latestMsg.text)) {
                    console.log('Duplicate message, skipping');
                    return prev;
                  }
                  console.log('Adding new message to state');
                  return [...prev, {
                    id: msgId,
                    text: latestMsg.text,
                    timestamp: latestMsg.timestamp
                  }];
                });
                
                console.log('✅ AI message added to state');
                
                // Auto-dismiss after 8 seconds
                setTimeout(() => {
                  setAiMessages(prev => prev.filter(m => m.id !== msgId));
                }, 8000);
              } else {
                console.log('⚠️ No messages found in response');
              }
            } catch (error) {
              console.error('Error fetching AI messages:', error);
            }
          };
          
          // Poll with delay to let the message be saved
          setTimeout(pollForAiMessage, 1500);
        }
      } catch (error) {
        console.error('Error triggering Letta:', error);
      }
    };

    channel.on('message.new', handleMessage);

    return () => {
      channel.off('message.new', handleMessage);
    };
  }, [channel, roomId, userId]);
  
  // Reset processed messages when room changes
  useEffect(() => {
    processedMessagesRef.current.clear();
  }, [roomId]);

  if (!channel || !client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  // Debug log
  console.log('Rendering ChatRoom - AI messages in state:', aiMessages.length, aiMessages);

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* AI Message Notifications */}
      <div className="absolute top-20 right-4 z-50 space-y-3 w-96">
        {aiMessages.map((msg) => {
          console.log('Rendering notification for message:', msg.text);
          return (
            <div
              key={msg.id}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow-xl border-2 border-purple-400 animate-slide-in-right"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">✨</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">Consensus AI</div>
                  <div className="text-sm leading-relaxed">{msg.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <RoomHeader channel={channel} />
            <ConsensusBanner roomId={roomId} channel={channel} />
            <div className="flex-1 overflow-hidden">
              <MessageList />
            </div>
            <div className="bg-white border-t border-slate-200 p-4">
              <MessageInput />
            </div>
            <Thread />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}

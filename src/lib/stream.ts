import { StreamChat as StreamChatClass } from 'stream-chat';

// Server client (admin)
export const serverClient = new StreamChatClass(
  process.env.STREAM_KEY || '',
  process.env.STREAM_SECRET || ''
);

// Client-side instance (browser)
export const client = new StreamChatClass(
  process.env.NEXT_PUBLIC_STREAM_API_KEY || ''
);

// Helper to get or create a channel
export async function getOrCreateChannel(roomId: string, members: string[]) {
  const ch = serverClient.channel('messaging', roomId, { members });
  await ch.watch();
  return ch;
}


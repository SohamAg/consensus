import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/stream';
import { supabaseServer } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;
  const { userId } = await request.json();

  try {
    // Add user to Stream channel
    const channel = serverClient.channel('messaging', roomId);
    await channel.addMembers([userId]);

    // Check if user is already in participants
    const supabase = supabaseServer();
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('username', userId)
      .single();

    if (!existingParticipant) {
      // Add to participants table
      await supabase.from('participants').insert({
        room_id: roomId,
        username: userId,
        joined_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * GET /api/debug/room/[roomId]
 * Debug endpoint to check room state, messages, and interventions
 */
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const supabase = supabaseServer();
    const roomId = params.roomId;

    // Get room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true });

    // Get interventions
    const { data: interventions } = await supabase
      .from('interventions')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true });

    return NextResponse.json({
      room: room || null,
      message_count: messages?.length || 0,
      messages: messages || [],
      interventions: interventions || [],
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}


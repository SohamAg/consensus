import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/get_recent_messages
 * Returns recent messages for Letta agent
 */
export async function POST(request: Request) {
  const { room_id, limit = 20 } = await request.json();

  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('messages')
      .select('username, text, timestamp')
      .eq('room_id', room_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json([]);
    }

    // Return in chronological order (oldest first)
    const reversed = (data || []).reverse();
    return NextResponse.json(reversed);
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return NextResponse.json([]);
  }
}


import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/get_room_context
 * Returns room state for Letta agent
 */
export async function POST(request: Request) {
  const { room_id } = await request.json();

  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (error) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      room_id: data.id,
      character: data.character || null,
      topic: data.topic || null,
      discussion_type: data.discussion_type || 'casual',
      temperature: data.temperature || 'neutral',
      participants: data.participants || [],
    });
  } catch (error) {
    console.error('Error getting room context:', error);
    return NextResponse.json(null);
  }
}


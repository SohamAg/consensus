import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/check_silence_duration
 * Returns how long since last message
 */
export async function POST(request: Request) {
  const { room_id } = await request.json();

  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('messages')
      .select('timestamp')
      .eq('room_id', room_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        silence_seconds: 0,
        silence_minutes: 0,
        last_message_time: null,
      });
    }

    const lastTime = new Date(data.timestamp);
    const now = new Date();
    const silenceMs = now.getTime() - lastTime.getTime();
    const silenceSeconds = Math.floor(silenceMs / 1000);
    const silenceMinutes = silenceSeconds / 60;

    return NextResponse.json({
      silence_seconds: silenceSeconds,
      silence_minutes: silenceMinutes,
      last_message_time: data.timestamp,
    });
  } catch (error) {
    console.error('Error checking silence:', error);
    return NextResponse.json({
      silence_seconds: 0,
      silence_minutes: 0,
      last_message_time: null,
    });
  }
}


import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room_id = searchParams.get('room_id');
  const username = searchParams.get('username');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }

  try {
    const supabase = supabaseServer();
    let query = supabase
      .from('messages')
      .select('*')
      .eq('room_id', room_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    // Return in chronological order (oldest first)
    const reversed = (data || []).reverse();
    return NextResponse.json(reversed);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


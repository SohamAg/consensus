import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/get_participant_stats
 * Returns participant statistics
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
      .select('username, timestamp')
      .eq('room_id', room_id);

    if (error) {
      return NextResponse.json({ participants: {}, total_messages: 0 });
    }

    // Group by username
    const stats: any = {};
    let total = 0;

    data?.forEach((msg: any) => {
      if (!stats[msg.username]) {
        stats[msg.username] = {
          message_count: 0,
          last_active: msg.timestamp,
        };
      }
      stats[msg.username].message_count++;
      total++;
      
      if (new Date(msg.timestamp) > new Date(stats[msg.username].last_active)) {
        stats[msg.username].last_active = msg.timestamp;
      }
    });

    // Convert to proper format
    const formattedStats: any = {};
    for (const [username, data] of Object.entries(stats)) {
      formattedStats[username] = data;
    }

    return NextResponse.json({
      participants: stats,
      total_messages: total,
    });
  } catch (error) {
    console.error('Error getting participant stats:', error);
    return NextResponse.json({ participants: {}, total_messages: 0 });
  }
}


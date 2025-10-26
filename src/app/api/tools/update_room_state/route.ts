import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/update_room_state
 * Letta agent updates room state (character, topic, temperature, etc.)
 */
export async function POST(request: Request) {
  try {
    const { room_id, character, topic, discussion_type, temperature } = await request.json();

    if (!room_id) {
      return NextResponse.json({ error: 'room_id required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    const updates: any = {};
    if (character) updates.character = character;
    if (topic) updates.topic = topic;
    if (discussion_type) updates.discussion_type = discussion_type;
    if (temperature) updates.temperature = temperature;

    console.log(`📝 Letta updating room ${room_id}:`, updates);

    const { data, error } = await supabase
      .from('rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Room state updated');

    return NextResponse.json({
      success: true,
      room: data,
      updates,
    });
  } catch (error) {
    console.error('❌ Error updating room state:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}


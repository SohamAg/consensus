import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/tools/log_intervention
 * Log intervention to database
 */
export async function POST(request: Request) {
  try {
    const { room_id, intervention_type, mood_used, context } = await request.json();

    if (!room_id) {
      return NextResponse.json({ error: 'room_id required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('interventions')
      .insert({
        room_id,
        intervention_type,
        mood_used,
        context,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('📝 Logged intervention:', intervention_type);

    return NextResponse.json({
      intervention_id: data.id,
      status: 'logged',
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('❌ Error logging intervention:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}


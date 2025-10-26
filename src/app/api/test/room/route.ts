import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { serverClient } from '@/lib/stream';

export async function GET() {
  try {
    const supabase = supabaseServer();
    const roomId = 'test-room';
    const members = ['alice', 'bob', 'carol', 'dave', 'consensus'];
    
    console.log('🧪 Setting up test room...');

    // Delete existing test room
    await supabase.from('rooms').delete().eq('id', roomId);
    await supabase.from('messages').delete().eq('room_id', roomId);
    await supabase.from('interventions').delete().eq('room_id', roomId);
    
    // Delete Stream channel
    try {
      const channel = serverClient.channel('messaging', roomId);
      await channel.delete();
    } catch (e) {
      console.log('Stream channel already deleted');
    }

    // 1. Create room in Supabase
    await supabase.from('rooms').insert({
      id: roomId,
      topic: '🧪 Test Room - Consensus AI',
      character: null,
      discussion_type: 'casual',
      temperature: 'neutral',
      participants: [],
    });
    console.log('✓ Room created');

    // 2. Create Stream channel
    const channel = serverClient.channel('messaging', roomId, {
      members: members,
    });
    
    await channel.create({
      data: {
        created_by_id: 'alice',
      },
    });
    console.log('✓ Stream channel created');
    
    return NextResponse.json({ 
      success: true,
      roomId,
      url: `http://localhost:3000/room/${roomId}?as=alice`,
    });
  } catch (error) {
    console.error('❌ Error creating test room:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

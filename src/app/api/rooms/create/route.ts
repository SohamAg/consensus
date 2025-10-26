import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { serverClient } from '@/lib/stream';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { topic, creator } = await request.json();

    if (!topic || !creator) {
      return NextResponse.json({ error: 'topic and creator required' }, { status: 400 });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🏠 CREATING NEW ROOM');
    console.log('='.repeat(80));
    console.log(`Topic: ${topic}`);
    console.log(`Creator: ${creator}`);
    console.log('-'.repeat(80));

    const supabase = supabaseServer();
    const roomId = uuidv4();

    // Using global Letta agent (no per-room instances)

    // 1. Create room in Supabase
    console.log('📝 Creating room in Supabase...');
    
    // First check if schema has character column
    const roomData: any = {
      id: roomId,
      topic: topic,
      discussion_type: 'casual',
      temperature: 'neutral',
      participants: [],
    };
    
    // Try to add character if column exists
    try {
      const { error } = await supabase
        .from('rooms')
        .select('character')
        .limit(1);
      if (!error) {
        roomData.character = null;
      }
    } catch (e) {
      // Character column doesn't exist yet
    }
    
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (roomError) throw roomError;
    console.log('✓ Room created');

    // 2. Setup consensus user in Stream (if not exists)
    try {
      await serverClient.upsertUser({
        id: 'consensus',
        name: 'Consensus',
        role: 'admin',
      });
      console.log('✓ Consensus user exists in Stream');
    } catch (e) {
      console.log('Consensus user already exists');
    }

    // 3. Create Stream channel
    console.log('📺 Creating Stream channel...');
    const channel = serverClient.channel('messaging', roomId, {
      members: [creator, 'consensus'],
    });
    
    await channel.create({
      data: {
        created_by_id: creator,
      },
    });
    console.log('✓ Stream channel created with consensus member');

    console.log('='.repeat(80));
    console.log('✅ Room creation complete!');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json(room);
  } catch (error) {
    console.error('❌ Create room error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

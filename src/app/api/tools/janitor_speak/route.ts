import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { serverClient } from '@/lib/stream';

/**
 * POST /api/tools/janitor_speak
 * Generate message via Janitor and post to chat
 */
export async function POST(request: Request) {
  try {
    const { room_id, mood, intent, context } = await request.json();

    if (!room_id) {
      return NextResponse.json({ error: 'room_id required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // 1. Get room character (or use default)
    let character = 'dolly_parton';
    
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('character, topic')
        .eq('id', room_id)
        .single();

      if (room?.character) {
        character = room.character;
      } else if (room) {
        // Try to set default character
        try {
          await supabase
            .from('rooms')
            .update({ character: 'dolly_parton' })
            .eq('id', room_id);
          character = 'dolly_parton';
        } catch (e) {
          console.log('Could not update character, using default');
        }
      }
    } catch (e) {
      console.log('Room not found or error, using default character');
    }

    // Build character prompt
    const systemPrompt = buildCharacterPrompt(character, mood || 'playful');
    const userPrompt = `${intent}: ${context || ''}`;

    // 2. Call Janitor API
    const janitorUrl = process.env.JANITOR_BASE_URL || 'https://janitorai.com/hackathon/completions';
    const janitorKey = process.env.JANITOR_API_KEY || 'calhacks2047';

    console.log('🎭 Calling Janitor API...');
    console.log('Character:', character);
    console.log('Mood:', mood);
    console.log('Intent:', intent);
    console.log('Context:', context);

    const janitorResponse = await fetch(janitorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${janitorKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!janitorResponse.ok) {
      throw new Error('Janitor API failed');
    }

    const janitorData = await janitorResponse.json();
    const messageText = janitorData.choices?.[0]?.message?.content?.trim() 
      || janitorData.text 
      || janitorData.completion
      || 'Let\'s keep the discussion going!';

    console.log('💬 Generated message:', messageText);

    // 3. Post to Stream Chat as "Consensus"
    const channel = serverClient.channel('messaging', room_id);
    await channel.watch();
    
    await channel.sendMessage({
      user_id: 'consensus',
      text: messageText,
    });

    console.log('✅ Posted to Stream Chat');

    // 4. Save to messages table
    await supabase.from('messages').insert({
      room_id,
      username: 'consensus',
      text: messageText,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: messageText,
      mood_used: mood,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Janitor speak error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Build character prompts based on character and mood
 */
function buildCharacterPrompt(character: string, mood: string): string {
  const prompts: any = {
    dolly_parton: {
      base: "You are Dolly Parton facilitating a discussion. Use Southern charm: 'honey', 'sugar', 'bless your heart', 'darlin''. Keep responses under 2 sentences.",
      playful: "Be warm and encouraging.",
      empathetic: "Be gentle and understanding.",
      intellectual: "Be thoughtful but still Southern.",
      enthusiastic: "Be excited and celebratory!",
      gentle: "Be warm and inviting."
    },
    jack_sparrow: {
      base: "You are Captain Jack Sparrow facilitating a discussion. Use pirate speech: 'savvy', 'mate', mention rum. Ramble a bit but be wise. Keep responses under 2 sentences.",
      playful: "Be cheeky and adventurous.",
      empathetic: "Be surprisingly wise and understanding.",
      intellectual: "Be philosophical in your pirate way.",
      enthusiastic: "Be excited about the adventure!"
    },
    gordon_ramsay: {
      base: "You are Gordon Ramsay facilitating a discussion. Use British expressions: 'bloody hell', be direct and critical but constructive. Keep responses under 2 sentences.",
      playful: "Be sarcastic but helpful.",
      empathetic: "Be tough love - harsh but caring.",
      intellectual: "Analyze like you're judging a dish.",
      enthusiastic: "Celebrate like they nailed the dish!"
    }
  };
  
  const characterData = prompts[character] || prompts.dolly_parton;
  return `${characterData.base} ${characterData[mood] || characterData.playful}`;
}


import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { serverClient } from '@/lib/stream';

/**
 * GET /api/test/janitor-direct
 * Test Janitor API directly with mock Letta inference
 */
export async function GET() {
  try {
    const supabase = supabaseServer();
    const roomId = 'test-room';
    
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING JANITOR DIRECT');
    console.log('='.repeat(80));

    // Mock Letta inference output
    const mockDecision = {
      mood: 'enthusiastic',
      intent: 'celebrate consensus',
      context: 'Three people agreed on React for the project',
    };

    console.log('Mock Letta decision:', mockDecision);

    // Get character
    let character = 'dolly_parton';
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('character')
        .eq('id', roomId)
        .single();
      
      if (room?.character) {
        character = room.character;
      }
    } catch (e) {
      console.log('Using default character');
    }

    console.log('Character:', character);

    // Build prompts
    const systemPrompt = buildCharacterPrompt(character, mockDecision.mood);
    const userPrompt = `${mockDecision.intent}. Context: ${mockDecision.context}`;

    console.log('System prompt:', systemPrompt);
    console.log('User prompt:', userPrompt);

    // Call Janitor API
    const janitorUrl = process.env.JANITOR_BASE_URL || 'https://janitorai.com/hackathon/completions';
    const janitorKey = process.env.JANITOR_API_KEY || 'calhacks2047';

    console.log('\n🎭 Calling Janitor API...');
    
    const response = await fetch(janitorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${janitorKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Janitor API error:', errorText);
      return NextResponse.json({
        success: false,
        error: errorText,
        status: response.status,
      });
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    let messageText = '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Janitor responded (JSON)');
      messageText = data.choices?.[0]?.message?.content?.trim() 
        || data.text 
        || data.completion
        || 'Let\'s keep the discussion going!';
    } else {
      // Try to parse as text/stream
      const text = await response.text();
      console.log('✅ Janitor responded (text/stream)');
      
      // Try to extract JSON from text
      try {
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          messageText = data.choices?.[0]?.message?.content?.trim() || text;
        } else {
          messageText = text;
        }
      } catch (e) {
        messageText = text;
      }
    }

    console.log('\n💬 Generated message:', messageText);

    // Post to Stream Chat
    console.log('\n📤 Posting to Stream Chat...');
    const channel = serverClient.channel('messaging', roomId);
    await channel.watch();
    
    await channel.sendMessage({
      user_id: 'consensus',
      text: messageText,
    });

    console.log('✅ Posted to Stream Chat');

    // Save to database
    await supabase.from('messages').insert({
      room_id: roomId,
      username: 'consensus',
      text: messageText,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Saved to database');

    // Log intervention
    await supabase.from('interventions').insert({
      room_id: roomId,
      intervention_type: mockDecision.intent,
      mood_used: mockDecision.mood,
      context: { context: mockDecision.context },
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Logged intervention');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      character,
      mood: mockDecision.mood,
      intent: mockDecision.intent,
      message: messageText,
      posted: true,
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    });
  }
}

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


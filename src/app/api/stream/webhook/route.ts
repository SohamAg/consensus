import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { LettaClient } from '@letta-ai/letta-client';

/**
 * Stream Chat Webhook Handler
 * GET for verification, POST for events
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint active' });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (payload.type === 'message.new') {
    const { message } = payload;
    const userId = message.user?.id;
    const username = message.user?.name || userId;
    const channelId = message.channel_id;
    const messageText = message.text || '';

    // Skip if message is from consensus agent
    if (userId === 'consensus') {
      return NextResponse.json({ ok: true });
    }

    // Skip empty messages
    if (!messageText.trim()) {
      return NextResponse.json({ ok: true });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📨 NEW MESSAGE');
    console.log('='.repeat(80));
    console.log(`Room: ${channelId}`);
    console.log(`User: ${username}`);
    console.log(`Text: "${messageText}"`);
    console.log('='.repeat(80));

    try {
      const supabase = supabaseServer();

      // 1. Save message to database
      console.log('📝 Saving to Supabase...');
      await supabase.from('messages').insert({
        room_id: channelId,
        username: username,
        text: messageText,
        timestamp: message.created_at || new Date().toISOString(),
      });
      console.log('✅ Message saved');

      // 2. Get or create room
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', channelId)
        .single();

      if (!existingRoom) {
        // Create room if it doesn't exist
        await supabase.from('rooms').insert({
          id: channelId,
          character: null,
          topic: null,
          discussion_type: 'casual',
          temperature: 'neutral',
          participants: [],
        });
        console.log('✅ Room created');
      }

      // 3. Update participants list from all messages
      const { data: allMessages } = await supabase
        .from('messages')
        .select('username')
        .eq('room_id', channelId);

      const uniqueParticipants = [...new Set(allMessages?.map((m: any) => m.username) || [])];

      await supabase
        .from('rooms')
        .update({
          participants: uniqueParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq('id', channelId);
      
      console.log('✅ Participants updated:', uniqueParticipants);

      // 4. Trigger Letta agent
      console.log('🤖 Triggering Letta agent...');
      
      const lettaClient = new LettaClient({
        token: process.env.LETTA_API_KEY!,
      });

      const agentId = process.env.LETTA_AGENT_ID;
      
      if (!agentId) {
        console.log('⚠️ No LETTA_AGENT_ID set');
        return NextResponse.json({ ok: true });
      }

      // Send message to Letta agent
      const triggerMessage = `[ROOM: ${channelId}] New message from ${username}: "${messageText}"`;
      
      console.log('Triggering Letta agent...');
      const lettaResponse = await lettaClient.agents.messages.create(agentId, {
        messages: [
          { role: 'user', content: triggerMessage }
        ],
      });

      console.log('✅ Letta agent responded');
      console.log('Response messages:', lettaResponse.messages?.length || 0);
      
      // Check if Letta wants to intervene
      if (lettaResponse.messages && lettaResponse.messages.length > 0) {
        const lastMessage = lettaResponse.messages[lettaResponse.messages.length - 1];
        
        if (lastMessage.messageType === 'assistant_message' && 'content' in lastMessage) {
          const content = (lastMessage as any).content;
          console.log('Letta decision:', content);
          
          // Try to parse JSON decision
          try {
            // Handle both string JSON and object
            const decision = typeof content === 'string' ? JSON.parse(content) : content;
            
            console.log('Parsed decision:', JSON.stringify(decision, null, 2));
            
            // Check if Letta wants to use janitor_speak
            if (decision.action === 'janitor_speak' || decision.action === 'intervene') {
              console.log('🎯 Letta decided to intervene!');
              console.log('Mood:', decision.mood);
              console.log('Intent:', decision.intent);
              console.log('Context:', decision.context);
              
              // Call janitor_speak internally
              await callJanitorSpeak({
                room_id: decision.room_id || channelId,
                mood: decision.mood,
                intent: decision.intent,
                context: typeof decision.context === 'string' ? decision.context : JSON.stringify(decision.context || {}),
              });
            } else {
              console.log('Letta decided to STAY QUIET');
            }
          } catch (e) {
            console.log('Could not parse Letta decision:', e);
          }
        }
      }

      console.log('='.repeat(80) + '\n');
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('❌ Webhook error:', error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Call Janitor API and post message to chat
 */
async function callJanitorSpeak(params: { room_id: string; mood: string; intent: string; context: string }) {
  const { room_id, mood, intent, context } = params;
  
  try {
    const supabase = supabaseServer();
    
    // Get character (or use default)
    let character = 'dolly_parton';
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('character')
        .eq('id', room_id)
        .single();
      
      if (room?.character) {
        character = room.character;
      }
    } catch (e) {
      console.log('Using default character');
    }

    // Build prompts
    const systemPrompt = buildCharacterPrompt(character, mood);
    const userPrompt = `${intent}. Context: ${context}`;

    // Call Janitor API
    const janitorUrl = process.env.JANITOR_BASE_URL || 'https://janitorai.com/hackathon/completions';
    const janitorKey = process.env.JANITOR_API_KEY || 'calhacks2047';

    console.log('🎭 Calling Janitor API...');
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

    if (!response.ok) {
      throw new Error('Janitor API failed');
    }

    const data = await response.json();
    const messageText = data.choices?.[0]?.message?.content?.trim() 
      || data.text 
      || data.completion
      || 'Let\'s keep the discussion going!';

    console.log('💬 Generated message:', messageText);

    // Post to Stream Chat
    const { serverClient } = await import('@/lib/stream');
    const channel = serverClient.channel('messaging', room_id);
    await channel.watch();
    
    await channel.sendMessage({
      user_id: 'consensus',
      text: messageText,
    });

    console.log('✅ Posted to Stream Chat');

    // Save to database
    await supabase.from('messages').insert({
      room_id,
      username: 'consensus',
      text: messageText,
      timestamp: new Date().toISOString(),
    });

    // Log intervention
    await supabase.from('interventions').insert({
      room_id,
      intervention_type: intent || 'general',
      mood_used: mood,
      context: { intent, context },
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Saved to database');
  } catch (error) {
    console.error('❌ Janitor speak error:', error);
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

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { LettaClient } from '@letta-ai/letta-client';
import { serverClient } from '@/lib/stream';

/**
 * POST /api/test/send-message
 * Simulate a message from a user and trigger Letta flow
 */
export async function POST(request: Request) {
  try {
    const { room_id, username, text } = await request.json();

    if (!room_id || !username || !text) {
      return NextResponse.json(
        { error: 'room_id, username, and text required' },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(80));
    console.log('📨 SENDING MESSAGE TO LETTA');
    console.log('='.repeat(80));
    console.log(`Room: ${room_id}`);
    console.log(`User: ${username}`);
    console.log(`Text: "${text}"`);
    console.log('='.repeat(80));

    const supabase = supabaseServer();

    // 1. Save message to database
    console.log('📝 Saving to database...');
    await supabase.from('messages').insert({
      room_id,
      username,
      text,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Message saved');

    // 2. Ensure room exists
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (!existingRoom) {
      await supabase.from('rooms').insert({
        id: room_id,
        topic: null,
        discussion_type: 'casual',
        temperature: 'neutral',
        participants: [],
      });
      console.log('✅ Room created');
    }

    // 3. Update participants
    const { data: allMessages } = await supabase
      .from('messages')
      .select('username')
      .eq('room_id', room_id);

    const uniqueParticipants = [...new Set(allMessages?.map((m: any) => m.username) || [])];

    await supabase
      .from('rooms')
      .update({
        participants: uniqueParticipants,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room_id);
    
    console.log('✅ Participants updated:', uniqueParticipants);

    // 4. Trigger Letta agent
    console.log('🤖 Triggering Letta agent...');
    
    const agentId = process.env.LETTA_AGENT_ID;
    const lettaApiKey = process.env.LETTA_API_KEY;
    
    if (!agentId || !lettaApiKey) {
      console.error('Missing Letta credentials:', {
        agentId: !!agentId,
        apiKey: !!lettaApiKey,
      });
      return NextResponse.json({ 
        error: 'LETTA_AGENT_ID or LETTA_API_KEY not set',
        intervention: false 
      });
    }

    const lettaClient = new LettaClient({
      token: lettaApiKey,
    });

    const triggerMessage = `[ROOM: ${room_id}] New message from ${username}: "${text}"`;
    
    let lettaResponse;
    try {
      console.log('Calling Letta API with agent:', agentId);
      lettaResponse = await lettaClient.agents.messages.create(agentId, {
        messages: [{ role: 'user', content: triggerMessage }],
      });
    } catch (error: any) {
      console.error('❌ Letta API call failed:', error.message);
      return NextResponse.json({
        success: false,
        error: 'Letta API failed: ' + error.message,
        intervention: false
      });
    }

    console.log('✅ Letta responded with', lettaResponse.messages?.length || 0, 'messages');

    // 5. Parse Letta response and handle intervention
    let interventionHappened = false;
    
    if (lettaResponse.messages && lettaResponse.messages.length > 0) {
      const lastMessage = lettaResponse.messages[lettaResponse.messages.length - 1];
      
      if (lastMessage.messageType === 'assistant_message' && 'content' in lastMessage) {
        const content = (lastMessage as any).content;
        console.log('\n📋 Letta response:', content);
        
        try {
          const decision = typeof content === 'string' ? JSON.parse(content) : content;
          console.log('Parsed decision:', JSON.stringify(decision, null, 2));
          
          if (decision.action === 'janitor_speak' || decision.action === 'intervene') {
            console.log('🎯 Letta decided to INTERVENE!');
            
            // Call janitor and post message
            interventionHappened = true;
            
            // Get character
            let character = 'dolly_parton';
            try {
              const { data: room } = await supabase
                .from('rooms')
                .select('character')
                .eq('id', room_id)
                .single();
              if (room?.character) character = room.character;
            } catch (e) {}
            
            // Build prompts
            const systemPrompt = buildCharacterPrompt(character, decision.mood);
            const userPrompt = `${decision.intent}. Context: ${decision.context}`;

            // Call Janitor
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

            const contentType = response.headers.get('content-type') || '';
            let messageText = '';

            if (contentType.includes('application/json')) {
              const data = await response.json();
              messageText = data.choices?.[0]?.message?.content?.trim() || 'Let\'s continue!';
            } else {
              const text = await response.text();
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

            console.log('💬 Generated:', messageText);

            // Ensure consensus user exists in Stream
            try {
              await serverClient.upsertUser({
                id: 'consensus',
                name: 'Consensus',
                role: 'admin',
                image: '',
              });
              console.log('✅ Consensus user created/updated');
            } catch (e) {
              console.log('Consensus user already exists');
            }

            // Post to Stream Chat as consensus user
            console.log('📤 Posting message to Stream Chat...');
            
            const { StreamChat } = await import('stream-chat');
            const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
            const streamSecret = process.env.STREAM_API_SECRET || '';
            
            // Create a fresh client each time to avoid state issues
            const consensusClient = new StreamChat(streamApiKey, streamSecret);
            
            try {
              await consensusClient.connectUser({
                id: 'consensus',
                name: 'Consensus',
                image: '',
              }, consensusClient.createToken('consensus'));
              
              console.log('✅ Connected as consensus user');
              
              const consensusChannel = consensusClient.channel('messaging', room_id, {
                members: ['consensus'],
              });
              
              // Ensure channel exists and is watched
              await consensusChannel.watch();
              console.log('✅ Channel watched');
              
              // Send message with explicit user info
              const msg = await consensusChannel.sendMessage({
                text: messageText,
                user: {
                  id: 'consensus',
                  name: 'Consensus',
                },
              });
              
              console.log('✅ Posted message to Stream Chat:', JSON.stringify(msg, null, 2));
              
              // Query channel to verify message
              await new Promise(resolve => setTimeout(resolve, 500));
              const state = await consensusChannel.query({ messages: { limit: 5 } });
              console.log('✅ Channel state after message:', state.messages?.length || 0, 'messages');
              
            } finally {
              await consensusClient.disconnect();
              console.log('✅ Disconnected');
            }

            // Save to DB
            await supabase.from('messages').insert({
              room_id,
              username: 'consensus',
              text: messageText,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.log('✅ Letta decided to STAY QUIET');
          }
        } catch (e) {
          console.log('Letta response:', content);
        }
      }
    }

    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      intervention: interventionHappened,
      letta_response: lettaResponse.messages,
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
      base: "You are Dolly Parton facilitating a discussion. Use Southern charm: 'honey', 'sugar', 'bless your heart'. Keep responses under 2 sentences.",
      playful: "Be warm and encouraging.",
      empathetic: "Be gentle and understanding.",
      enthusiastic: "Be excited and celebratory!",
    },
    jack_sparrow: {
      base: "You are Captain Jack Sparrow facilitating a discussion. Use pirate speech: 'savvy', 'mate', mention rum. Keep responses under 2 sentences.",
      playful: "Be cheeky and adventurous.",
      empathetic: "Be surprisingly wise and understanding.",
      enthusiastic: "Be excited about the adventure!"
    }
  };
  
  const characterData = prompts[character] || prompts.dolly_parton;
  return `${characterData.base} ${characterData[mood] || characterData.playful}`;
}


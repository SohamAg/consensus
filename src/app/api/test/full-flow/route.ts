import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { LettaClient } from '@letta-ai/letta-client';

/**
 * GET /api/test/full-flow
 * Test the complete flow: message -> Letta -> Janitor -> post
 */
export async function GET() {
  try {
    const supabase = supabaseServer();
    const agentId = process.env.LETTA_AGENT_ID;
    
    if (!agentId) {
      return NextResponse.json({ error: 'LETTA_AGENT_ID not set' }, { status: 500 });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING FULL FLOW');
    console.log('='.repeat(80));

    const roomId = 'test-room';
    const username = 'alice';
    const messageText = 'Hey everyone! Anyone want to plan a trip to Japan?';

    // 1. Save message to DB
    console.log('📝 Saving message to database...');
    await supabase.from('messages').insert({
      room_id: roomId,
      username: username,
      text: messageText,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Message saved');

    // 2. Create room if it doesn't exist
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!existingRoom) {
      await supabase.from('rooms').insert({
        id: roomId,
        topic: 'Test room',
        discussion_type: 'casual',
        temperature: 'neutral',
        participants: [],
      });
      console.log('✅ Room created');
    }

    // 3. Trigger Letta agent
    console.log('🤖 Triggering Letta agent...');
    const lettaClient = new LettaClient({
      token: process.env.LETTA_API_KEY!,
    });

    const triggerMessage = `[ROOM: ${roomId}] New message from ${username}: "${messageText}"`;
    
    const response = await lettaClient.agents.messages.create(agentId, {
      messages: [{ role: 'user', content: triggerMessage }],
    });

    console.log('✅ Letta responded with', response.messages?.length || 0, 'messages');

    // 4. Parse Letta response
    if (response.messages && response.messages.length > 0) {
      const lastMessage = response.messages[response.messages.length - 1];
      
      if (lastMessage.messageType === 'assistant_message' && 'content' in lastMessage) {
        const content = (lastMessage as any).content;
        console.log('📋 Letta content:', content);
        
        try {
          const decision = typeof content === 'string' ? JSON.parse(content) : content;
          
          if (decision.action === 'janitor_speak' || decision.action === 'intervene') {
            console.log('🎯 Letta wants to intervene!');
            console.log('Decision:', JSON.stringify(decision, null, 2));
            
            return NextResponse.json({
              success: true,
              letta_decision: decision,
              message: 'Letta decided to intervene. Check the webhook implementation to handle janitor_speak.',
            });
          } else {
            console.log('✅ Letta decided to STAY QUIET');
            return NextResponse.json({
              success: true,
              letta_response: content,
              message: 'Letta monitoring (no intervention needed)',
            });
          }
        } catch (e) {
          console.log('Response content:', content);
          return NextResponse.json({
            success: true,
            letta_response: content,
            note: 'Could not parse as JSON',
          });
        }
      }
    }

    console.log('='.repeat(80) + '\n');
    
    return NextResponse.json({
      success: true,
      message: 'Test complete. Check terminal for logs.',
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    });
  }
}


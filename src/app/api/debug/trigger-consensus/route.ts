import { NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

/**
 * POST /api/debug/trigger-consensus
 * Manually trigger the Letta agent for testing
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
    console.log('🧪 MANUAL TRIGGER - Consensus AI');
    console.log('='.repeat(80));
    console.log(`Room: ${room_id}`);
    console.log(`User: ${username}`);
    console.log(`Text: "${text}"`);
    console.log('='.repeat(80));

    const agentId = process.env.LETTA_AGENT_ID;

    if (!agentId) {
      return NextResponse.json(
        { error: 'LETTA_AGENT_ID not set' },
        { status: 500 }
      );
    }

    const lettaClient = new LettaClient({
      token: process.env.LETTA_API_KEY!,
    });

    const triggerMessage = `[ROOM: ${room_id}] New message from ${username}: "${text}"`;

    console.log('🤖 Triggering Letta agent...');
    console.log(`Agent ID: ${agentId}`);
    console.log(`Message: ${triggerMessage}`);

    await lettaClient.agents.messages.create(agentId, {
      messages: [{ role: 'user', content: triggerMessage }],
    });

    console.log('✅ Letta agent triggered');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      status: 'triggered',
      room_id,
      username,
      text,
      agent_id: agentId,
    });
  } catch (error) {
    console.error('❌ Trigger error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}


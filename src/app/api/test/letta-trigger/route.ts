import { NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

/**
 * Test endpoint to manually trigger Letta agent
 * GET /api/test/letta-trigger
 */
export async function GET() {
  try {
    const agentId = process.env.LETTA_AGENT_ID;
    
    if (!agentId) {
      return NextResponse.json({ 
        error: 'LETTA_AGENT_ID not set in .env.local',
        message: 'Please set LETTA_AGENT_ID'
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING LETTA CONNECTION');
    console.log('='.repeat(80));

    const lettaClient = new LettaClient({
      token: process.env.LETTA_API_KEY!,
    });

    const testMessage = `[ROOM: test-room] New message from alice: "Hello! Testing the integration!"`;

    console.log('Agent ID:', agentId);
    console.log('Sending message to agent...');
    console.log('Message:', testMessage);

    const response = await lettaClient.agents.messages.create(agentId, {
      messages: [{ role: 'user', content: testMessage }],
    });

    console.log('✅ Letta agent responded!');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      agentId,
      message: 'Letta agent is working!',
      response: response,
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      message: 'Check your LETTA_API_KEY and LETTA_AGENT_ID in .env.local'
    });
  }
}


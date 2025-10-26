import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/stream';

/**
 * Setup "consensus" user in Stream
 */
export async function GET() {
  try {
    // Create consensus user
    await serverClient.upsertUser({
      id: 'consensus',
      name: 'Consensus',
      role: 'admin',
    });

    console.log('✅ Consensus user created in Stream');

    return NextResponse.json({
      success: true,
      message: 'Consensus user created',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    });
  }
}


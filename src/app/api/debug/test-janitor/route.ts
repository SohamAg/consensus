import { NextResponse } from 'next/server';

/**
 * GET /api/debug/test-janitor
 * Test Janitor API connection
 */
export async function GET() {
  try {
    const janitorUrl = process.env.JANITOR_BASE_URL || 'https://janitorai.com/hackathon/completions';
    const janitorKey = process.env.JANITOR_API_KEY || 'calhacks2047';

    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING JANITOR API');
    console.log('='.repeat(80));
    console.log('URL:', janitorUrl);
    console.log('API Key:', janitorKey.substring(0, 10) + '...');
    console.log('-'.repeat(80));

    const testPrompt = {
      system: "You are Dolly Parton. Be warm and encouraging with Southern charm.",
      user: "Celebrate consensus: everyone agreed on React!"
    };

    console.log('Sending test request...');
    
    const response = await fetch(janitorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${janitorKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: testPrompt.system },
          { role: 'user', content: testPrompt.user }
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
        status: response.status,
        error: errorText,
      });
    }

    const data = await response.json();
    console.log('✅ Janitor API responded!');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('='.repeat(80) + '\n');

    const messageText = data.choices?.[0]?.message?.content 
      || data.text 
      || data.completion;

    return NextResponse.json({
      success: true,
      status: response.status,
      message: messageText,
      full_response: data,
    });
  } catch (error: any) {
    console.error('❌ Janitor test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    });
  }
}


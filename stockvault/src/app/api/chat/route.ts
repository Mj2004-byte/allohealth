import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `You are StockVault AI, a knowledgeable and friendly assistant for an inventory reservation platform. 
You help users with:
- Understanding product availability and stock levels across warehouses
- How reservations work (10-minute hold, confirm or cancel)
- Warehouse locations in Mumbai, Delhi, and Bangalore
- Product details and pricing
- Troubleshooting reservation issues

Keep responses concise, warm, and helpful. Use simple language. For real-time stock data, tell users to check the live product page. Never make up stock numbers. If asked about payment, mention this is a demo system.`,
          },
          ...messages,
        ],
        max_tokens: 512,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass through the SSE stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

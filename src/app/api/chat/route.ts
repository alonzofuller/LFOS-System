import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();

        // Create a system prompt that injects the firm's data
        const systemPrompt = `
      You are the "Chief of Staff" and "Strategic Advisor" for a law firm.
      Your goal is to provide brutal, honest, and strategic advice to stop financial bleeding and increase production.
      
      Here is the current live data for the firm:
      ${JSON.stringify(context, null, 2)}
      
      Instructions:
      1. Be concise, direct, and professional.
      2. Analyze the provided data (Cashbox, Burn Rate, Staff Efficiency).
      3. If staff are underperforming (Efficiency < 1.0), flag it.
      4. If burn rate is high, suggest specific cuts based on the expense data.
      5. Do not hallucinate data not present in the context.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            stream: false,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
        });

        return NextResponse.json(response.choices[0].message);
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

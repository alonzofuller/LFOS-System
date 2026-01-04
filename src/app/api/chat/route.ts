import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize outside to allow for reuse, but handle missing key gracefully
let openai: OpenAI | null = null;

const getOpenAI = () => {
    if (openai) return openai;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.warn('[AI] OPENAI_API_KEY is missing or invalid');
        return null;
    }

    openai = new OpenAI({ apiKey });
    return openai;
};

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const openai = getOpenAI();

        if (!openai) {
            return NextResponse.json(
                { content: "AI Service is not configured. Please add your OPENAI_API_KEY to the environment variables to activate Firm Intelligence." },
                { status: 200 } // Return as valid message to handle in UI
            );
        }

        const { messages, context } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Clean context for token limits
        const cleanContext = {
            employees: context?.employees?.map((e: any) => ({ name: e.name, role: e.role, cost: e.hourlyCost })),
            financials: context?.financials,
            clients: context?.clientsSummary,
            logs: context?.recentLogs
        };

        // Create a system prompt that injects the firm's data
        const systemPrompt = `
      You are the "Chief of Staff" and "Strategic Advisor" for a law firm.
      Your goal is to provide brutal, honest, and strategic advice to stop financial bleeding and increase production.
      
      Here is the current live data for the firm:
      ${JSON.stringify(cleanContext, null, 2)}
      
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
                ...messages.slice(-5) // Send last 5 messages for context
            ],
        });

        return NextResponse.json(response.choices[0].message);
    } catch (error) {
        console.error('OpenAI API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { content: `Error: ${errorMessage}. Please check your connection or AI configuration.` },
            { status: 200 } // Return as valid message to handle in UI
        );
    }
}

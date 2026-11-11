import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-static';


let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const envPath = path.resolve(process.cwd(), '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
  } catch {
    console.error("Could not load root .env file");
  }
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function POST(req: Request) {
  try {
    const { ideaId, prompt, ideaContext } = await req.json();

    if (!ideaId || !prompt) {
      return NextResponse.json({ error: "Missing ideaId or prompt" }, { status: 400 });
    }

    // 1. Fetch context if not passed in body
    let coreProblem = ideaContext?.coreProblem;
    let targetAudience = ideaContext?.targetAudience;
    let finalVerdict = ideaContext?.finalVerdict;
    let competitorsFound = ideaContext?.competitorsFound;

    if (!coreProblem) {
      const ideaResult = await db.execute({
        sql: `
          SELECT 
            vp.core_problem, vp.target_audience, 
            mv.final_verdict, mv.competitors_found 
          FROM marketvalidation mv
          JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
          WHERE mv.id = ?
        `,
        args: [ideaId]
      });

      if (ideaResult.rows.length > 0) {
        const row = ideaResult.rows[0];
        coreProblem = String(row.core_problem);
        targetAudience = String(row.target_audience);
        finalVerdict = String(row.final_verdict);
        competitorsFound = String(row.competitors_found);
      }
    }

    // 2. Fetch prior chat history
    const historyResult = await db.execute({
      sql: `SELECT role, content FROM brainstormmessage WHERE market_validation_id = ? ORDER BY created_at ASC`,
      args: [ideaId]
    });
    
    const history = historyResult.rows.map(r => {
      let content = String(r.content);
      if (r.role === 'model' && (content.includes("NO, I DO NOT") || content.includes("A problem area is a concept") || content.includes("Too vague"))) {
        content = `I am fully aligned on the core problem statement: "${coreProblem}". Let's focus on execution strategy.`;
      }
      return {
        role: String(r.role),
        parts: [{ text: content }]
      };
    });

    // 3. Set up Strict Anti-Reset System Instruction
    const systemInstruction = `
      KNOWLEDGE & SYSTEM CONTEXT:
      You are an AI Startup Co-Founder & Senior VC Advisor.
      You ALREADY KNOW the exact problem, target audience, and initial verdict for this Incubator idea:

      - CORE PROBLEM STATEMENT: "${coreProblem}"
      - TARGET AUDIENCE: "${targetAudience}"
      - INITIAL AI VERDICT: "${finalVerdict}"
      - COMPETITORS RECORDED: "${competitorsFound || 'None recorded'}"

      STRICT BEHAVIORAL MANDATES:
      1. You ALREADY KNOW the Core Problem statement ("${coreProblem}").
      2. NEVER state "NO, I DO NOT" or pretend you don't know the problem.
      3. If the user asks "do you know the problem?", "is this a good idea?", or "is this area risky?", explicitly confirm that you know the Core Problem ("${coreProblem}") and provide sharp, strategic insights about solving it.
      4. Be constructive, data-driven, structured, and action-oriented. Never break persona into generic robotic resets.
      5. You have access to Google Search tool. If asked for live market data or competitors, search the web dynamically.
    `;

    // 4. Generate Content via Gemini (Compatible with Free & Paid Tiers)
    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history,
    });

    const response = await chat.sendMessage({ message: prompt });
    const aiText = response.text || "";

    // 5. Save the interaction to the database
    await db.execute({
      sql: `INSERT INTO brainstormmessage (market_validation_id, role, content, created_at) VALUES (?, 'user', ?, CURRENT_TIMESTAMP)`,
      args: [ideaId, prompt]
    });

    await db.execute({
      sql: `INSERT INTO brainstormmessage (market_validation_id, role, content, created_at) VALUES (?, 'model', ?, CURRENT_TIMESTAMP)`,
      args: [ideaId, aiText]
    });

    return NextResponse.json({ success: true, text: aiText });
  } catch (error) {
    console.error("Brainstorm API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brainstorm failed" }, { status: 500 });
  }
}

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
    const { ideaId, coreProblem, targetAudience, finalVerdict } = await req.json();

    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    let problem = coreProblem;
    let audience = targetAudience;

    if (!problem || !audience) {
      const ideaResult = await db.execute({
        sql: `
          SELECT vp.core_problem, vp.target_audience
          FROM marketvalidation mv
          JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
          WHERE mv.id = ?
        `,
        args: [ideaId]
      });

      if (ideaResult.rows.length > 0) {
        problem = String(ideaResult.rows[0].core_problem);
        audience = String(ideaResult.rows[0].target_audience);
      }
    }

    const promptText = `
      You are a master Startup Architect & Product Strategist.
      Use Google Search to research live market data, real competitors, real pricing models, and active user acquisition channels for the following validated startup problem:

      Core Problem: "${problem}"
      Target Audience: "${audience}"
      Analysis Verdict: "${finalVerdict || ''}"

      RESEARCH & WEB GROUNDING TASK:
      1. Research active competitors and real-world pricing benchmarks for this problem.
      2. Identify zero-cost user acquisition channels where ${audience} actively congregates online.
      3. Construct a sequential Execution Blueprint with MINIMUM 5 steps (up to 7 steps if necessary for execution depth).

      STRICT JSON OUTPUT FORMAT:
      Return ONLY a JSON array containing between 5 to 7 sequential step objects:
      [
        { "id": "1", "step": 1, "icon": "🎯", "title": "Core Problem", "badge": "STEP 01", "description": "1 crisp sentence detailing the exact high-impact problem to solve." },
        { "id": "2", "step": 2, "icon": "👥", "title": "Target Persona", "badge": "STEP 02", "description": "Specific ideal customer profile and early adopter description." },
        { "id": "3", "step": 3, "icon": "🚀", "title": "Wedge MVP", "badge": "STEP 03", "description": "The single core feature to build first to test demand in 14 days." },
        { "id": "4", "step": 4, "icon": "🧲", "title": "First 100 Users", "badge": "STEP 04", "description": "Specific zero-cost acquisition channel based on live web research." },
        { "id": "5", "step": 5, "icon": "💰", "title": "Monetization", "badge": "STEP 05", "description": "Grounded pricing model, price tag, and initial revenue target." }
      ]

      IMPORTANT: Return ONLY valid JSON array. Do NOT wrap in markdown or backticks.
    `;

    // Generate web-grounded content using Gemini 3.8 Flash with Google Search
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const nodes = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, nodes });
  } catch (error) {
    console.error("Blueprint API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate blueprint" }, { status: 500 });
  }
}

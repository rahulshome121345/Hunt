import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';


export async function POST(req: Request) {
  let keyword = "";
  let market = "all";
  let limit = 30;

  try {
    const body = await req.json();
    if (body && typeof body.keyword === 'string') {
      keyword = body.keyword.trim();
    }
    if (body && typeof body.market === 'string') {
      market = body.market.toLowerCase();
    }
    if (body && typeof body.limit === 'number') {
      limit = Math.max(20, Math.min(50, body.limit));
    }
  } catch {
    // Optional body
  }

  const projectRoot = path.join(process.cwd(), '..');
  const statusFile = path.join(projectRoot, '.engine_status.json');

  try {
    await fs.writeFile(
      statusFile,
      JSON.stringify({ status: 'running', error: null, keyword, market, limit }),
      'utf8'
    );
    
    const keywordArg = keyword ? `--keyword "${keyword.replace(/"/g, '\\"')}"` : "";
    const marketArg = `--market ${market}`;
    const limitArg = `--limit ${limit}`;
    const command = `cd "${projectRoot}" && python run_engine.py ${keywordArg} ${marketArg} ${limitArg}`;
    
    exec(command, (err) => {
      if (err) {
        const errorMessage = err.message;
        console.error("Background Engine Failed:", errorMessage);
        fs.writeFile(
          statusFile,
          JSON.stringify({ status: 'error', error: errorMessage, keyword, market, limit }),
          'utf8'
        ).catch((e: unknown) => console.error(e));
      } else {
        console.log("Background Engine Completed Successfully.");
        fs.writeFile(
          statusFile,
          JSON.stringify({ status: 'success', error: null, keyword, market, limit }),
          'utf8'
        ).catch((e: unknown) => console.error(e));
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Local engine started in background",
      keyword,
      market,
      limit,
    });
  } catch (err: unknown) {
    const errMsg = (err as Error)?.message || "Engine failed to start locally";
    console.error("Engine failed to start locally:", errMsg);
    return NextResponse.json({ success: false, error: "Failed to spawn background engine" }, { status: 500 });
  }
}

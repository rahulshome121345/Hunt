import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-static';


export async function POST(req: Request) {
  try {
    const { id, isSaved } = await req.json();
    
    if (typeof id !== 'number' || typeof isSaved !== 'boolean') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await db.execute({
      sql: `UPDATE marketvalidation SET is_saved = ? WHERE id = ?`,
      args: [isSaved ? 1 : 0, id]
    });

    return NextResponse.json({ success: true, is_saved: isSaved });
  } catch (error) {
    console.error("Failed to update idea state:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

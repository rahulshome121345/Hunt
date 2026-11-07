import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-static';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    const numericId = Number(id);

    if (!isNaN(numericId) && numericId > 0) {
      // Hard delete: remove the marketvalidation row (and cascade removes will clean up)
      // First delete any brainstorm messages linked to this validation
      try {
        await db.execute({
          sql: `DELETE FROM brainstormmessage WHERE market_validation_id = ?`,
          args: [numericId],
        });
      } catch {
        // brainstormmessage table might not exist — ignore
      }

      // Now hard delete the marketvalidation row itself
      await db.execute({
        sql: `DELETE FROM marketvalidation WHERE id = ?`,
        args: [numericId],
      });

      // Also delete the orphaned ValidatedPainPoint row if it's not referenced elsewhere
      try {
        await db.execute({
          sql: `DELETE FROM validatedpainpoint WHERE id = (
            SELECT validated_pain_point_id FROM marketvalidation WHERE id = ?
          )`,
          args: [numericId],
        });
      } catch {
        // already deleted or constraint — ignore
      }
    }

    return NextResponse.json({ success: true, id: numericId || id });
  } catch (error) {
    console.error("delete-idea error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  return POST(request);
}

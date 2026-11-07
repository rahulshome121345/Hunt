import { db } from "@/lib/db";
import IncubatorDetailClient from "./IncubatorDetailClient";

export async function generateStaticParams() {
  try {
    const result = await db.execute("SELECT id FROM marketvalidation");
    if (result.rows.length > 0) {
      return result.rows.map(r => ({ id: String(r.id) }));
    }
  } catch {}
  return [{ id: "1" }];
}

async function getIdeaAndHistory(id: number) {
  try {
    const ideaResult = await db.execute({
      sql: `
        SELECT 
          mv.id,
          mv.market_saturation_score,
          mv.final_verdict,
          mv.competitors_found,
          vp.core_problem,
          vp.target_audience
        FROM marketvalidation mv
        JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
        WHERE mv.id = ?
      `,
      args: [id]
    });

    if (ideaResult.rows.length === 0) return null;
    
    const idea = ideaResult.rows[0];

    const historyResult = await db.execute({
      sql: `SELECT id, role, content FROM brainstormmessage WHERE market_validation_id = ? ORDER BY created_at ASC`,
      args: [id]
    });

    return {
      idea: {
        id: Number(idea.id),
        market_saturation_score: Number(idea.market_saturation_score || 1),
        core_problem: String(idea.core_problem),
        target_audience: String(idea.target_audience),
        final_verdict: String(idea.final_verdict),
        competitors_found: String(idea.competitors_found),
      },
      history: historyResult.rows.map(r => ({
        id: Number(r.id),
        role: String(r.role),
        content: String(r.content)
      }))
    };
  } catch (error) {
    console.error("Failed to fetch idea:", error);
    return null;
  }
}

export default async function BrainstormSession({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const numericId = Number(resolvedParams.id);
  const data = await getIdeaAndHistory(numericId);

  return <IncubatorDetailClient ideaId={numericId} initialData={data} />;
}


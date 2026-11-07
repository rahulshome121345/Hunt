import DashboardLayout from "@/components/DashboardLayout";
import VerdictShowcase from "@/components/VerdictShowcase";
import { db } from "@/lib/db";


async function getSavedVerdicts() {
  try {
    const result = await db.execute(`
      SELECT 
        mv.id,
        mv.market_saturation_score,
        mv.final_verdict,
        mv.recommendation_light,
        mv.competitors_found,
        mv.is_saved,
        mv.validated_at,
        vp.core_problem,
        vp.target_audience
      FROM marketvalidation mv
      JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
      WHERE mv.is_saved = 1
      ORDER BY mv.validated_at DESC
    `);

    return result.rows.map(row => ({
      id: Number(row.id),
      market_saturation_score: Number(row.market_saturation_score),
      final_verdict: String(row.final_verdict),
      recommendation_light: String(row.recommendation_light),
      competitors_found: String(row.competitors_found),
      is_saved: Boolean(row.is_saved),
      validated_at: String(row.validated_at || ""),
      core_problem: String(row.core_problem),
      target_audience: String(row.target_audience)
    }));
  } catch (error) {
    console.error("Failed to fetch saved verdicts:", error);
    return [];
  }
}

export default async function IncubatorPage() {
  const verdicts = await getSavedVerdicts();

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 sm:pt-12 pb-24 flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl font-bold font-playfair text-white mb-3 sm:mb-4 text-center">
          The Incubator
        </h1>
        <p className="text-white/60 text-sm sm:text-lg mb-8 sm:mb-12 max-w-2xl text-center px-2">
          Your curated sanctuary of billion-dollar ideas. Tap an idea to enter the Brainstorming Engine and research the market with your AI Co-Founder.
        </p>

        <div className="w-full">
          <VerdictShowcase verdicts={verdicts} showDelete={true} />
        </div>
      </div>
    </DashboardLayout>
  );
}

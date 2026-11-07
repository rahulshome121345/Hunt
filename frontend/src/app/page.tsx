import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import VerdictShowcase from "@/components/VerdictShowcase";
import SearchInput from "@/components/SearchInput";
import { db } from "@/lib/db";

export const dynamic = "force-static";

async function getLiveVerdicts(query: string = "") {
  try {
    let sql = `
      SELECT 
        mv.id,
        mv.market_saturation_score,
        mv.final_verdict,
        mv.recommendation_light,
        mv.competitors_found,
        mv.is_saved,
        mv.validated_at,
        vp.core_problem,
        vp.target_audience,
        vp.source_tag,
        vp.source_name,
        vp.extracted_at
      FROM marketvalidation mv
      JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
    `;
    const params: (string | number)[] = [];

    if (query) {
      sql += ` WHERE vp.core_problem LIKE ? OR vp.target_audience LIKE ? OR mv.final_verdict LIKE ?`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    sql += ` ORDER BY mv.id DESC LIMIT 50`;

    const result = await db.execute({ sql, args: params });

    return result.rows.map((row) => ({
      id: Number(row.id),
      market_saturation_score: Number(row.market_saturation_score),
      final_verdict: String(row.final_verdict),
      recommendation_light: String(row.recommendation_light),
      competitors_found: String(row.competitors_found),
      is_saved: Boolean(row.is_saved),
      validated_at: String(row.validated_at || ""),
      extracted_at: String(row.extracted_at || ""),
      core_problem: String(row.core_problem),
      target_audience: String(row.target_audience),
      source_tag: String(row.source_tag || "Global"),
      source_name: String(row.source_name || "Global / Multi-Source"),
    }));
  } catch (error) {
    console.error("Failed to fetch live verdicts:", error);
    return [];
  }
}

async function getCategoryDistribution() {
  try {
    const result = await db.execute(`
      SELECT vp.target_audience as name, COUNT(mv.id) as count
      FROM marketvalidation mv
      JOIN validatedpainpoint vp ON mv.validated_pain_point_id = vp.id
      GROUP BY vp.target_audience
      ORDER BY count DESC
      LIMIT 5
    `);
    return result.rows.map((r) => ({
      name: String(r.name || "Uncategorized"),
      count: Number(r.count),
    }));
  } catch {
    return [];
  }
}

async function getSystemMetrics() {
  try {
    const totalVerdicts = await db.execute(`SELECT COUNT(*) as count FROM marketvalidation`);
    return {
      valid: Number(totalVerdicts.rows[0]?.count || 0),
    };
  } catch {
    return { valid: 0 };
  }
}

async function getLatestIngestTime(source: string) {
  try {
    const res = await db.execute({
      sql: `SELECT created_at FROM rawpost WHERE source = ? ORDER BY id DESC LIMIT 1`,
      args: [source],
    });
    if (res.rows.length === 0) return "No data yet";
    const dateStr = String(res.rows[0].created_at);
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Active";
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

  const verdicts = await getLiveVerdicts(q);
  const categories = await getCategoryDistribution();
  const metrics = await getSystemMetrics();
  const lastReddit = await getLatestIngestTime("reddit");
  const lastHN = await getLatestIngestTime("hackernews");
  const lastPH = await getLatestIngestTime("producthunt");

  return (
    <DashboardLayout>
      {/* FULL-WIDTH HERO */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 relative z-10">
        {/* HERO MONOLITH */}
        <div className="glass-premium px-4 sm:px-10 lg:px-16 py-6 sm:py-9 lg:py-12 text-center flex flex-col items-center justify-center">
          {/* Source status pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[11px] sm:text-xs text-white/70 whitespace-nowrap">
              <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0">
                P
              </div>
              <span className="font-medium">ProductHunt</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-400/80">{lastPH}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[11px] sm:text-xs text-white/70 whitespace-nowrap">
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white">
                  <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.975 2.163 2.174 2.163 1.198 0 2.172-.97 2.172-2.163s-.975-2.164-2.172-2.164c-.92 0-1.704.574-2.021 1.379l-4.329-1.015c-.189-.046-.381.063-.44.249l-1.654 5.207c-2.838.034-5.409.798-7.3 2.025-.474-.438-1.103-.712-1.799-.712-1.465 0-2.656 1.187-2.656 2.646 0 .97.533 1.811 1.317 2.271-.052.282-.086.567-.086.857 0 3.911 4.808 7.093 10.719 7.093s10.72-3.182 10.72-7.093c0-.274-.029-.544-.075-.81.832-.447 1.405-1.312 1.405-2.318zm-17.224 1.816c0-.868.71-1.575 1.582-1.575.872 0 1.581.707 1.581 1.575s-.709 1.574-1.581 1.574-1.582-.706-1.582-1.574zm9.061 4.669c-1.25.894-3.525.895-4.881 0-.154-.103-.195-.311-.092-.465.103-.153.31-.194.464-.091 1.077.771 3.031.772 4.144 0 .153-.104.361-.063.464.091.104.153.064.361-.09.465zm.366-3.095c-.872 0-1.581-.706-1.581-1.574 0-.868.709-1.575 1.581-1.575s1.582.707 1.582 1.575c0 .868-.71 1.574-1.582 1.574z" />
                </svg>
              </div>
              <span className="font-medium">Reddit</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-400/80">{lastReddit}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[11px] sm:text-xs text-white/70 whitespace-nowrap">
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0">
                H
              </div>
              <span className="font-medium">HackerNews</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-400/80">{lastHN}</span>
            </div>
          </div>

          {/* Ideas Stored Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-amber-500 text-[11px] sm:text-xs font-semibold mb-4 uppercase tracking-widest backdrop-blur-md shadow-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {metrics.valid} Startup Ideas Stored
          </div>

          {/* Headline — 2 lines on desktop, clean responsive font */}
          <h1 className="font-bold font-playfair tracking-tight text-white leading-[1.15] mb-3 text-shadow-lg text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl mx-auto">
            UNCOVER YOUR NEXT BILLION-DOLLAR STARTUP IDEA
          </h1>

          {/* Subheadline */}
          <p className="text-white/65 mx-auto mb-6 leading-relaxed text-xs sm:text-sm md:text-base max-w-2xl">
            Automated search, analysis &amp; storage of innovative business concepts from top websites — your intelligent startup research companion.
          </p>

          {/* Search + Scrape CTA Button */}
          <div className="w-full max-w-[580px] sm:max-w-[620px] mx-auto flex flex-col gap-3 mb-5">
            <React.Suspense fallback={<div className="w-full h-12 glass-subtle animate-pulse rounded-full" />}>
              <SearchInput />
            </React.Suspense>
          </div>

          {/* Dynamic Category Tags */}
          {/* Desktop: Full text, single flex row */}
          <div className="hidden md:flex flex-wrap justify-center items-center gap-2 max-w-full">
            <span className="text-xs text-white/50 mr-1">Trending:</span>
            {categories.map((c) => (
              <span key={c.name} className="px-3 py-1 rounded-full bg-white/8 border border-white/15 text-white text-xs whitespace-nowrap">
                {c.name} ({c.count})
              </span>
            ))}
            {categories.length === 0 && (
              <span className="text-white/40 text-xs italic">Waiting for data...</span>
            )}
          </div>

          {/* Mobile: Truncated text */}
          <div className="md:hidden flex flex-wrap justify-center items-center gap-1.5 w-full">
            <span className="text-[11px] text-white/50">Trending:</span>
            {categories.map((c) => (
              <span key={c.name} className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/15 text-white text-[11px]">
                {c.name.length > 28 ? c.name.slice(0, 28) + "…" : c.name} ({c.count})
              </span>
            ))}
            {categories.length === 0 && (
              <span className="text-white/40 text-[11px] italic">Waiting for data...</span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Full Width Scraped Ideas */}
      <div className="w-full max-w-[95rem] mx-auto px-4 pb-32">
        <VerdictShowcase verdicts={verdicts} title={q ? `Search Results for "${q}"` : "Scraped Ideas"} />
      </div>
    </DashboardLayout>
  );
}

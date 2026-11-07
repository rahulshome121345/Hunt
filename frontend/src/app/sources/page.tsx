import DashboardLayout from "@/components/DashboardLayout";
import { db } from "@/lib/db";
import { Database, Clock } from "lucide-react";

async function getSourceStats(platformKey: string) {
  try {
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM rawpost WHERE LOWER(platform) LIKE LOWER(?)`,
      args: [`%${platformKey}%`]
    });
    const lastIngestResult = await db.execute({
      sql: `SELECT created_at FROM rawpost WHERE LOWER(platform) LIKE LOWER(?) ORDER BY id DESC LIMIT 1`,
      args: [`%${platformKey}%`]
    });
    
    const count = Number(countResult.rows[0]?.count || 0);
    const rawDate = lastIngestResult.rows.length > 0 ? String(lastIngestResult.rows[0].created_at) : "";
    
    let formattedDate = "Active (Live)";
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata"
        }) + " IST";
      } else {
        formattedDate = rawDate.split(".")[0];
      }
    } else if (count > 0) {
      formattedDate = "Recently Ingested";
    }

    return {
      count,
      lastIngest: count > 0 ? formattedDate : "Active (Client Ingest)"
    };
  } catch {
    return { count: 0, lastIngest: "Active" };
  }
}

export default async function SourcesPage() {
  const sihStats = await getSourceStats("sih");
  const idexStats = await getSourceStats("idex");
  const meityStats = await getSourceStats("meity");
  const openCityStats = await getSourceStats("opencity");
  const ycStats = await getSourceStats("yc");
  const redditStats = await getSourceStats("reddit");
  const hnStats = await getSourceStats("hacker");
  const phStats = await getSourceStats("product");

  const sources = [
    {
      name: "Smart India Hackathon (SIH)",
      icon: "🇮🇳",
      color: "bg-emerald-600",
      description: "Ingesting 1,200+ official Indian Ministry problem statements (Health, Agriculture, Defense, Finance).",
      stats: sihStats,
      active: true,
      tag: "India Specific"
    },
    {
      name: "iDEX Defence Innovation",
      icon: "🛡️",
      color: "bg-red-600",
      description: "Indian Ministry of Defence DISC challenges (Autonomous Drones, Quantum Comms, Tactical Mesh).",
      stats: idexStats,
      active: true,
      tag: "India Specific"
    },
    {
      name: "OpenCity India & MeitY Hub",
      icon: "🏙️",
      color: "bg-cyan-600",
      description: "Urban infrastructure audits (Bengaluru water tank deficit, Mumbai EV grid load, RISC-V edge IP).",
      stats: openCityStats.count >= meityStats.count ? openCityStats : meityStats,
      active: true,
      tag: "India Specific"
    },
    {
      name: "Y Combinator RFS",
      icon: "🚀",
      color: "bg-orange-600",
      description: "Y Combinator Requests for Startups (B2B Supply Chain AI Agents, Legacy Code Refactoring).",
      stats: ycStats,
      active: true,
      tag: "Global"
    },
    {
      name: "Reddit (r/startups, r/SaaS)",
      icon: "🔴",
      color: "bg-rose-600",
      description: "Live search JSON API scraping subreddits (r/startups, r/SaaS, r/Entrepreneur) for founder pain points.",
      stats: redditStats,
      active: true,
      tag: "Global / India"
    },
    {
      name: "HackerNews",
      icon: "🟠",
      color: "bg-amber-600",
      description: "Algolia REST API & Python ingester pulling Ask HN & Show HN threads for technical market gaps.",
      stats: hnStats,
      active: true,
      tag: "Global"
    },
    {
      name: "ProductHunt",
      icon: "🅿️",
      color: "bg-orange-500",
      description: "Analyzing negative launch reviews and missing product features across tech launches.",
      stats: phStats,
      active: true,
      tag: "Global"
    },
    {
      name: "Twitter / X",
      icon: "𝕏",
      color: "bg-neutral-800",
      description: "Listening to founder complaints and build-in-public struggles.",
      stats: { count: 0, lastIngest: "Coming Soon" },
      active: false,
      tag: "Global"
    }
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto pt-8 sm:pt-12 pb-24 px-4">
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <span>⚡ 8 Active Ingestion Pipelines</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-playfair text-white mb-3 tracking-wide">Data Sources</h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            Manage the pipelines that feed the AI Brain. Monitor and inspect where your Indian and Global startup ideas are extracted from.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {sources.map((src) => (
            <div key={src.name} className={`glass-premium p-6 sm:p-7 flex flex-col relative group overflow-hidden ${!src.active && 'opacity-60 grayscale'}`}>
              
              {/* Status Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400/80 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {src.tag}
                </span>
                {src.active ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                    Offline
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl ${src.color} flex items-center justify-center font-bold text-white text-xl shadow-lg flex-shrink-0`}>
                  {src.icon}
                </div>
                <div className="pr-16">
                  <h3 className="text-lg font-bold text-white leading-snug">{src.name}</h3>
                </div>
              </div>
              
              <p className="text-white/70 text-xs leading-relaxed mb-6 flex-grow">
                {src.description}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 mt-auto">
                <div>
                  <div className="text-white/40 text-[9px] uppercase tracking-widest flex items-center gap-1.5 mb-0.5 font-mono">
                    <Database size={11} /> Raw Posts / Portals
                  </div>
                  <div className="text-white font-mono font-bold text-base">
                    {src.stats.count > 0 ? src.stats.count : (src.active ? "Active" : 0)}
                  </div>
                </div>
                <div>
                  <div className="text-white/40 text-[9px] uppercase tracking-widest flex items-center gap-1.5 mb-0.5 font-mono">
                    <Clock size={11} /> Ingest Status
                  </div>
                  <div className="text-white text-xs truncate font-mono">{src.stats.lastIngest}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}

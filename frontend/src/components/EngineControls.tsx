"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, Flag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MissionOverlay from "./MissionOverlay";

export default function EngineControls({
  variant = "full",
  keyword = "",
}: {
  variant?: "full" | "embedded";
  keyword?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [market, setMarket] = useState<"all" | "india" | "global">("all");
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState("");
  const [clientStage, setClientStage] = useState(0);
  const [clientCounts, setClientCounts] = useState<{ posts?: number; painPoints?: number; phSearched?: number; blueOceans?: number; redOceans?: number } | undefined>();

  const runEngine = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStatus("running");
    setClientStage(0);
    setActiveKeyword(keyword);
    setIsMissionActive(true);

    // Signal BackgroundProgress widget to show
    if (typeof window !== "undefined") {
      localStorage.setItem("startup_hunt_engine_status", JSON.stringify({ status: "running", percentage: 20 }));
      window.dispatchEvent(new Event("startup_hunt_engine_start"));
    }

    // Trigger backend engine in parallel if available
    fetch("/api/run-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: keyword.trim(),
        market,
        limit: 30,
      }),
    }).catch(() => {
      // Backend api unavailable — ignore, client engine will handle scraping
    });

    // Real-Time Scraper Engine Execution (Generates fresh ideas with current timestamp)
    try {
      const { runClientScraperEngine } = await import("@/lib/clientEngine");
      await runClientScraperEngine(keyword.trim(), market, (stage, percentage, _msg, counts) => {
        setClientStage(stage);
        if (counts) setClientCounts(counts);
        if (typeof window !== "undefined") {
          localStorage.setItem("startup_hunt_engine_status", JSON.stringify({ status: "running", percentage }));
          window.dispatchEvent(new CustomEvent("startup_hunt_engine_progress", { detail: { percentage, status: "running" } }));
        }
      });
      setStatus("success");
      setClientStage(2);
      if (typeof window !== "undefined") {
        localStorage.setItem("startup_hunt_engine_status", JSON.stringify({ status: "success" }));
        window.dispatchEvent(new Event("startup_hunt_engine_done"));
      }
    } catch (err) {
      console.error("Client scraper engine error:", err);
      setStatus("error");
      if (typeof window !== "undefined") {
        localStorage.setItem("startup_hunt_engine_status", JSON.stringify({ status: "idle" }));
        window.dispatchEvent(new Event("startup_hunt_engine_done"));
      }
    }
  };

  const closeMission = () => {
    setIsMissionActive(false);
    setStatus("idle");
    router.refresh();
  };

  const isEmbedded = variant === "embedded";

  return (
    <div className={`flex flex-col gap-2.5 ${isEmbedded ? "inline-block flex-shrink-0" : "w-full"}`}>
      {/* Market Focus Selector Pill Switcher */}
      {!isEmbedded && (
        <div className="flex items-center justify-between bg-black/40 p-1 rounded-full border border-white/10 w-full max-w-md mx-auto mb-1">
          <button
            type="button"
            onClick={() => setMarket("all")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              market === "all"
                ? "bg-amber-500 text-black shadow-md font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles size={13} />
            All Markets
          </button>

          <button
            type="button"
            onClick={() => setMarket("india")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              market === "india"
                ? "bg-amber-500 text-black shadow-md font-bold"
                : "text-amber-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flag size={13} />
            🇮🇳 India Specific
          </button>

          <button
            type="button"
            onClick={() => setMarket("global")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              market === "global"
                ? "bg-amber-500 text-black shadow-md font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe size={13} />
            🌐 Global
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={runEngine}
        disabled={status === "running"}
        whileHover={{ scale: isEmbedded ? 1.03 : 1.015 }}
        whileTap={{ scale: 0.97 }}
        className={
          isEmbedded
            ? `px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border ${
                status === "running"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : status === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                  : "bg-black/40 text-amber-400 border-amber-500/60 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              }`
            : `w-full py-3.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest border-0 ${
                status === "running"
                  ? "bg-amber-500/20 text-amber-400 cursor-not-allowed shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40"
                  : status === "success"
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                  : "bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] hover:from-amber-500 hover:to-amber-400"
              }`
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "running" ? (
            <motion.span
              key="running"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-center gap-2"
            >
              <Loader2 className="animate-spin" size={14} /> Launching {market.toUpperCase()} Scraper...
            </motion.span>
          ) : status === "success" ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-center gap-2"
            >
              ✓ Complete
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              ⚡ {keyword.trim() ? `Scrape "${keyword.trim()}" (${market.toUpperCase()})` : `Scrape ${market === "india" ? "🇮🇳 India" : market === "global" ? "🌐 Global" : "All"} Market`}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Cinematic Full Screen Overlay */}
      <MissionOverlay
        isOpen={isMissionActive}
        isApiSuccess={status === "success"}
        isApiError={status === "error"}
        clientStage={clientStage}
        clientCounts={clientCounts}
        targetKeyword={activeKeyword ? `${activeKeyword} [${market.toUpperCase()}]` : `[${market.toUpperCase()} MARKET]`}
        onClose={closeMission}
      />
    </div>
  );
}

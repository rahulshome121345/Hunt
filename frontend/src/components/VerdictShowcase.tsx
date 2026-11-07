"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Loader2, AlertTriangle, X, Brain, ExternalLink, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Verdict {
  id: number;
  core_problem: string;
  target_audience: string;
  final_verdict: string;
  market_saturation_score: number;
  recommendation_light: string;
  competitors_found: string;
  gemini_insight?: string;
  is_saved: boolean;
  validated_at?: string;
  extracted_at?: string;
  source_tag?: string;
  source_name?: string;
}

// Fixed-position portal confirm dialog — completely outside the card DOM tree
function DeleteConfirmPortal({
  onConfirm,
  onCancel,
  isDeleting,
  problemText,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  problemText: string;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-xl"
      onPointerDown={(e) => { e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0d0d0d] border border-red-500/40 rounded-2xl p-6 w-[90vw] max-w-sm shadow-[0_0_60px_rgba(239,68,68,0.25)]"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Delete Idea?</h3>
            <p className="text-white/50 text-[11px] font-mono mt-0.5">This cannot be undone</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="ml-auto text-white/30 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-white/70 leading-relaxed mb-5 line-clamp-3 bg-white/5 rounded-xl p-3 border border-white/10">
          {problemText}
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-lg"
          >
            {isDeleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={12} />
                Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// Collapsible Gemini Insight Panel
function GeminiInsightPanel({ insight, light }: { insight: string; light: string }) {
  const [open, setOpen] = useState(false);
  const colorClass =
    light === "RED"
      ? { border: "border-red-500/25", bg: "bg-red-500/8", text: "text-red-300", icon: "text-red-400" }
      : light === "YELLOW"
      ? { border: "border-amber-500/25", bg: "bg-amber-500/8", text: "text-amber-300", icon: "text-amber-400" }
      : { border: "border-emerald-500/25", bg: "bg-emerald-500/8", text: "text-emerald-300", icon: "text-emerald-400" };

  return (
    <div className={`mb-3 rounded-xl border ${colorClass.border} ${colorClass.bg} overflow-hidden`}>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
        className={`w-full flex items-center justify-between px-3 py-2 text-[9px] uppercase tracking-widest font-mono font-bold ${colorClass.icon} transition-colors`}
      >
        <span className="flex items-center gap-1.5">
          <Brain size={9} />
          Gemini Insight
        </span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      {open && (
        <div className={`px-3 pb-3 text-[10px] leading-relaxed ${colorClass.text} font-mono`}>
          {insight}
        </div>
      )}
    </div>
  );
}

function VerdictCard({
  v,
  index,
  onDelete,
}: {
  v: Verdict;
  index: number;
  onDelete?: (id: number) => void;
}) {
  const [isSaved, setIsSaved] = useState(v.is_saved);
  const [isStoring, setIsStoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleCardClick = useCallback(() => {
    // Block card navigation if confirm dialog is open
    if (showConfirm || deleting) return;
    router.push(`/incubator/${v.id}`);
  }, [showConfirm, deleting, router, v.id]);

  const handleStoreAndEnter = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSaved && !isStoring) {
      setIsStoring(true);
      try {
        const { updateClientIdeaSavedState } = await import("@/lib/clientEngine");
        updateClientIdeaSavedState(v.id, true);

        await fetch("/api/store-idea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: v.id, isSaved: true }),
        }).catch((e) => console.warn("API store warning:", e));

        setIsSaved(true);
      } catch (err) {
        console.error("Failed to store idea:", err);
      } finally {
        setIsStoring(false);
      }
    }
    router.push(`/incubator/${v.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true);
  };

  const executeDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);

    try {
      // LocalStorage sync for client-side persistence in static Firebase Hosting
      const { addDeletedIdeaId } = await import("@/lib/clientEngine");
      addDeletedIdeaId(v.id);

      await fetch("/api/delete-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id }),
      }).catch((e) => console.warn("API delete sync warning:", e));
    } catch (err) {
      console.warn("Delete failed:", err);
    }

    // Confirmed success — remove from parent list
    onDelete?.(v.id);
  };

  const timestampRaw = v.validated_at || v.extracted_at || "";
  const formattedTimestamp = timestampRaw
    ? (() => {
        const d = new Date(timestampRaw);
        if (isNaN(d.getTime())) return timestampRaw;
        return d.toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
      })()
    : "Recently Scraped";

  const sourceTag = v.source_tag || "Global";
  const sourceName = v.source_name || "Global / Multi-Source";
  const sourceBadgeConfig: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
    SIH:        { emoji: "🇮🇳", color: "text-emerald-400",  bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    iDEX:       { emoji: "🛡️", color: "text-red-400",      bg: "bg-red-500/15",     border: "border-red-500/30" },
    OpenCity:   { emoji: "🏙️", color: "text-cyan-400",     bg: "bg-cyan-500/15",    border: "border-cyan-500/30" },
    MeitY:      { emoji: "⚡",  color: "text-purple-400",  bg: "bg-purple-500/15",  border: "border-purple-500/30" },
    YC_RFS:     { emoji: "🚀", color: "text-orange-400",   bg: "bg-orange-500/15",  border: "border-orange-500/30" },
    HackerNews: { emoji: "🟠", color: "text-orange-300",   bg: "bg-orange-500/10",  border: "border-orange-400/30" },
    Reddit:     { emoji: "🔴", color: "text-rose-400",     bg: "bg-rose-500/15",    border: "border-rose-500/30" },
    Global:     { emoji: "🌐", color: "text-amber-400",    bg: "bg-amber-500/15",   border: "border-amber-500/30" },
  };
  const badge = sourceBadgeConfig[sourceTag] || sourceBadgeConfig["Global"];

  if (deleting) return null;

  return (
    <>
      {/* Fixed-position portal confirm dialog — completely outside card DOM */}
      <AnimatePresence>
        {showConfirm && (
          <DeleteConfirmPortal
            problemText={v.core_problem}
            isDeleting={deleting}
            onConfirm={executeDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleCardClick}
        className="glass-subtle flex-shrink-0 w-[76vw] sm:w-80 md:w-96 p-5 sm:p-6 flex flex-col snap-start relative group hover:bg-black/40 hover:border-amber-500/30 transition-all duration-300 cursor-pointer rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/5"
      >
        {/* Recommendation Light Indicator Dot (Top Right) */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5" title={`Verdict Signal: ${v.recommendation_light || "GREEN"}`}>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              v.recommendation_light === "RED" || v.market_saturation_score >= 7
                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : v.recommendation_light === "YELLOW" || (v.market_saturation_score >= 4 && v.market_saturation_score <= 6)
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            }`}
          />
        </div>

        {/* Card Header */}
        <div className="mb-4 flex flex-col pr-6">
          <h3
            className="text-base sm:text-lg font-bold text-white leading-snug mb-2 line-clamp-2 min-h-[2.8rem] group-hover:text-amber-400 transition-colors"
            title={v.core_problem}
          >
            {v.core_problem}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-amber-500/90 font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Scraped {formattedTimestamp} IST</span>
          </div>
        </div>

        {/* Source Tag & Target Audience Pill */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${badge.bg} border ${badge.border} ${badge.color}`}>
              {badge.emoji} {sourceName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/75 bg-white/5 border border-white/10 rounded-xl p-2.5">
            <span className="w-2 h-2 rounded-full border border-amber-400 flex-shrink-0" />
            <span className="line-clamp-1 font-mono text-[11px]">
              Target Persona • {v.target_audience}
            </span>
          </div>
        </div>

        {/* AI Verdict Snippet */}
        <div className="mb-4 flex-1">
          <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">
            {v.final_verdict}
          </p>
        </div>

        {/* Competitors Row */}
        {(() => {
          let comps: { name: string; url?: string }[] = [];
          try { comps = JSON.parse(v.competitors_found || "[]"); } catch { comps = []; }
          if (comps.length === 0) return null;
          return (
            <div className="mb-3">
              <p className="text-[9px] uppercase tracking-widest text-white/35 font-mono mb-1.5 flex items-center gap-1">
                <ExternalLink size={8} /> Known Competitors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {comps.slice(0, 4).map((c, i) => (
                  <a
                    key={i}
                    href={c.url || `https://www.producthunt.com/search?q=${encodeURIComponent(c.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border transition-all hover:brightness-125 ${
                      v.recommendation_light === "RED"
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : v.recommendation_light === "YELLOW"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Gemini Insight */}
        {v.gemini_insight && (
          <GeminiInsightPanel insight={v.gemini_insight} light={v.recommendation_light} />
        )}

        {/* Footer Metrics & Actions */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">
              Market Saturation
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                v.market_saturation_score <= 3
                  ? "text-emerald-400"
                  : v.market_saturation_score <= 6
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {v.market_saturation_score}/10
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Delete button — stops ALL event propagation */}
            <button
              onPointerDown={(e) => { e.stopPropagation(); }}
              onClick={handleDeleteClick}
              title="Delete this idea"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 z-10 relative"
            >
              <Trash2 size={14} />
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleStoreAndEnter}
              disabled={isStoring}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:brightness-110 shadow-lg flex items-center gap-1.5 z-10 relative"
            >
              {isStoring ? (
                <Loader2 className="animate-spin" size={13} />
              ) : isSaved ? (
                "Open Incubator"
              ) : (
                "Store & Open Incubator"
              )}
            </button>
          </div>
        </div>

        {/* Saturation Light */}
        {v.recommendation_light && (
          <div
            className={`absolute top-4 right-4 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
              v.recommendation_light === "GREEN"
                ? "bg-emerald-500 text-emerald-500"
                : v.recommendation_light === "YELLOW"
                ? "bg-amber-500 text-amber-500"
                : "bg-red-500 text-red-500"
            }`}
            title={`Recommendation: ${v.recommendation_light}`}
          />
        )}
      </motion.div>
    </>
  );
}

export default function VerdictShowcase({
  verdicts,
  showDelete = false,
  title,
}: {
  verdicts: Verdict[];
  showDelete?: boolean;
  title?: string;
}) {
  const [list, setList] = useState<Verdict[]>(verdicts);
  const scrollRef = useRef<HTMLDivElement>(null);

  const syncList = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const deletedRaw = localStorage.getItem("startup_hunt_deleted_ids");
      const deletedIds: number[] = deletedRaw ? JSON.parse(deletedRaw) : [];

      const customRaw = localStorage.getItem("startup_hunt_custom_scraped_ideas");
      const customIdeas: Verdict[] = customRaw ? JSON.parse(customRaw) : [];

      const savedRaw = localStorage.getItem("startup_hunt_saved_ids");
      const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];

      const combinedMap = new Map<number, Verdict>();

      if (showDelete) {
        // Incubator page: only display saved ideas
        verdicts.forEach((item) => {
          if (!deletedIds.includes(item.id)) {
            combinedMap.set(item.id, { ...item, is_saved: true });
          }
        });
        customIdeas.forEach((item) => {
          if (!deletedIds.includes(item.id) && (item.is_saved || savedIds.includes(item.id))) {
            combinedMap.set(item.id, { ...item, is_saved: true });
          }
        });
      } else {
        // Dashboard / main page: display all custom + db ideas with accurate local is_saved status
        customIdeas.forEach((item) => {
          if (!deletedIds.includes(item.id)) {
            const isSavedLocally = item.is_saved || savedIds.includes(item.id);
            combinedMap.set(item.id, { ...item, is_saved: isSavedLocally });
          }
        });
        verdicts.forEach((item) => {
          if (!deletedIds.includes(item.id) && !combinedMap.has(item.id)) {
            const isSavedLocally = item.is_saved || savedIds.includes(item.id);
            combinedMap.set(item.id, { ...item, is_saved: isSavedLocally });
          }
        });
      }

      setList(Array.from(combinedMap.values()));
    } catch {
      setList(verdicts);
    }
  }, [verdicts, showDelete]);

  useEffect(() => {
    const handleEvent = () => syncList();
    const timer = setTimeout(() => {
      syncList();
    }, 0);
    window.addEventListener("startup_hunt_scraped", handleEvent);
    window.addEventListener("storage", handleEvent);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("startup_hunt_scraped", handleEvent);
      window.removeEventListener("storage", handleEvent);
    };
  }, [syncList]);

  // Convert mouse wheel vertical scroll to horizontal scroll inside card container
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Auto-scroll to start (left) whenever list updates with new items
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [list.length]);

  const handleNavScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const handleDelete = (id: number) => {
    setList((prev) => prev.filter((v) => v.id !== id));
    try {
      const deletedRaw = localStorage.getItem("startup_hunt_deleted_ids");
      const deletedIds: number[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("startup_hunt_deleted_ids", JSON.stringify(deletedIds));
      }
      window.dispatchEvent(new CustomEvent("startup_hunt_scraped", { detail: { deletedId: id } }));
    } catch {
      // Ignore
    }
  };

  if (list.length === 0) {
    return (
      <div className="glass-subtle p-12 text-center text-white/60 w-full rounded-2xl">
        No ideas here yet. Run the engine to scrape new ideas!
      </div>
    );
  }

  return (
    <div className="relative w-full group/container">
      {/* Integrated Section Header & Navigation Bar (Clean side-by-side flex layout with ZERO overlap) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide">
          {title || (showDelete ? "Saved Incubator Ideas" : "Scraped Ideas")}
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {!showDelete && (
            <Link
              href="/incubator"
              className="glass-subtle px-4 sm:px-6 py-2 text-amber-400 border border-amber-500/30 font-medium text-xs sm:text-sm hover:bg-amber-500/10 transition-all rounded-xl uppercase tracking-wider flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              VIEW SAVED INCUBATOR IDEAS
            </Link>
          )}

          {/* Navigation Control Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleNavScroll("left")}
              title="Scroll Left"
              className="p-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black transition-all shadow-lg backdrop-blur-md active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleNavScroll("right")}
              title="Scroll Right"
              className="p-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black transition-all shadow-lg backdrop-blur-md active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative w-full"
        style={{
          maskImage: "linear-gradient(to right, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 92%, transparent 100%)",
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-3.5 sm:gap-6 overflow-x-auto pb-4 sm:pb-8 snap-x snap-mandatory pr-[5%]"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(245, 158, 11, 0.6) rgba(255, 255, 255, 0.05)",
          }}
        >
          <AnimatePresence>
            {list.map((v, i) => (
              <VerdictCard
                key={v.id}
                v={v}
                index={i}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
          <div className="w-[8vw] flex-shrink-0 snap-end" aria-hidden="true" />
        </div>
      </div>

      {/* Swipe & Nav Hint Bar */}
      <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-white/50">
        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
          👈 👉 Click arrows or scroll mouse wheel over cards to explore ({list.length} ideas)
        </span>
        <span className="hidden sm:inline-block text-white/40">
          Tip: Hold Shift + scroll wheel or drag scrollbar
        </span>
      </div>
    </div>
  );
}

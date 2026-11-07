"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import IncubatorPanel from "./IncubatorPanel";
import DeleteIdeaButton from "./DeleteIdeaButton";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

interface IdeaData {
  id: number;
  core_problem: string;
  target_audience: string;
  final_verdict: string;
  competitors_found: string;
  market_saturation_score: number;
}

interface Message {
  id?: number;
  role: string;
  content: string;
}

interface ServerData {
  idea: IdeaData;
  history: Message[];
}

export default function IncubatorDetailClient({
  ideaId,
  initialData,
}: {
  ideaId: number;
  initialData: ServerData | null;
}) {
  const [data, setData] = useState<ServerData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    // Try finding the idea in client LocalStorage
    try {
      const customRaw = localStorage.getItem("startup_hunt_custom_scraped_ideas");
      if (customRaw) {
        const customIdeas = JSON.parse(customRaw);
        const item = customIdeas.find((i: { id: number }) => Number(i.id) === Number(ideaId));

        if (item) {
          // Load local chat history if available
          let chatHistory: Message[] = [];
          try {
            const localHistoryRaw = localStorage.getItem(`startup_hunt_chat_${ideaId}`);
            if (localHistoryRaw) chatHistory = JSON.parse(localHistoryRaw);
          } catch {
            chatHistory = [];
          }

          setData({
            idea: {
              id: Number(item.id),
              core_problem: item.core_problem || "Scraped Market Idea",
              target_audience: item.target_audience || "Target Customer Persona",
              final_verdict: item.final_verdict || "AI Market Saturation Analysis",
              competitors_found: item.competitors_found || "[]",
              market_saturation_score: Number(item.market_saturation_score || 5),
            },
            history: chatHistory,
          });
        }
      }
    } catch (e) {
      console.warn("Client fallback search failed:", e);
    } finally {
      setLoading(false);
    }
  }, [ideaId, initialData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-6xl mx-auto pt-24 pb-24 text-center text-amber-400 font-mono flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Loading Incubator Session...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-2xl mx-auto pt-24 pb-24 text-center flex flex-col items-center gap-4">
          <div className="glass-premium p-8 rounded-2xl border border-white/10 w-full flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-2">Idea Not Found</h2>
            <p className="text-white/60 text-sm mb-6">
              This idea is not available or was deleted from the Incubator.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto pt-6 sm:pt-8 pb-24 px-3 sm:px-4 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Left Side: Idea Context */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="glass-premium p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                Incubator Context
              </h2>
              <Link
                href="/incubator"
                className="text-[10px] font-mono uppercase text-amber-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft size={10} /> Incubator
              </Link>
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-amber-500 uppercase tracking-widest block mb-1">
                Target Audience
              </span>
              <p className="text-white/80 text-sm font-mono">{data.idea.target_audience}</p>
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-amber-500 uppercase tracking-widest block mb-1">
                Core Problem
              </span>
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                {data.idea.core_problem}
              </p>
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-amber-500 uppercase tracking-widest block mb-1">
                Initial AI Verdict
              </span>
              <p className="text-white/60 text-xs italic leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                {data.idea.final_verdict}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-amber-500 uppercase tracking-widest block mb-2">
                Found Competitors
              </span>
              <ul className="space-y-2">
                {(() => {
                  let parsed: { name?: string; title?: string; description?: string }[] = [];
                  let parseFailed = false;
                  try {
                    const raw = JSON.parse(data.idea.competitors_found || "[]");
                    if (Array.isArray(raw)) parsed = raw;
                  } catch {
                    parseFailed = true;
                  }

                  if (parseFailed) {
                    return (
                      <li className="text-red-400/80 text-xs line-clamp-3 bg-red-500/10 p-2 rounded-lg">
                        {data.idea.competitors_found}
                      </li>
                    );
                  }

                  if (parsed.length === 0) {
                    return <li className="text-white/40 text-xs italic">No direct competitors recorded.</li>;
                  }

                  return parsed.slice(0, 3).map((comp, idx: number) => (
                    <li key={idx} className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                      <div className="text-red-400 font-bold text-xs mb-0.5 truncate">
                        {comp.name || comp.title || "Unknown Competitor"}
                      </div>
                      {comp.description && (
                        <p className="text-white/60 text-[10px] line-clamp-2">{comp.description}</p>
                      )}
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Sidebar Delete Action Button */}
            <DeleteIdeaButton ideaId={data.idea.id} />
          </div>
        </div>

        {/* Right Side: Incubator Panel (AI Chat + NotebookLM Execution Blueprint) */}
        <div className="w-full md:w-2/3 flex flex-col">
          <IncubatorPanel idea={data.idea} history={data.history} />
        </div>
      </div>
    </DashboardLayout>
  );
}

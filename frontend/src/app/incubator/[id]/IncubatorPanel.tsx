"use client";

import { useState } from "react";
import { MessageSquare, Lock, Sparkles } from "lucide-react";
import ChatClient from "./ChatClient";
import BlueprintClient from "./BlueprintClient";

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

export default function IncubatorPanel({
  idea,
  history,
}: {
  idea: IdeaData;
  history: Message[];
}) {
  const [activeTab, setActiveTab] = useState<"chat" | "blueprint">("chat");

  const isBlueprintEnabled = idea.market_saturation_score <= 3;

  return (
    <div className="glass-premium p-5 sm:p-6 flex flex-col h-[680px] max-h-[88vh] w-full">
      {/* Top Header Bar with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/10 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {activeTab === "chat" ? "Live AI Brainstorming Engine" : "Execution Blueprint Studio"}
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "chat"
                ? "bg-amber-500 text-black shadow-md font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare size={13} />
            AI Chat
          </button>

          <button
            onClick={() => setActiveTab("blueprint")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "blueprint"
                ? "bg-amber-500 text-black shadow-md font-bold"
                : isBlueprintEnabled
                ? "text-amber-400 hover:bg-white/5"
                : "text-white/40 hover:bg-white/5"
            }`}
          >
            {isBlueprintEnabled ? (
              <Sparkles size={13} className="text-amber-400" />
            ) : (
              <Lock size={13} className="text-red-400" />
            )}
            Blueprint
            {isBlueprintEnabled ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents — Keep both mounted in DOM to preserve state across tab switches */}
      <div className="flex-1 min-h-0 relative">
        <div className={`w-full h-full ${activeTab === "chat" ? "block" : "hidden"}`}>
          <ChatClient
            ideaId={idea.id}
            initialHistory={history}
            ideaContext={{
              coreProblem: idea.core_problem,
              targetAudience: idea.target_audience,
              finalVerdict: idea.final_verdict,
              competitorsFound: idea.competitors_found,
            }}
          />
        </div>

        <div className={`w-full h-full ${activeTab === "blueprint" ? "block" : "hidden"}`}>
          <BlueprintClient
            ideaId={idea.id}
            marketSaturationScore={idea.market_saturation_score}
            ideaContext={{
              coreProblem: idea.core_problem,
              targetAudience: idea.target_audience,
              finalVerdict: idea.final_verdict,
              competitorsFound: idea.competitors_found,
            }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Lock, Compass, RefreshCw, Maximize2, Minimize2, Trash2 } from "lucide-react";
import BlueprintCanvas from "@/components/BlueprintCanvas";

interface IdeaContext {
  coreProblem: string;
  targetAudience: string;
  finalVerdict: string;
  competitorsFound: string;
}

interface RawNode {
  id: string;
  step: number;
  icon: string;
  title: string;
  badge: string;
  description: string;
}

export default function BlueprintClient({
  ideaId,
  marketSaturationScore,
  ideaContext,
}: {
  ideaId: number;
  marketSaturationScore: number;
  ideaContext: IdeaContext;
}) {
  const [nodes, setNodes] = useState<RawNode[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(`blueprint_nodes_${ideaId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isEnabled = marketSaturationScore <= 3;

  // Persist nodes to localStorage whenever they change
  const updateNodesAndStore = (newNodes: RawNode[] | null) => {
    setNodes(newNodes);
    if (newNodes) {
      try {
        localStorage.setItem(`blueprint_nodes_${ideaId}`, JSON.stringify(newNodes));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const clearBlueprint = () => {
    if (!confirm("Are you sure you want to delete this blueprint? You can regenerate it anytime.")) return;
    setNodes(null);
    try {
      localStorage.removeItem(`blueprint_nodes_${ideaId}`);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const generateBlueprint = async () => {
    if (!isEnabled || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          coreProblem: ideaContext.coreProblem,
          targetAudience: ideaContext.targetAudience,
          finalVerdict: ideaContext.finalVerdict,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.nodes) && data.nodes.length >= 5) {
          updateNodesAndStore(data.nodes);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fallback generator for static/local mode
    }

    // Direct Client-Side Gemini Fallback / Smart Template Generator
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Client Gemini API key is not configured.");
      }
      const promptText = `
        Generate a web-grounded 5-to-7 step JSON Execution Blueprint for:
        Core Problem: "${ideaContext.coreProblem}"
        Target Audience: "${ideaContext.targetAudience}"

        Return ONLY a JSON array with 5 to 7 objects:
        [
          { "id": "1", "step": 1, "icon": "🎯", "title": "Core Problem", "badge": "STEP 01", "description": "Solve ${ideaContext.coreProblem.slice(0, 80)}..." },
          { "id": "2", "step": 2, "icon": "👥", "title": "Target Persona", "badge": "STEP 02", "description": "${ideaContext.targetAudience} actively seeking productivity solutions." },
          { "id": "3", "step": 3, "icon": "🚀", "title": "Wedge MVP", "badge": "STEP 03", "description": "Build an automated 1-click web dashboard automating trial access." },
          { "id": "4", "step": 4, "icon": "🧲", "title": "First 100 Users", "badge": "STEP 04", "description": "Direct founder outreach on Twitter, LinkedIn & Product Hunt discussions." },
          { "id": "5", "step": 5, "icon": "💰", "title": "Monetization", "badge": "STEP 05", "description": "SaaS subscription at $29/mo with a 7-day free trial." }
        ]
      `;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: promptText }] }] }),
        }
      );

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      updateNodesAndStore(parsed);
    } catch {
      // Smart Fallback Nodes
      updateNodesAndStore([
        {
          id: "1",
          step: 1,
          icon: "🎯",
          title: "Core Problem",
          badge: "STEP 01",
          description: ideaContext.coreProblem,
        },
        {
          id: "2",
          step: 2,
          icon: "👥",
          title: "Target Persona",
          badge: "STEP 02",
          description: ideaContext.targetAudience,
        },
        {
          id: "3",
          step: 3,
          icon: "🚀",
          title: "Wedge MVP",
          badge: "STEP 03",
          description: `Build a minimalist web application automating trial evaluation for ${ideaContext.targetAudience}.`,
        },
        {
          id: "4",
          step: 4,
          icon: "🧲",
          title: "First 100 Users",
          badge: "STEP 04",
          description: "Direct maker outreach across Indie Hackers, Twitter #buildinpublic, and Reddit communities.",
        },
        {
          id: "5",
          step: 5,
          icon: "💰",
          title: "Monetization",
          badge: "STEP 05",
          description: "$29/month Pro Plan offering enhanced trial analytics & automated access credentials.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Gatekeeper Locked View for Red Ocean / High Saturation
  if (!isEnabled) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-black/40 border border-red-500/30 rounded-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Lock size={28} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          Market Saturation: {marketSaturationScore}/10 (High Red Ocean Risk)
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2">
          Execution Blueprint Disabled
        </h3>
        <p className="text-sm text-white/60 max-w-md mb-6 leading-relaxed">
          AI Gatekeeper has determined this problem area is heavily saturated. Generating a roadmap is disabled to prevent wasted execution effort on high-risk ideas.
        </p>
        <span className="text-xs text-amber-400/80 font-mono italic border-t border-white/10 pt-4">
          💡 Focus on Blue Ocean opportunities (Saturation Score ≤ 3/10) to unlock full Mind Map blueprints.
        </span>
      </div>
    );
  }

  // 2. Blueprint Flowchart Canvas Generated
  if (nodes) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col relative">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
            <Compass size={14} className="animate-spin" />
            Interactive Mind Map Studio ({nodes.length} Steps)
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={clearBlueprint}
              className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1 transition-colors"
              title="Delete stored blueprint"
            >
              <Trash2 size={12} /> Clear
            </button>

            <button
              onClick={generateBlueprint}
              disabled={isLoading}
              className="text-xs text-white/60 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Regenerate
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95"
            >
              <Maximize2 size={13} />
              <span>Expand Canvas</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[460px]">
          <BlueprintCanvas rawNodes={nodes} />
        </div>

        {/* Fullscreen Modal View */}
        {isFullscreen && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col w-screen h-screen overflow-hidden">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    Execution Blueprint Studio
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex-shrink-0">
                      CORE PROBLEM
                    </span>
                    <p className="text-xs text-white/75 font-medium max-w-3xl truncate">
                      {ideaContext.coreProblem}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={generateBlueprint}
                  disabled={isLoading}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                  Regenerate
                </button>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
                >
                  <Minimize2 size={15} />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Canvas Container */}
            <div className="flex-1 w-full h-full min-h-0 relative">
              <BlueprintCanvas rawNodes={nodes} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Initial Call to Action Screen
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-black/40 border border-amber-500/20 rounded-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
        <Sparkles size={28} />
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
        ✓ Green Ocean Approved ({marketSaturationScore}/10 Saturation)
      </div>
      <h3 className="text-2xl font-serif font-bold text-white mb-2">
        Execution Blueprint Studio
      </h3>
      <p className="text-sm text-white/65 max-w-lg mb-8 leading-relaxed">
        Generate a web-grounded strategic Mind Map roadmap detailing your Core Problem, Target Persona, Wedge MVP, First 100 Users acquisition, and Monetization model.
      </p>

      <button
        onClick={generateBlueprint}
        disabled={isLoading}
        className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-sm px-8 py-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest flex items-center gap-2.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Researching Web &amp; Mapping Strategy...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>⚡ Generate Execution Blueprint</span>
          </>
        )}
      </button>
    </div>
  );
}

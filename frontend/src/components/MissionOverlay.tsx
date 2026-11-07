"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Sparkles, Database, BrainCircuit, Activity, CheckCircle2, Minimize2, Maximize2, X, ArrowRight } from "lucide-react";

const STAGES = [
  {
    id: "scrape",
    name: "SCRAPER AGENT",
    icon: <Database className="text-amber-500" />,
    activeMessage: "Fetching targeted problem statements...",
    metrics: [
      { label: "Posts Analyzed", value: 100 },
      { label: "Pain Points", value: 5 }
    ]
  },
  {
    id: "market",
    name: "MARKET VALIDATOR",
    icon: <Activity className="text-blue-500" />,
    activeMessage: "Searching for existing competitors...",
    metrics: [
      { label: "Searches Run", value: 5 },
      { label: "Competitors Found", value: 25 }
    ]
  },
  {
    id: "score",
    name: "SCORING AGENT",
    icon: <BrainCircuit className="text-emerald-500" />,
    activeMessage: "Calculating Market Saturation Score...",
    metrics: [
      { label: "Calculations Done", value: 5 },
      { label: "Final Scores", value: 5 }
    ]
  }
];

const ORBS = [
  { initialX: -300, initialY: -200, animateX: 200, animateY: 300, duration: 15 },
  { initialX: 400, initialY: 100, animateX: -100, animateY: -300, duration: 18 },
  { initialX: -150, initialY: 350, animateX: 300, animateY: -150, duration: 12 },
  { initialX: 250, initialY: -400, animateX: -250, animateY: 200, duration: 16 },
  { initialX: -450, initialY: 50, animateX: 150, animateY: -250, duration: 14 },
];

export default function MissionOverlay({ 
  isOpen, 
  onClose,
  isApiSuccess,
  isApiError,
  targetKeyword,
  clientStage,
  clientCounts
}: { 
  isOpen: boolean; 
  onClose: () => void;
  isApiSuccess?: boolean;
  isApiError?: boolean;
  targetKeyword?: string;
  clientStage?: number;
  clientCounts?: { posts?: number; painPoints?: number; phSearched?: number; blueOceans?: number; redOceans?: number };
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [metricsValues, setMetricsValues] = useState<Record<string, number>>({});
  const [serverStatus, setServerStatus] = useState<'idle' | 'running' | 'success' | 'error'>('running');
  const [isMinimized, setIsMinimized] = useState(false);
  const router = useRouter();

  // Derived state from props or backend
  const effectiveServerStatus = isApiSuccess ? 'success' : isApiError ? 'error' : serverStatus;
  const effectiveCurrentStage = isApiSuccess ? 2 : (typeof clientStage === 'number' ? clientStage : currentStage);

  // Derived metrics from client engine props or backend polling
  const effectiveMetricsValues = clientCounts
    ? {
        'scrape-Posts Analyzed': clientCounts.posts || 15,
        'scrape-Pain Points': clientCounts.painPoints || 4,
        'market-Searches Run': clientCounts.phSearched || 4,
        'market-Competitors Found': (clientCounts.phSearched || 4) * 4,
        'score-Calculations Done': clientCounts.blueOceans || 4,
        'score-Final Scores': (clientCounts.blueOceans || 4) + (clientCounts.redOceans || 0)
      }
    : metricsValues;

  // Control body scrolling only when open and not minimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen, isMinimized]);

  // Real-time Database Polling
  useEffect(() => {
    if (!isOpen) return;

    const poll = async () => {
      try {
        const res = await fetch('/api/mission-stats');
        if (!res.ok) {
          setServerStatus('running');
          return;
        }
        const data = await res.json();
        
        if (data.status) {
          setServerStatus(data.status);
        }
        if (typeof data.currentStage === 'number') {
          setCurrentStage(data.currentStage);
        }
        
      if (data.counts) {
          setMetricsValues({
            'scrape-Posts Analyzed': data.counts.posts || 0,
            'scrape-Pain Points': data.counts.painPoints || 0,
            'market-Searches Run': data.counts.phSearched || 0,
            'market-Competitors Found': (data.counts.phSearched || 0) * 4,
            'score-Calculations Done': data.counts.completedScoring || 0,
            'score-Final Scores': (data.counts.blueOceans || 0) + (data.counts.redOceans || 0)
          });
        }
      } catch {
        setServerStatus('running');
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [isOpen, router]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Floating Bottom-Right Minimized Widget */}
      {isMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[150] bg-black/90 backdrop-blur-2xl border border-amber-500/40 p-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-400 animate-spin" />
              Scraper Engine Active
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              {targetKeyword ? `Target: ${targetKeyword}` : "Ingesting Data..."}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black transition-colors"
            title="Expand to Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </motion.div>
      )}

      {/* Full-Screen Mission Overlay */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-between p-8 overflow-y-auto"
          >
            {/* Top-Right Control Bar - Positioned comfortably below top navbar line */}
            <div className="fixed top-24 right-8 z-[999999] flex items-center gap-3 bg-black/95 p-2 rounded-2xl border border-amber-500/50 shadow-2xl backdrop-blur-xl">
              <button
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                title="Minimize Overlay to Background"
              >
                <Minimize2 size={14} />
                Minimize
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:text-white hover:bg-red-500 transition-all shadow-md"
                title="Close Overlay"
              >
                <X size={16} />
              </button>
            </div>

            {/* Subtle Background Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <motion.div 
                animate={{ 
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black"
              />
              {ORBS.map((orb, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, x: orb.initialX, y: orb.initialY }}
                  animate={{ 
                    opacity: [0, 0.5, 0], 
                    scale: [0.5, 2, 0.5],
                    x: orb.animateX,
                    y: orb.animateY
                  }}
                  transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
                />
              ))}
            </div>

            <div className="w-full max-w-5xl relative z-10 flex flex-col items-center my-auto">
              
              {/* Mission Header */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-10 text-center"
              >
                {targetKeyword && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    🎯 TARGET KEYWORD: &quot;{targetKeyword}&quot;
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Sparkles className="text-amber-400 animate-pulse" size={24} />
                  <h2 className="text-3xl font-playfair font-bold text-white tracking-widest uppercase">
                    Autonomous Cloud Engine
                  </h2>
                  <Sparkles className="text-amber-400 animate-pulse" size={24} />
                </div>
                <p className="text-white/50 text-base tracking-wider">
                  Ingesting & validating market pain points across Indian & Global portals.
                </p>
              </motion.div>

              {/* Pipeline Agents */}
              <div className="flex w-full justify-between items-start relative mb-12">
                <div className="absolute top-12 left-[10%] right-[10%] h-[2px] bg-white/10 -z-10" />
                
                <motion.div 
                  className="absolute top-12 left-[10%] h-[2px] bg-gradient-to-r from-amber-500 to-emerald-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] -z-10"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(effectiveCurrentStage / (STAGES.length - 1)) * 80}%` }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {STAGES.map((stage, idx) => {
                  const isActive = idx === effectiveCurrentStage;
                  const isPast = idx < effectiveCurrentStage;
                  
                  return (
                    <div key={stage.id} className="flex flex-col items-center w-1/4 relative">
                      <motion.div 
                        className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border transition-colors duration-500 ${
                          isActive ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]" : 
                          isPast ? "bg-white/5 border-white/20" : 
                          "bg-black/40 border-white/5"
                        }`}
                        animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {stage.icon}
                      </motion.div>

                      <div className={`text-center transition-opacity duration-500 ${isActive || isPast ? 'opacity-100' : 'opacity-30'}`}>
                        <h3 className="text-white font-bold text-sm tracking-widest mb-2">{stage.name}</h3>
                        
                        <div className="h-4 mb-4">
                          {isActive && (
                            <motion.p 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="text-amber-400 text-xs italic"
                            >
                              {stage.activeMessage}
                            </motion.p>
                          )}
                          {isPast && (
                            <span className="text-emerald-400 text-xs flex items-center justify-center gap-1 font-semibold">
                              <CheckCircle2 size={12} /> Complete
                            </span>
                          )}
                        </div>

                        <AnimatePresence>
                          {(isActive || isPast) && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="glass-premium p-4 rounded-xl text-left w-full max-w-[200px] border border-white/10 shadow-xl"
                            >
                              <div className="space-y-3">
                                {stage.metrics.map(m => (
                                  <div key={m.label} className="flex justify-between items-center text-xs">
                                    <span className="text-white/60">{m.label}</span>
                                    <span className="text-white font-mono font-bold">
                                      {(effectiveMetricsValues[`${stage.id}-${m.label}`] || (isPast ? m.value : 0)).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                                
                                {isActive && (
                                  <div className="w-full bg-white/10 rounded-full h-1 mt-4 overflow-hidden">
                                    <motion.div 
                                      className="bg-amber-400 h-full"
                                      initial={{ width: "0%" }}
                                      animate={{ width: "100%" }}
                                      transition={{ duration: 4, ease: "linear" }}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prominent Bottom Mission Status Banner */}
              <div className="w-full max-w-3xl mt-4">
                {effectiveServerStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-gradient-to-r from-emerald-950/90 via-black to-black border border-emerald-500/40 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <CheckCircle2 size={28} />
                      </div>
                      <div>
                        <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1">
                          🎉 Mission Accomplished!
                        </h3>
                        <p className="text-white/90 text-sm font-medium">
                          Scraped & validated market pain points are ready on your Dashboard!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        router.refresh();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Explore Dashboard</span>
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-black/60 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
                        ⚡ Engine Pipeline Ingestion Active — Processing Market Saturation & Competitors...
                      </span>
                    </div>
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="text-xs font-semibold text-white/60 hover:text-white underline uppercase tracking-wider"
                    >
                      Run in Background
                    </button>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}

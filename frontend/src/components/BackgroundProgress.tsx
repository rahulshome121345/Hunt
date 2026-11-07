"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function BackgroundProgress() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Read engine status from localStorage (set by clientEngine.ts on scrape start/finish)
    const readStatus = () => {
      try {
        const raw = localStorage.getItem("startup_hunt_engine_status");
        if (!raw) { setStatus('idle'); return; }
        const parsed = JSON.parse(raw);
        const s = parsed?.status || 'idle';
        const pct = parsed?.percentage ?? (s === 'running' ? 50 : s === 'success' ? 100 : 0);
        setStatus(s);
        setPercentage(pct);
      } catch {
        setStatus('idle');
      }
    };

    readStatus();

    const handleStart = () => {
      setStatus('running');
      setPercentage(20);
    };
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.percentage === 'number') setPercentage(detail.percentage);
      if (detail?.status) setStatus(detail.status);
    };
    const handleDone = () => {
      setPercentage(100);
      // Small delay then hide widget
      setTimeout(() => setStatus('idle'), 2500);
    };
    const handleStorage = () => readStatus();

    window.addEventListener("startup_hunt_engine_start", handleStart);
    window.addEventListener("startup_hunt_engine_progress", handleProgress);
    window.addEventListener("startup_hunt_engine_done", handleDone);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("startup_hunt_engine_start", handleStart);
      window.removeEventListener("startup_hunt_engine_progress", handleProgress);
      window.removeEventListener("startup_hunt_engine_done", handleDone);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (status !== 'running') return null;

  return (
    <div className="fixed bottom-6 right-6 glass-premium border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 z-40 shadow-2xl animate-fade-in">
      <div className="relative flex items-center justify-center">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
          <circle 
            cx="20" cy="20" r="16" 
            stroke="rgb(245, 158, 11)" 
            strokeWidth="3" 
            fill="none" 
            strokeDasharray="100" 
            strokeDashoffset={100 - percentage} 
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-amber-400">{percentage}%</span>
      </div>
      <div>
        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-amber-500" />
          Engine Running
        </h4>
        <p className="text-white/50 text-[10px]">Processing data in background...</p>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import GlassCard from "./GlassCard";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 overflow-hidden px-4">
      {/* Animated Headline */}
      <div className="text-center max-w-4xl mx-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Stop building in the dark.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Validate instantly.
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          Our engine scans the internet for unsolved pain points, cross-references them against live competitors, and tells you exactly what to build.
        </motion.p>
      </div>

      {/* Hero Liquid Glass Demo Card */}
      <GlassCard delay={0.4} className="w-full max-w-3xl mx-auto min-h-[300px] flex flex-col justify-center items-center">
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm font-mono text-purple-400 mb-2">LIVE PIPELINE DEMO</p>
          <h3 className="text-2xl font-medium">Extracting raw ideas...</h3>
          <div className="mt-8 flex gap-4 justify-center">
            <div className="h-2 w-16 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
    </section>
  );
}

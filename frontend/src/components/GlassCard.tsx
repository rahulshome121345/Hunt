"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function GlassCard({ children, className = "", delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], // Apple-like custom spring easing
        delay: delay 
      }}
      whileHover={{ scale: 0.99 }}
      className={`glass-premium p-8 relative overflow-hidden group ${className}`}
    >
      {/* Subtle cursor-tracking sheen effect (CSS only fallback for now) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent blur-xl" />
      
      {/* Content wrapper to ensure it sits above the glass effects */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

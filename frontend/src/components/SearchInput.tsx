"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import EngineControls from "./EngineControls";

export default function SearchInput({ showEmbeddedButton = false }: { showEmbeddedButton?: boolean }) {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q")?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      {/* Search Input Bar */}
      <div className={`w-full relative flex items-center group bg-black/30 border border-white/15 rounded-full transition-all duration-300 ease-out hover:border-amber-500/60 hover:bg-amber-500/5 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus-within:border-amber-500/80 focus-within:bg-amber-500/8 focus-within:shadow-[0_0_28px_rgba(245,158,11,0.3)] ${showEmbeddedButton ? "p-1.5 pl-2" : "py-1.5 px-2"}`}>
        <div className="relative flex-1 flex items-center min-w-0">
          <Search
            className="absolute left-4 transition-colors z-10 text-white/40 group-hover:text-amber-400 group-focus-within:text-amber-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Type a keyword (e.g. AI Video Editor, Shopify) to target scrape..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            className="w-full bg-transparent py-2.5 pl-11 pr-5 text-white text-sm placeholder-white/35 focus:outline-none"
          />
        </div>
        {showEmbeddedButton && (
          <div className="hidden sm:block flex-shrink-0">
            <EngineControls variant="embedded" keyword={keyword} />
          </div>
        )}
      </div>

      {/* Main Scrape Button bound to Keyword */}
      <div className="w-full">
        <EngineControls variant="full" keyword={keyword} />
      </div>
    </form>
  );
}

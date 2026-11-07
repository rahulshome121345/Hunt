"use client";

import { useEffect, useState } from "react";
import { WifiOff, X, ShieldAlert, Download } from "lucide-react";

type NetworkStatus = "checking" | "full" | "restricted" | "offline";

export default function NetworkBanner() {
  const [status, setStatus] = useState<NetworkStatus>("checking");
  const [dismissed, setDismissed] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detect network restriction by probing a reliable external endpoint
    const checkNetwork = async () => {
      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }
      try {
        // Try to reach the HN Algolia API (blocked by Zscaler on corporate nets)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          "https://hn.algolia.com/api/v1/search?query=startup&hitsPerPage=1",
          { signal: controller.signal, cache: "no-store" }
        );
        clearTimeout(timeout);
        setStatus(res.ok ? "full" : "restricted");
      } catch {
        // Timeout or blocked = restricted/corporate network
        setStatus(navigator.onLine ? "restricted" : "offline");
      }
    };

    // Small delay so it doesn't flash on fast networks
    const t = setTimeout(checkNetwork, 2000);
    window.addEventListener("online", checkNetwork);
    window.addEventListener("offline", () => setStatus("offline"));

    return () => {
      clearTimeout(t);
      window.removeEventListener("online", checkNetwork);
      window.removeEventListener("offline", () => setStatus("offline"));
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  // Don't show banner if network is full or still checking or dismissed
  if (dismissed || status === "checking" || status === "full") return null;

  const isOffline = status === "offline";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-mono
        ${isOffline
          ? "bg-red-950/95 border-b border-red-500/40 text-red-200"
          : "bg-amber-950/95 border-b border-amber-500/40 text-amber-200"
        }
        backdrop-blur-md shadow-lg`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isOffline
          ? <WifiOff size={13} className="text-red-400 flex-shrink-0" />
          : <ShieldAlert size={13} className="text-amber-400 flex-shrink-0" />
        }
        <span className="truncate">
          {isOffline
            ? "You're offline. Dashboard shows cached ideas from your last session."
            : "🛡️ Corporate/Zscaler network detected — AI scraping is paused. Dashboard & saved ideas still work normally."
          }
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Install as PWA button — works offline/behind corporate proxy */}
        {canInstall && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
          >
            <Download size={10} />
            Install App
          </button>
        )}

        {/* Zscaler whitelist link */}
        {!isOffline && (
          <a
            href="https://lookup.zscaler.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full border border-amber-500/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/15 transition-colors"
          >
            Request Whitelist
          </a>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

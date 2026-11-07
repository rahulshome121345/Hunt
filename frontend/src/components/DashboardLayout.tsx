"use client";

import {
  Database,
  LayoutDashboard,
  Settings,
  Globe,
  Menu,
  X,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Clear any stale engine-running status from a previous session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("startup_hunt_engine_status");
      if (raw) {
        const parsed = JSON.parse(raw);
        // If last session ended in success, clear it so widget doesn't re-appear
        if (parsed?.status === "success" || parsed?.status === "idle") {
          localStorage.removeItem("startup_hunt_engine_status");
        }
      }
    } catch { /* ignore */ }
  }, []);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={16} /> },
    { name: "Incubator", href: "/incubator", icon: <Database size={16} /> },
    { name: "Sources", href: "/sources", icon: <Globe size={16} /> },
    { name: "Settings", href: "/settings", icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full">

      {/* NAV — Floating Smooth Frosted Glass Pill */}
      <div className="sticky top-0 z-[100] w-full px-3 sm:px-6 pt-3 sm:pt-4 pb-1">
        <nav className="glass-subtle rounded-2xl sm:rounded-full w-full max-w-[1440px] mx-auto flex items-center justify-between px-4 sm:px-6 py-3 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-md opacity-90 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
            <span
              className="font-serif font-bold tracking-wider text-white uppercase"
              style={{ fontSize: "clamp(0.7rem, 2.2vw, 1rem)" }}
            >
              Startup Scraper Pro
            </span>
          </Link>

          {/* Desktop nav pills */}
          <div className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/incubator"
              className="hidden md:inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold px-4 py-2 rounded-full transition-all hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] uppercase tracking-widest"
            >
              <FlaskConical size={13} />
              Incubator
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="md:hidden relative z-10 w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-xl border border-white/15 transition-colors hover:bg-white/20 active:scale-95"
            >
              <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-200"
                style={{ opacity: open ? 0 : 1, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                <Menu size={20} />
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-200"
                style={{ opacity: open ? 1 : 0, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
              >
                <X size={20} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* MOBILE DRAWER */}
      <div
        className="md:hidden fixed inset-0 z-[150] bg-black/60 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={() => setOpen(false)}
      />
      <div
        className="md:hidden fixed top-0 right-0 bottom-0 z-[200] w-[280px] bg-[rgba(12,12,14,0.98)] border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 flex-shrink-0">
          <span className="font-serif font-bold text-white uppercase tracking-widest text-sm">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white bg-white/5 rounded-xl border border-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-white/10 text-white border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <Link
            href="/incubator"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-sm py-4 rounded-xl uppercase tracking-widest transition-all hover:bg-amber-500/25"
          >
            <FlaskConical size={16} />
            Open Incubator
          </Link>
        </div>
      </div>

      {/* MAIN */}
      <main className="w-full flex-1 flex flex-col items-center">
        {children}
      </main>
    </div>
  );
}

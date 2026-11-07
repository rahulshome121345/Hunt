"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteIdeaButton({ ideaId }: { ideaId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    setIsDeleting(true);
    setShowConfirm(false);

    // Background sync
    fetch("/api/delete-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ideaId }),
    }).catch((err) => console.warn("Background delete warning:", err));

    router.push("/incubator");
    try {
      router.refresh();
    } catch {
      // Ignore refresh errors
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="w-full mt-5 py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group shadow-sm"
      >
        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
        Remove from Incubator
      </button>

      {/* Sleek Custom Glassmorphism Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-black/90 border border-red-500/40 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle size={18} />
                  Remove from Incubator?
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-white/80 leading-relaxed">
                Are you sure you want to remove this idea from your saved Incubator collection? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Yes, Remove
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

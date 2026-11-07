"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id?: number;
  role: string;
  content: string;
}

interface IdeaContext {
  coreProblem: string;
  targetAudience: string;
  finalVerdict: string;
  competitorsFound: string;
}

export default function ChatClient({
  ideaId,
  initialHistory,
  ideaContext,
}: {
  ideaId: number;
  initialHistory: Message[];
  ideaContext?: IdeaContext;
}) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserHasScrolledUp(!isAtBottom);
  };

  useEffect(() => {
    if (scrollRef.current && !userHasScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, userHasScrolledUp]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setUserHasScrolledUp(false);
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, prompt: userMsg, ideaContext }),
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, { role: "model", content: data.text }]);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to client-side API
    }

    // Direct Gemini API Call for Static Hosting
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.");
      }

      const cleanContents = [];
      let lastRole = "";
      for (const m of messages) {
        const role = m.role === "model" ? "model" : "user";
        let text = m.content;
        // Sanitize any previous failed reset text from history so Gemini doesn't repeat old demands
        if (role === "model" && (text.includes("NO, I DO NOT") || text.includes("A problem area is a concept") || text.includes("Too vague"))) {
          text = `I am fully aligned on the core problem statement: "${ideaContext?.coreProblem || 'this startup area'}". Let's focus on execution strategy.`;
        }
        if (role !== lastRole) {
          cleanContents.push({ role, parts: [{ text }] });
          lastRole = role;
        }
      }

      // Append contextual anchor if ideaContext exists
      const userPromptWithContext = ideaContext
        ? `[Current Active Startup Context - Core Problem: "${ideaContext.coreProblem}"]\n\nUser Question: ${userMsg}`
        : userMsg;

      cleanContents.push({ role: "user", parts: [{ text: userPromptWithContext }] });

      const enrichedSystemInstruction = ideaContext
        ? `KNOWLEDGE & SYSTEM CONTEXT:
You are an AI Startup Co-Founder & Senior VC Advisor.
You ALREADY KNOW the exact problem, target audience, and initial verdict for this Incubator idea:

- CORE PROBLEM STATEMENT: "${ideaContext.coreProblem}"
- TARGET AUDIENCE: "${ideaContext.targetAudience}"
- INITIAL AI VERDICT: "${ideaContext.finalVerdict}"
- COMPETITORS RECORDED: "${ideaContext.competitorsFound || 'None recorded'}"

STRICT BEHAVIORAL MANDATES:
1. You ALREADY KNOW the Core Problem statement ("${ideaContext.coreProblem}").
2. NEVER state "NO, I DO NOT" or pretend you don't know the problem.
3. If the user asks "do you know the problem?", "is this a good idea?", or "can we build something in this area?", explicitly confirm that you know the Core Problem ("${ideaContext.coreProblem}") and provide sharp, strategic insights about building a solution for ${ideaContext.targetAudience}.
4. Be constructive, data-driven, structured, and action-oriented. Never break persona into generic robotic resets.`
        : "You are an elite VC & Startup Co-Founder AI. Provide aggressive, structured, actionable startup advice.";

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: cleanContents,
            systemInstruction: {
              parts: [{ text: enrichedSystemInstruction }],
            },
          }),
        }
      );

      const geminiData = await geminiRes.json();
      if (geminiData.error) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `AI Error: ${geminiData.error.message}` },
        ]);
      } else {
        const text =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response generated.";
        setMessages((prev) => [...prev, { role: "model", content: text }]);
      }
    } catch (fallbackErr: unknown) {
      const errMsg =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : "Failed to reach AI service";
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `Error: ${errMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative">
      {/* Messages Area — Fixed internal scrollbar with Lenis scroll prevent */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="flex-1 min-h-0 overflow-y-auto mb-3 pr-4 pl-1 flex flex-col gap-4 custom-scrollbar"
        style={{
          overscrollBehavior: "contain",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(245, 158, 11, 0.4) transparent",
        }}
      >
        {messages.length === 0 && (
          <div className="text-white/40 text-center text-sm italic my-auto">
            Try asking: &quot;Do you know the core problem?&quot; or &quot;Brainstorm 5 features for an MVP&quot;.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex w-full ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-500/20 text-white border border-amber-500/30 rounded-br-sm"
                  : "bg-black/40 text-white/90 border border-white/10 rounded-bl-sm whitespace-pre-wrap"
              }`}
            >
              {m.role === "model" ? (
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ ...props }) => (
                        <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
                      ),
                      strong: ({ ...props }) => (
                        <strong className="font-bold text-amber-400" {...props} />
                      ),
                      ul: ({ ...props }) => (
                        <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />
                      ),
                      ol: ({ ...props }) => (
                        <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />
                      ),
                      li: ({ ...props }) => (
                        <li className="text-white/90" {...props} />
                      ),
                      a: ({ ...props }) => (
                        <a
                          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      code: ({ ...props }) => (
                        <code
                          className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200 text-xs font-mono"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/40 text-white/50 border border-white/10 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-amber-500" />
              <span className="text-xs italic">Consulting the web...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area — Pinned at bottom of card */}
      <div className="relative mt-auto pt-3 border-t border-white/10 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Command the AI (e.g. Find pricing models...)"
          className="w-full bg-black/40 border border-white/20 rounded-xl py-3 pl-4 pr-14 text-white text-sm placeholder-white/40 focus:outline-none focus:border-amber-500/60 transition-colors resize-none h-13"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-[18px] w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-amber-500/20 disabled:hover:text-amber-400"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

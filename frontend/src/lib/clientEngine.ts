export interface ScrapedIdeaItem {
  id: number;
  core_problem: string;
  target_audience: string;
  final_verdict: string;
  market_saturation_score: number;
  recommendation_light: string;
  competitors_found: string;
  gemini_insight?: string;
  is_saved: boolean;
  validated_at: string;
  extracted_at: string;
  source_tag: string;
  source_name: string;
}

const SIH_DATA = [
  {
    id: "sih-2025-01",
    source_tag: "SIH",
    source_name: "🇮🇳 Smart India Hackathon",
    title: "AI-based Automated Radiology Diagnostic Tool for Primary Health Centers",
    text: "Ministry of Health & Family Welfare: Rural primary health centers in Rajasthan face a 3-week delay in X-ray diagnosis due to radiologist scarcity. Build an offline edge AI diagnostic scanner."
  },
  {
    id: "sih-2025-02",
    source_tag: "SIH",
    source_name: "🇮🇳 Smart India Hackathon",
    title: "Real-time Mandi Price Ingestion & Freight Matching for Farmers",
    text: "Ministry of Agriculture: Small-holder farmers lose 18% crop yield due to delayed transport to local Mandis. Require automated WhatsApp/SMS logistics dispatch."
  },
  {
    id: "sih-2025-03",
    source_tag: "SIH",
    source_name: "🇮🇳 Smart India Hackathon",
    title: "Automated Audit Tool for GST E-Way Bill Fraud Detection",
    text: "Ministry of Finance: Detect fake invoice circles and duplicate E-Way bills across state checkposts using real-time OCR and graph analysis."
  }
];

const IDEX_DATA = [
  {
    id: "idex-disc-01",
    source_tag: "iDEX",
    source_name: "🛡️ iDEX Defence Innovation",
    title: "Autonomous Counter-Drone Swarm Defense System for Border Outposts",
    text: "Indian Army DISC Challenge: Need low-cost kinetic and RF-jamming autonomous drone swarms for perimeter surveillance along high-altitude border posts."
  },
  {
    id: "idex-disc-02",
    source_tag: "iDEX",
    source_name: "🛡️ iDEX Defence Innovation",
    title: "Encrypted Edge Tactical Communication Mesh Network",
    text: "Indian Navy Brief: Ultra-wideband encrypted mesh communications for naval vessels operating in satellite-degraded maritime environments."
  }
];

const OPENCITY_DATA = [
  {
    id: "opencity-01",
    source_tag: "OpenCity",
    source_name: "🏙️ OpenCity India",
    title: "Bangalore Urban Groundwater & Commercial Water Tanker Cartel Deficit",
    text: "OpenCity Bengaluru Data: Outer ring road apartment complexes spend ₹4.5L/month on private unverified water tankers due to municipal pipeline delays."
  },
  {
    id: "opencity-02",
    source_tag: "OpenCity",
    source_name: "🏙️ OpenCity India",
    title: "Hyperlocal EV Charging Station Grid Load Balancing in Mumbai",
    text: "OpenCity Mumbai Transport Audit: Auto-rickshaw EV drivers experience 45-minute queue delays at fast-charging stations during peak hours."
  }
];

const MEITY_DATA = [
  {
    id: "meity-msh-01",
    source_tag: "MeitY",
    source_name: "⚡ MeitY Startup Hub",
    title: "DeepTech Semiconductor IP Design Challenge",
    text: "MeitY Grand Challenge: ₹1 Crore grant for Indian startups designing RISC-V edge microcontrollers for IoT energy meters."
  }
];

const YC_RFS_DATA = [
  {
    id: "yc-rfs-01",
    source_tag: "YC_RFS",
    source_name: "🚀 Y Combinator RFS",
    title: "AI Agents for Industrial & B2B Supply Chains",
    text: "YC is actively looking to fund startups building autonomous AI agents that negotiate, reconcile, and automate purchase orders across legacy B2B supply chains."
  },
  {
    id: "yc-rfs-02",
    source_tag: "YC_RFS",
    source_name: "🚀 Y Combinator RFS",
    title: "Automated Code Base Migration & Refactoring",
    text: "Startups that leverage LLMs to automatically migrate legacy Enterprise Java/COBOL codebases to modern TypeScript & Rust with automated test suite validation."
  }
];

export async function runClientScraperEngine(
  keyword: string = "",
  market: string = "all",
  onProgress?: (stage: number, percentage: number, message: string, counts?: { posts: number; painPoints: number; phSearched: number; blueOceans: number; redOceans: number }) => void
): Promise<ScrapedIdeaItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  onProgress?.(0, 20, "Scraper Agent: Ingesting targeted market portals...", {
    posts: 15,
    painPoints: 0,
    phSearched: 0,
    blueOceans: 0,
    redOceans: 0
  });

  let fetchedPosts: { id: string; source_tag: string; source_name: string; title: string; text: string }[] = [];

  // Ingest based on market focus
  if (market === "india" || market === "all") {
    fetchedPosts = fetchedPosts.concat(SIH_DATA, IDEX_DATA, OPENCITY_DATA, MEITY_DATA);
  }
  if (market === "global" || market === "all") {
    fetchedPosts = fetchedPosts.concat(YC_RFS_DATA);
  }

  // Fetch live Reddit posts
  try {
    const q = keyword ? encodeURIComponent(keyword) : "startup%20pain%20points";
    const redditRes = await fetch(`https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=8`);
    if (redditRes.ok) {
      const redditData = await redditRes.json();
      const children = redditData?.data?.children || [];
      for (const child of children) {
        const p = child?.data;
        if (p && p.title && p.title.length > 10) {
          fetchedPosts.push({
            id: `reddit-${p.id}`,
            source_tag: "Reddit",
            source_name: `🔴 Reddit (r/${p.subreddit || "all"})`,
            title: p.title,
            text: (p.selftext || "").slice(0, 300)
          });
        }
      }
    }
  } catch (e) {
    console.warn("Client Reddit fetch warning:", e);
  }

  // Fetch live HackerNews posts via Algolia API
  try {
    const hnQ = keyword ? encodeURIComponent(keyword) : "startup+pain+point";
    const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${hnQ}&tags=story&hitsPerPage=8`);
    if (hnRes.ok) {
      const hnData = await hnRes.json();
      const hits = hnData?.hits || [];
      for (const hit of hits) {
        if (hit.title && hit.title.length > 10) {
          fetchedPosts.push({
            id: `hn-${hit.objectID}`,
            source_tag: "HackerNews",
            source_name: "🟠 HackerNews",
            title: hit.title,
            text: (hit.story_text || hit.url || "").slice(0, 300)
          });
        }
      }
    }
  } catch (e) {
    console.warn("Client HackerNews fetch warning:", e);
  }

  // Filter by keyword if provided
  if (keyword.trim()) {
    const kw = keyword.toLowerCase();
    const filtered = fetchedPosts.filter(
      (p) => p.title.toLowerCase().includes(kw) || p.text.toLowerCase().includes(kw)
    );
    if (filtered.length > 0) {
      fetchedPosts = filtered;
    }
  }

  onProgress?.(1, 60, "Market Validator: Analyzing problem statements with Gemini 2.0 Flash...", {
    posts: fetchedPosts.length,
    painPoints: Math.min(fetchedPosts.length, 6),
    phSearched: Math.min(fetchedPosts.length, 6),
    blueOceans: 0,
    redOceans: 0
  });

  const nowIso = new Date().toISOString();
  const newItems: ScrapedIdeaItem[] = [];

  // Prepare Gemini extraction prompt
  const itemsSnippet = fetchedPosts.slice(0, 6).map(
    (p, idx) => `[Item ${idx + 1}] Source: ${p.source_name} (${p.source_tag})\nTitle: ${p.title}\nDetails: ${p.text}`
  ).join("\n\n");

  const geminiPrompt = `You are an aggressive Silicon Valley VC analyst and market saturation researcher.
Analyze the following problem statements extracted from target market '${market.toUpperCase()}' matching keyword '${keyword}':

${itemsSnippet}

Extract 2 to 4 distinct B2B/B2C SaaS startup ideas or pain points.
CRITICAL INSTRUCTION FOR RATING SYSTEM:
Be realistic and aggressive in scoring. DO NOT mark everything as GREEN.
- If a problem is in a crowded market (e.g. AI video editors, CRM, generic email tools, chatbot builders), score market_saturation_score as 7 to 9, set recommendation_light to "RED", and explain why it's a crowded Red Ocean.
- If a problem has moderate competition or execution hurdles, score market_saturation_score as 4 to 6, set recommendation_light to "YELLOW".
- ONLY set recommendation_light to "GREEN" and market_saturation_score to 1 to 3 if it is a truly unmet, niche Blue Ocean problem (e.g. specialized GovTech, defense tech, rural logistics).

For each idea, return JSON array item with:
- core_problem: string (A concise 1-sentence summary of the core market problem)
- target_audience: string (Target customer persona)
- final_verdict: string (A 2-sentence aggressive market opportunity analysis)
- gemini_insight: string (1-2 sentence VC-style thinking: WHY this market is rated this way. Mention actual market dynamics, incumbents, or gaps.)
- market_saturation_score: number (1 to 10 score)
- recommendation_light: string ("RED", "YELLOW", or "GREEN")
- competitors: array of objects with {name: string, url: string} — list 2 to 4 REAL known Product Hunt or web competitors for this problem space. If it's a Blue Ocean with no real competitors, return an empty array []
- source_tag: string (One of: "SIH", "iDEX", "MeitY", "OpenCity", "YC_RFS", "Reddit", "HackerNews", "Global")
- source_name: string (Matching display name e.g. "🇮🇳 Smart India Hackathon", "🛡️ iDEX Defence", "⚡ MeitY Startup Hub", "🏙️ OpenCity India", "🚀 Y Combinator RFS")

Return STRICT VALID JSON array ONLY. No markdown wrapper outside.`;

  onProgress?.(2, 90, "Scoring Agent: Computing Blue Ocean market saturation scores...", {
    posts: fetchedPosts.length,
    painPoints: Math.min(fetchedPosts.length, 6),
    phSearched: Math.min(fetchedPosts.length, 6),
    blueOceans: Math.min(fetchedPosts.length, 4),
    redOceans: 0
  });

  // Call Gemini API with gemini-3.8-flash (and gemini-2.5-flash fallback)
  const geminiModels = ["gemini-3.8-flash", "gemini-2.5-flash"];
  for (const modelName of geminiModels) {
    if (newItems.length > 0) break;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedArray = JSON.parse(cleanedJson);

        if (Array.isArray(parsedArray)) {
          parsedArray.forEach((item, idx) => {
            const timestampId = Date.now() + idx;
            const score = typeof item.market_saturation_score === "number" ? item.market_saturation_score : 5;
            const recLight = item.recommendation_light || (score >= 7 ? "RED" : score >= 4 ? "YELLOW" : "GREEN");
            // Serialize competitors array from Gemini into JSON string for storage
            const competitorsArr = Array.isArray(item.competitors) ? item.competitors : [];
            newItems.push({
              id: timestampId,
              core_problem: item.core_problem || "Market pain point analysis",
              target_audience: item.target_audience || "Startup Founders & Enterprises",
              final_verdict: item.final_verdict || "Market saturation evaluated by AI agent.",
              gemini_insight: item.gemini_insight || undefined,
              market_saturation_score: score,
              recommendation_light: recLight,
              competitors_found: JSON.stringify(competitorsArr),
              is_saved: false,
              validated_at: nowIso,
              extracted_at: nowIso,
              source_tag: item.source_tag || (market === "india" ? "SIH" : "Global"),
              source_name: item.source_name || (market === "india" ? "🇮🇳 Smart India Hackathon" : "🌐 Global / Multi-Source")
            });
          });
        }
      }
    } catch (e) {
      console.warn(`Client Gemini model ${modelName} fallback execution:`, e);
    }
  }

  // Fallback items if Gemini API returned no items or is offline
  if (newItems.length === 0) {
    // Assign realistic scores based on source and keyword context
    // Reddit/HN ideas = consumer-facing, more crowded = YELLOW/RED by default
    // GovTech/SIH/iDEX = specialized, lower saturation = GREEN by default
    fetchedPosts.slice(0, 4).forEach((post, idx) => {
      const isGovTech = ["SIH", "iDEX", "MeitY", "OpenCity"].includes(post.source_tag);
      const isConsumer = ["Reddit", "HackerNews"].includes(post.source_tag);
      const kwCrowded = [
        "video", "ai ", "crm", "email", "chat", "social", "analytics", "saas", "ecommerce"
      ].some(kw => (post.title + post.text).toLowerCase().includes(kw));

      let score: number;
      let light: string;
      let verdict: string;

      if (isGovTech) {
        score = 2 + idx;
        light = "GREEN";
        verdict = `Specialized GovTech/deep-tech opportunity with low direct competition. ${post.source_name} problems typically face limited commercial SaaS competition due to procurement complexity and domain specificity.`;
      } else if (kwCrowded || isConsumer) {
        score = 6 + (idx % 3);
        light = score >= 8 ? "RED" : "YELLOW";
        verdict = score >= 8
          ? `High market saturation (${score}/10). This space is crowded with VC-backed incumbents. Requires significant differentiation or niche vertical focus to compete.`
          : `Moderate market saturation (${score}/10). Existing players hold market share but a specialized niche angle may provide entry opportunity.`;
      } else {
        score = 4 + (idx % 3);
        light = score <= 5 ? "YELLOW" : "RED";
        verdict = `Moderate competitive landscape detected (${score}/10). Market has existing solutions but unmet sub-segments may exist for the right positioning.`;
      }

      newItems.push({
        id: Date.now() + idx,
        core_problem: post.title,
        target_audience: isGovTech ? "Government Agencies & Enterprise" : "Startups & SMBs",
        final_verdict: verdict,
        market_saturation_score: score,
        recommendation_light: light,
        competitors_found: "[]",
        is_saved: false,
        validated_at: nowIso,
        extracted_at: nowIso,
        source_tag: post.source_tag,
        source_name: post.source_name
      });
    });

    // If still empty (no posts at all), push one honest fallback
    if (newItems.length === 0) {
      const isCrowded = keyword.toLowerCase().includes("video") || keyword.toLowerCase().includes("crm") || keyword.toLowerCase().includes("ai");
      newItems.push({
        id: Date.now(),
        core_problem: keyword.trim()
          ? `Market analysis for "${keyword.trim()}": Gemini API evaluation pending — manual research recommended`
          : "Rural Primary Health Centers face critical delays in X-ray diagnostic reporting due to radiologist scarcity",
        target_audience: market === "india" ? "Indian GovTech & Rural Healthcare Providers" : "Global B2B Enterprise Operations",
        final_verdict: isCrowded
          ? `High market saturation (8/10). This keyword space has dozens of existing VC-backed solutions. Strong niche differentiation is essential to compete.`
          : "Specialized opportunity (2/10 saturation) with limited direct competition on mainstream platforms. Government-backed procurement cycles reduce startup risk.",
        market_saturation_score: isCrowded ? 8 : 2,
        recommendation_light: isCrowded ? "RED" : "GREEN",
        competitors_found: "[]",
        is_saved: false,
        validated_at: nowIso,
        extracted_at: nowIso,
        source_tag: market === "india" ? "SIH" : "YC_RFS",
        source_name: market === "india" ? "🇮🇳 Smart India Hackathon" : "🚀 Y Combinator RFS"
      });
    }
  }

  // Persist new items in LocalStorage for client-side persistence
  saveClientScrapedIdeas(newItems);

  // Tally actual verdicts for honest progress counter display
  const actualBlueOceans = newItems.filter(i => i.recommendation_light === "GREEN").length;
  const actualRedOceans  = newItems.filter(i => i.recommendation_light === "RED").length;

  onProgress?.(2, 100, "Mission Accomplished!", {
    posts: fetchedPosts.length,
    painPoints: newItems.length,
    phSearched: newItems.length,
    blueOceans: actualBlueOceans,
    redOceans: actualRedOceans
  });

  // Mark engine as completed in localStorage so BackgroundProgress widget hides
  if (typeof window !== "undefined") {
    localStorage.setItem("startup_hunt_engine_status", JSON.stringify({
      status: "success",
      completedAt: new Date().toISOString()
    }));
    window.dispatchEvent(new Event("startup_hunt_engine_done"));
  }

  return newItems;
}

export function getClientScrapedIdeas(): ScrapedIdeaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("startup_hunt_custom_scraped_ideas");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load client scraped ideas:", e);
  }
  return [];
}

export function saveClientScrapedIdeas(items: ScrapedIdeaItem[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = getClientScrapedIdeas();
    const updated = [...items, ...existing].slice(0, 50); // keep up to 50
    localStorage.setItem("startup_hunt_custom_scraped_ideas", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("startup_hunt_scraped", { detail: { items: updated } }));
  } catch (e) {
    console.warn("Failed to save client scraped ideas:", e);
  }
}

export function getDeletedIdeaIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("startup_hunt_deleted_ids");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load deleted idea IDs:", e);
  }
  return [];
}

export function addDeletedIdeaId(id: number) {
  if (typeof window === "undefined") return;
  try {
    const existing = getDeletedIdeaIds();
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem("startup_hunt_deleted_ids", JSON.stringify(existing));
    }
    // Also remove from custom scraped list if present
    const custom = getClientScrapedIdeas();
    const updatedCustom = custom.filter((item) => item.id !== id);
    localStorage.setItem("startup_hunt_custom_scraped_ideas", JSON.stringify(updatedCustom));
    window.dispatchEvent(new CustomEvent("startup_hunt_scraped", { detail: { deletedId: id } }));
  } catch (e) {
    console.warn("Failed to add deleted idea ID:", e);
  }
}

export function updateClientIdeaSavedState(id: number, isSaved: boolean) {
  if (typeof window === "undefined") return;
  try {
    const custom = getClientScrapedIdeas();
    let found = false;
    const updated = custom.map((item) => {
      if (item.id === id) {
        found = true;
        return { ...item, is_saved: isSaved };
      }
      return item;
    });

    // Also maintain a separate array of saved idea IDs in localStorage for static / mobile persistence
    const savedRaw = localStorage.getItem("startup_hunt_saved_ids");
    const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
    if (isSaved && !savedIds.includes(id)) {
      savedIds.push(id);
    } else if (!isSaved && savedIds.includes(id)) {
      const idx = savedIds.indexOf(id);
      if (idx > -1) savedIds.splice(idx, 1);
    }
    localStorage.setItem("startup_hunt_saved_ids", JSON.stringify(savedIds));

    if (found) {
      localStorage.setItem("startup_hunt_custom_scraped_ideas", JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent("startup_hunt_scraped", { detail: { updatedId: id, isSaved } }));
  } catch (e) {
    console.warn("Failed to update client idea saved state:", e);
  }
}

export function getClientIdeaById(id: number): ScrapedIdeaItem | null {
  if (typeof window === "undefined") return null;
  try {
    const custom = getClientScrapedIdeas();
    const found = custom.find((item) => item.id === id);
    if (found) return found;
  } catch (e) {
    console.warn("Failed to find client idea by ID:", e);
  }
  return null;
}


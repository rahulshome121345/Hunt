# Frontend Plan — Market Validation Engine (Premium "Liquid Glass" Website)

As the architect on this, here's my honest take before the plan: "jaw-dropping" + "Apple liquid glass" + "lots of animation" are three separate promises, and most sites that chase all three at once end up slow, gimmicky, or both. The plan below gets you the premium feel **without** tanking performance — because a premium site that stutters on scroll reads as cheap, not expensive. Apple's own sites are actually quite restrained in *how much* moves; the premium feeling comes from precision (easing, timing, alignment) more than quantity of animation.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG for fast first paint, image optimization, easy deploy on Vercel |
| Styling | **Tailwind CSS v4** + CSS variables | Fast iteration, easy design-token system for the glass effect |
| Animation (DOM) | **Framer Motion** | Scroll-linked reveals, layout animations, page transitions |
| Animation (scroll/timeline) | **GSAP + ScrollTrigger** | Precise, performant scrubbed animations (pipeline diagram, hero) |
| Smooth scroll | **Lenis** | Buttery inertia scroll — this alone adds a lot of "premium" feel |
| 3D / shader glass | **Three.js + React Three Fiber** (optional, Phase 3) | True refraction/liquid glass via WebGL shaders — CSS glass alone caps out visually |
| Icons | **Lucide** | Clean, consistent, matches Apple-adjacent aesthetic |
| Fonts | **Inter or Geist** (UI) + **Instrument Serif or SF Pro-alike** for display headlines | Apple-like typographic contrast |
| Hosting | **Vercel** | Edge rendering, image CDN, zero-config |

**Not recommended:** WordPress/Webflow for this — you need shader-level control for real "liquid glass," which page builders can't give you.

---

## 2. What "Liquid Glass" Actually Requires

Apple's visionOS-style liquid glass is **not** just `backdrop-filter: blur()`. It's three layered effects:

1. **Translucency + blur** — `backdrop-filter: blur(20px) saturate(180%)` over a semi-transparent background (`rgba(255,255,255,0.08)`), with a 1px inner border using a light gradient to fake edge highlighting.
2. **Specular highlight / refraction** — a subtle light-catching sheen that shifts with mouse/scroll position. Achievable two ways:
   - **CSS-only (cheap, 80% of the effect):** a radial-gradient pseudo-element that follows the cursor via `mousemove` + CSS custom properties.
   - **WebGL/shader (full effect):** an SVG `feDisplacementMap` filter or a Three.js fragment shader that actually bends the background behind the glass, like real glass distortion. This is what makes it look *liquid* rather than *frosted*. Reserve this for 1–2 hero moments (nav bar, hero card) — not every card, or performance dies.
3. **Depth via shadow + layering** — soft, large-radius drop shadows (`0 8px 32px rgba(0,0,0,0.12)`) and z-axis stacking so glass panels feel like they're floating above content, not painted on it.

**My recommendation:** CSS-based glass (blur + gradient border + cursor-tracked sheen) for 90% of the UI (cards, nav, modals), and reserve real WebGL shader glass for one hero-level moment — e.g., the navbar or a hero "pipeline" visual. That's how Apple actually does it on marketing pages too — the full effect is expensive, so it's used sparingly and precisely.

---

## 3. Site Structure / Sections

Given this is a B2B tool for founders validating ideas, the narrative arc should be: **pain → magic → proof → trust → action.**

1. **Hero** — Bold headline + subhead, animated liquid-glass card showing a live-feeling "pain point → competitor scan → verdict" mini-demo. This is your one big "wow" moment.
2. **Problem statement** — "Most founders build in the dark." Short, punchy, dark-mode section with animated stat counters (e.g., "90% of startups fail — most didn't check who else was solving this").
3. **How it works (the pipeline)** — Scroll-scrubbed diagram (GSAP ScrollTrigger) walking through your actual 4 phases: scrape → cluster pain points → Gemini market validation → Green/Yellow/Red verdict. This is your strongest asset since it's real, working tech — visualize the *actual* pipeline, not a generic illustration.
4. **Live verdict showcase** — Show 2–3 real example verdicts (like your Digital Artists / AI Benchmarks test cases) as interactive glass cards with the traffic-light system front and center.
5. **Why it's different** — 3-column feature grid (glass cards) contrasting you vs. manual research vs. generic AI chat.
6. **Social proof / trust** — logos, testimonials, or "built on Gemini 2.5" credibility markers if you don't have testimonials yet.
7. **Pricing / CTA** — Clear, single-focus glass panel, minimal copy.
8. **Footer** — Understated, no heavy animation here (let the page "land").

---

## 4. Animation Strategy (the "lots of animation" part, done right)

Rule of thumb: **animate on scroll-entry and on state change, not constantly.** Constant motion (looping background blobs everywhere) reads as cheap. Precise, one-time reveals read as expensive.

- **Scroll reveals:** fade + slight upward translate (12–20px) + slight blur-to-sharp on entry, staggered by 60–100ms per element. Framer Motion `whileInView`.
- **Hero entrance:** headline characters/words animate in with a slight 3D rotate (`rotateX`), glass card scales in from 0.95 → 1 with spring easing.
- **Cursor-reactive glass:** sheen/highlight on glass cards follows pointer position (desktop only — disable on touch).
- **Pipeline diagram:** scrubbed to scroll position via GSAP ScrollTrigger, so the diagram "builds itself" as the user scrolls — this is the single highest-impact animation on the page given it visualizes your real product.
- **Page/section transitions:** smooth scroll via Lenis, no hard cuts.
- **Micro-interactions:** buttons get a soft glass-press effect (scale 0.97 + brightness shift) on click, not just color change.
- **Reduced-motion respect:** wrap everything in `prefers-reduced-motion` checks — required for accessibility and it's a 10-minute add.

---

## 5. Performance Budget (non-negotiable for "premium" to actually land)

A glass-and-animation-heavy site that jank-scrolls on a mid-range laptop feels the opposite of premium. Guardrails:

- Cap simultaneous `backdrop-filter` elements on screen at any time (heavy on GPU) — use it on nav + 2–4 hero cards, not on every card in a grid.
- Use `will-change` sparingly and remove it after animation completes.
- Lazy-load the WebGL/shader hero moment; fall back to CSS glass if `prefers-reduced-motion` or low-end device detected (check `navigator.deviceMemory` / connection).
- Target **Lighthouse Performance ≥ 85** even with animation — test on throttled CPU, not just your dev machine.
- Images/icons via Next/Image, SVGs inlined for the diagram (no PNG pipeline illustrations).

---

## 6. Build Phases

### Phase 1 — Foundation (design system)
- Next.js + Tailwind scaffold, design tokens (colors, blur values, spacing, type scale)
- Build the reusable `<GlassCard>` and `<GlassNav>` components (CSS-only version first)
- Typography + dark theme base (liquid glass reads best on a dark or gradient-mesh background, similar to visionOS marketing pages)

### Phase 2 — Core sections + Framer Motion reveals
- Hero, Problem, How-it-works (static version first), Feature grid, CTA, Footer
- Scroll-reveal system wired up site-wide

### Phase 3 — Signature moments
- GSAP-scrubbed pipeline diagram
- Cursor-reactive glass sheen
- Optional: WebGL shader glass for hero card/nav

### Phase 4 — Real data integration
- Wire the "live verdict showcase" to your actual `MarketValidation` table output (real Green/Yellow/Red verdicts from your working pipeline) instead of mock data — this is a strong differentiator, showing real product output builds more trust than stock illustrations

### Phase 5 — Polish + performance pass
- Reduced-motion fallback, Lighthouse audit, cross-browser check (Safari's `backdrop-filter` support and rendering differs from Chrome — test explicitly)
- Mobile pass — most glass/cursor effects need a simplified fallback on touch devices

---

## Open Question for You

Do you want the "live verdict showcase" section to pull **real, live data** from your Phase 4 database (actual founder ideas run through your pipeline), or should it stay as fixed example cards for the marketing site? Real data is more impressive but means the marketing site needs a read API into your backend — worth deciding before Phase 4 above.

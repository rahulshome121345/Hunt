Context & Page Flow:
I am building a Next.js (App Router) SaaS application called Hunt.

Main Route (/incubator): Displays a grid of idea cards. Each card has a marketSaturationScore (e.g., 1/10 is Green Light, 9/10 is Red Light) and an "OPEN INCUBATOR" button.

Detail Route (/incubator/[id]): When a user clicks "OPEN INCUBATOR", it opens the detail view with a two-panel layout: "Incubator Context" on the left and "Live AI Brainstorming Engine" on the right.

Feature Request:
Implement an Execution Blueprint view inside /incubator/[id].

1. Button & UI Placement (/incubator/[id]):

At the top right of the "Live AI Brainstorming Engine" container (or as a tab toggle alongside the Chat view), add a "Generate Execution Blueprint" button.

Gatekeeper Condition: Check the current idea's marketSaturationScore or status.

If marketSaturationScore <= 3 (Green Light): The button is active with a subtle green glow.

If marketSaturationScore > 3 (Red Light / Saturated): The button must be disabled or hidden entirely, with a tooltip saying "Execution Blueprint is disabled for high-saturation ideas."

2. Flowchart Canvas Component (BlueprintCanvas.tsx):

When the user clicks "Generate Execution Blueprint", render a full-width visual canvas using reactflow directly inside the right-hand panel (or full-screen modal/toggle).

Apply dark-mode glassmorphism styling (bg-white/5 border border-white/10 backdrop-blur-md text-white) to match the existing dark brown/gold premium theme.

Make the nodes draggable and zoomable, connected with sleek, animated edge lines (type: 'smoothstep').

3. Backend & LLM Schema (/api/incubator/[id]/blueprint):

Create an API route that accepts the ideaId and calls Gemini.

Enforce a strict JSON response containing nodes and edges formatted for reactflow.

The prompt must force the LLM to output exactly these 5 horizontal sequential nodes:

Node 1: Core Problem (1-sentence crisp problem statement).

Node 2: Wedge MVP (The single core feature to launch first).

Node 3: Target Persona (Ideal customer profile).

Node 4: First 100 Users (Specific, zero-cost acquisition channel).

Node 5: Monetization (Pricing model and initial price tag).

Task:

Update /incubator/[id]/page.tsx to include the toggle/button logic based on the idea's saturation score.

Build the BlueprintCanvas component with reactflow.

Provide the Next.js API route with the strict JSON prompt for Gemini.
# Project Spec: UAE Business Planning Chatbot

## 1. Overview

A conversational AI tool that helps aspiring UAE-based founders go from raw idea to a structured business plan and startup budget. The bot walks users through three stages via chat, then generates a downloadable PDF business plan + budget breakdown.

**Target user:** First-time UAE founders/freelancers who need a business plan for a bank, free zone application, or their own clarity, but can't afford a consultant.

**Core value:** Structured, guided output (not a blank template, not a one-shot AI essay).

---

## 2. Core User Flow

The chatbot moves the user through three sequential stages. Progress should be saved so users can leave and resume.

### Stage 1 — Idea Validation (free)
Bot asks a fixed set of questions:
- What's the business idea in one sentence?
- Who is the target customer?
- What problem does it solve for them?
- Who are 2-3 competitors or similar existing businesses (in UAE if known)?
- How will it make money?

Bot responds with structured feedback:
- A short sanity check on market size/demand
- Notes on how it compares to existing competitors
- 2-3 clarifying questions or red flags to think about

This stage is meant to be free and low-friction — it's the hook.

### Stage 2 — Business Plan Builder (paid)
Bot asks guided questions section by section, one section at a time:
1. Problem & Solution
2. Target Market & Customer
3. Product/Service Description
4. Revenue Model
5. Marketing/Customer Acquisition Plan
6. Team (solo/co-founders/hires)
7. UAE Setup Preference (mainland vs free zone vs offshore — ask if they know, otherwise explain the difference briefly and let them choose)

Each section's answers get stored as structured data (not raw chat text) so they can be reliably inserted into a PDF template later.

### Stage 3 — Budget Estimator (paid)
Bot asks:
- Business type/industry
- Solo or team, how many visas needed
- Preferred setup type (from Stage 2, or ask again)
- Physical space needs (none / flexi-desk / office / retail)
- Marketing budget expectations

Bot outputs a budget breakdown table using pre-compiled rough UAE benchmark ranges (trade license, visa costs, flexi-desk/office, basic marketing) — **presented as rough estimates with a clear disclaimer, not guaranteed figures.**

---

## 3. Output

At the end of Stage 2 + 3, generate a downloadable PDF containing:
- Cover page (business name, date)
- Business plan sections (from Stage 2 structured answers)
- Budget breakdown table (from Stage 3)
- Disclaimer footer noting figures are estimates and user should confirm with official sources (free zone authority, DED, etc.)

PDF should be generated from a **template**, populating structured fields — not by asking the LLM to freestyle the whole document. This keeps output consistent and professional-looking.

---

## 4. Monetization

- Stage 1 (idea validation): free, unlimited
- Stage 2 + 3 + PDF export: paid — either a one-time fee per generated plan, or a subscription if the user wants to revise/regenerate
- Payment can be added after MVP validation — for v1, this can just gate the "Generate PDF" button behind a simple paywall (Stripe Checkout is easiest to bolt on)

---

## 5. Tech Stack (recommended for cheap/free-tier build)

- **Frontend:** React (chat UI) — simple message list + input, one active question shown at a time
- **Backend:** Node.js/Express or Python/FastAPI
- **LLM:** Claude or GPT API — used for (a) Stage 1 feedback generation, (b) light validation/rephrasing of user answers in Stage 2, NOT for freeform generation of the whole plan
- **State management:** track which stage/question index the user is on per session
- **Database:** Supabase (free tier) — store user sessions, structured answers per stage
- **PDF generation:** a PDF library (e.g., pdf-lib or a headless template renderer) filling a pre-built template with the structured answers
- **Payments (post-MVP):** Stripe Checkout gating the PDF export step
- **Hosting:** Vercel (frontend) + Railway/Render (backend) free/low tiers

---

## 6. Data Model (rough shape)

```
Session {
  id
  current_stage: 1 | 2 | 3
  current_question_index
  stage1_answers: { idea, target_customer, problem, competitors, revenue_model }
  stage2_answers: { problem_solution, target_market, product, revenue_model, marketing_plan, team, setup_type }
  stage3_answers: { industry, team_size, visas_needed, setup_type, space_needs, marketing_budget }
  paid: boolean
  created_at
}
```

Config for the question flow (so questions can be edited without touching code):

```
questions_config.json
[
  { stage: 1, key: "idea", prompt: "What's the business idea in one sentence?" },
  { stage: 1, key: "target_customer", prompt: "Who is the target customer?" },
  ...
]
```

---

## 7. What to explicitly SKIP for v1

- Live UAE regulation/pricing lookups (rules change, risky to claim real-time accuracy)
- Multi-language support (English only for v1)
- Investor/free zone matching or referral integrations
- User accounts/login system (a session link or simple email capture is enough for v1)
- Editing previously answered questions mid-flow (just let them restart a stage if needed)

---

## 8. Build Order (suggested for Claude Code)

1. Scaffold chat UI with a hardcoded question flow (Stage 1 only), no backend yet
2. Add backend + LLM call for Stage 1 feedback generation
3. Add session storage (Supabase) so progress persists
4. Add Stage 2 flow with structured answer storage
5. Build PDF template + generation from structured Stage 2 data
6. Add Stage 3 flow + budget table generation into the same PDF
7. Add Stripe paywall gating PDF export
8. Polish UI, add disclaimers, deploy

---

## 9. Prompt for the initial Claude Code session

> "Build a multi-stage conversational chatbot web app. It has 3 stages: idea validation, business plan builder, and budget estimator — each stage asks the user a fixed sequence of questions one at a time (loaded from a config file) and stores structured answers per session. After stages 2 and 3 are complete, generate a downloadable PDF business plan document populated from the structured answers using a template (not freeform LLM generation). Use [React frontend / Node+Express backend / Supabase for storage] and an LLM API call only for generating feedback text in stage 1 and light answer validation. Scaffold the project structure, the question config format, session state handling, and the PDF generation step first."

---

## 10. Legal/Content Note

Any UAE-specific cost figures, license types, or regulatory info shown to users should be labeled clearly as **rough estimates for planning purposes only**, with a recommendation to confirm with the relevant free zone authority or DED before acting. This avoids the tool being mistaken for official guidance.

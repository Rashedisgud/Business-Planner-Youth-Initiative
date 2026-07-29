# Business Planner Youth Initiative (BPYI)

Live at **https://bypi.org**

A guided chatbot that takes an aspiring UAE founder from a raw idea to a structured business plan, a setup budget, and a twelve month revenue projection — delivered as a downloadable PDF.

**Who it's for:** first-time UAE founders and freelancers who need a business plan for a bank, a free zone application, or their own clarity, and can't afford a consultant.

**What makes it different:** the questions are fixed and the document is assembled from structured answers. It isn't a blank template, and it isn't a one-shot AI essay.

**It is free.** No payment, no card, no limits. An account is optional and only exists to save plans across devices.

---

## 1. How it works

Three stages, 21 questions, one at a time. Progress is saved, so someone can leave and come back.

### Stage 1 — Idea validation (5 questions)

The idea in a sentence, the target customer, the problem, competitors, and how it makes money.

The model then gives a short read: whether demand is plausible, how it compares to the competitors *they named*, and two or three questions worth thinking about. It's told not to invent facts about companies it doesn't recognise.

### Stage 2 — The plan (7 questions)

Problem and solution, target market, product, revenue model, marketing, team, and UAE setup type.

The setup question shows a plain-language guide to mainland, free zone and offshore alongside it, so nobody has to know the terms in advance or ask what they mean.

Answers are lightly tidied by the model — grammar and filler only, never adding information — and stored as structured fields rather than raw chat.

### Stage 3 — Budget and projection (9 questions)

Industry, team size and visas, setup type, space needs, and marketing budget feed the budget table.

Four further questions — price per customer, whether payment repeats, new customers per month, and monthly running costs — drive the revenue projection.

---

## 2. What the PDF contains

| Section | Built from |
|---|---|
| Cover | The one-line idea |
| Summary | The five stage 1 answers |
| Initial Assessment | The model's read of the idea |
| The Plan | The seven stage 2 sections |
| Budget Estimate | Licence, visas, space, marketing |
| Revenue Projection | Twelve months from their own figures |
| Strengths & Risks | The model's read of everything above, including the numbers |

The projection is arithmetic on what the founder supplied, never an estimate made on their behalf. If the numeric answers can't be read as numbers, the section is left out — an invented forecast in a document someone shows a bank is worse than no forecast.

---

## 3. Tech

- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database and auth:** Supabase — sessions, founder profile, reviews, and optional accounts
- **Model:** OpenAI `gpt-4o-mini`, used only for stage 1 feedback, light answer tidying, and the strengths and risks read. The plan itself is assembled from structured data, not generated.
- **PDF:** `pdf-lib`, laid out in code from those structured fields

Setup instructions, environment variables and deployment steps are in [SETUP.md](SETUP.md).

---

## 4. Data model

```
Session {
  id
  user_id                 -- null for anonymous plans
  current_stage: 1 | 2 | 3
  current_question_index
  stage1_answers: { idea, target_customer, problem, competitors, revenue_model }
  stage2_answers: { problem_solution, target_market, product, revenue_model,
                    marketing_plan, team, setup_type }
  stage3_answers: { industry, team_size, setup_type, space_needs, marketing_budget,
                    avg_sale_value, revenue_repeat, customers_per_month, monthly_costs }
  stage1_feedback
  created_at
}
```

The question flow lives in `questions_config.json`, duplicated in `backend/src/config/` and `frontend/src/config/` — the backend drives the flow, the frontend renders the transcript. **The two files must stay identical.**

---

## 5. Deliberately not built

- Live UAE regulation or pricing lookups. Rules change; claiming real-time accuracy would be risky and the figures are labelled as estimates for that reason.
- Languages other than English. Non-Latin text is accepted and stored correctly, but the PDF fonts can't render it, so those fields are flagged in the document rather than silently dropped. Proper Arabic output needs an embedded font and right-to-left shaping.
- Investor or free zone matching and referrals.
- Editing an earlier answer mid-flow. Starting a new plan is the way back.

---

## 6. Changes from the original spec

This began as a paid product: stage 1 free as a hook, stages 2 and 3 behind a Stripe paywall. That was built and then removed — it is free throughout, and there is no payment code left in the repository.

Accounts were originally listed as out of scope. They exist, but only to save and resume plans; nothing is gated behind them.

Two unused objects from the paid version may still exist in an older database — a `sessions.paid` column and an empty `profiles` table. [`supabase/cleanup_legacy.sql`](supabase/cleanup_legacy.sql) removes them, and is safe to skip.

---

## 7. Legal and content note

Every UAE cost figure, licence type and regulatory statement shown to a user is labelled as a **rough estimate for planning purposes only**, with a recommendation to confirm with the relevant free zone authority or the Dubai Department of Economy and Tourism before acting. Nothing here is official guidance, and the tool should never be presented as such.

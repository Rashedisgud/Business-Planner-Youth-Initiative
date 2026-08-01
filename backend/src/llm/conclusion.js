import { openai, OPENAI_MODEL } from './openaiClient.js';

/**
 * The closing section: where the plan stands, and what to actually do next.
 *
 * The rest of the document describes and measures. Someone finishing it still
 * has to decide what to do on Monday, and this is the part that answers that.
 */

const SYSTEM_PROMPT = `You write the closing section of a business plan for a first-time founder in the UAE, often a teenager or student starting small.

You get everything they wrote plus their own budget and revenue figures. Reply in exactly this format and nothing else:

VERDICT
<two or three sentences on where this plan stands: what is solid, what is still unproven, and whether the numbers hold together>

NEXT STEPS
- <something they can do in the next week or two>
- <something they can do in the next week or two>
- <something they can do in the next week or two>
- <optional fourth>

Rules:
- Each step is one sentence, under 22 words, and starts with a verb.
- Steps must be things a beginner can actually do without money or permission: talk to ten possible customers, price a competitor, run a trial weekend, post once and count replies. Not "secure funding" or "hire a team".
- Use their own figures where it helps. If the projection showed a shortfall, say what to test first to close it.
- Be encouraging and straight at the same time. They should finish this wanting to start, and knowing what to start with.
- Never name real companies, brands or people; describe the kind of business instead.
- Write to them as "you". No preamble, no markdown, no sign-off.`;

function buildContext({ stage1 = {}, stage2 = {}, budget, projection }) {
  const lines = [
    stage1.idea && `Idea: ${stage1.idea}`,
    stage1.target_customer && `Customer: ${stage1.target_customer}`,
    stage1.problem && `Problem: ${stage1.problem}`,
    stage1.competitors && `Existing alternatives: ${stage1.competitors}`,
    stage2.product && `Product or service: ${stage2.product}`,
    stage2.revenue_model && `How it makes money: ${stage2.revenue_model}`,
    stage2.marketing_plan && `How they will find customers: ${stage2.marketing_plan}`,
    stage2.team && `Team: ${stage2.team}`,
    stage2.setup_type && `UAE setup: ${stage2.setup_type}`,
  ].filter(Boolean);

  if (budget) {
    lines.push(
      `Setup cost for year one: AED ${budget.totalMin.toLocaleString()} to ${budget.totalMax.toLocaleString()}.`
    );
  }

  if (projection) {
    lines.push(
      `Their assumptions: ${projection.newPerMonth} new customers a month at AED ${projection.price.toLocaleString()} each, ${projection.recurring ? 'paying every month' : 'paying once'}.`,
      `Year one revenue about AED ${Math.round(projection.yearRevenue).toLocaleString()} against running costs of about AED ${Math.round(projection.yearCosts).toLocaleString()}.`,
      projection.breakEvenMonth
        ? `Monthly revenue passes monthly costs around month ${projection.breakEvenMonth}.`
        : 'Monthly revenue never passes monthly costs in the first year on these numbers.'
    );
  }

  return lines.join('\n');
}

function parse(text) {
  if (!text) return null;
  const verdict = [];
  const steps = [];
  let bucket = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^verdict\b/i.test(line)) { bucket = 'verdict'; continue; }
    if (/^next steps?\b/i.test(line)) { bucket = 'steps'; continue; }
    if (bucket === 'steps' && /^[-*•]\s+/.test(line)) {
      steps.push(line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, ''));
    } else if (bucket === 'verdict') {
      verdict.push(line.replace(/\*\*/g, ''));
    }
  }

  if (!verdict.length && !steps.length) return null;
  return { verdict: verdict.join(' '), steps };
}

/** Returns null on any failure - the section is dropped rather than the document. */
export async function generateConclusion({ stage1, stage2, budget, projection }) {
  const context = buildContext({ stage1, stage2, budget, projection });
  if (!context) return null;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
    });
    return parse(response.choices[0].message.content);
  } catch (err) {
    console.error('Conclusion generation failed, omitting section:', err.message);
    return null;
  }
}

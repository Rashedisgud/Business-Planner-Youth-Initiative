import { openai, OPENAI_MODEL } from './openaiClient.js';

const SYSTEM_PROMPT = `You assess early stage UAE business plans for first-time founders.

Given everything a founder has written about their business, plus their setup budget and revenue assumptions, identify what genuinely works in their favour and what could realistically go wrong.

Reply in exactly this format, with no other text:

STRENGTHS
- <strength>
- <strength>
- <strength>

RISKS
- <risk>
- <risk>
- <risk>

Rules:
- Three or four bullets under each heading.
- Each bullet is one sentence, under 25 words.
- Be specific to this business. "Good idea" or "market is competitive" are useless; say what about THIS business is strong or exposed.
- Base every point on what the founder actually wrote or on their own numbers. Never invent facts about named competitors, market sizes, or regulations.
- Under RISKS, name things they can act on, not vague worries.
- Write plainly, addressing the founder as "you".`;

/**
 * Strengths and risks for the plan. Returns null on any failure - the section
 * is simply left out rather than the whole document failing over it.
 */
export async function generateProsAndCons({ stage1 = {}, stage2 = {}, budget, projection }) {
  const lines = [
    `Idea: ${stage1.idea ?? 'not given'}`,
    `Target customer: ${stage1.target_customer ?? 'not given'}`,
    `Problem solved: ${stage1.problem ?? 'not given'}`,
    `Existing alternatives: ${stage1.competitors ?? 'not given'}`,
    `Product or service: ${stage2.product ?? 'not given'}`,
    `Revenue model: ${stage2.revenue_model ?? stage1.revenue_model ?? 'not given'}`,
    `How they will win customers: ${stage2.marketing_plan ?? 'not given'}`,
    `Team: ${stage2.team ?? 'not given'}`,
  ];

  if (budget) {
    lines.push(
      `Estimated first year setup cost: AED ${budget.totalMin.toLocaleString()} to ${budget.totalMax.toLocaleString()}.`
    );
  }
  if (projection) {
    lines.push(
      `Their own revenue assumptions: ${projection.newPerMonth} new customers a month at AED ${projection.price.toLocaleString()} each, ${projection.recurring ? 'paid every month' : 'paid once'}.`,
      `That gives year one revenue of about AED ${Math.round(projection.yearRevenue).toLocaleString()} against running costs of about AED ${Math.round(projection.yearCosts).toLocaleString()}.`,
      projection.breakEvenMonth
        ? `Monthly revenue passes monthly costs around month ${projection.breakEvenMonth}.`
        : 'Monthly revenue never passes monthly costs within the first year on these numbers.'
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: lines.join('\n') },
      ],
    });
    return parse(response.choices[0].message.content);
  } catch (err) {
    console.error('Strengths and risks generation failed, omitting section:', err.message);
    return null;
  }
}

function parse(text) {
  if (!text) return null;
  const strengths = [];
  const risks = [];
  let bucket = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (/^strengths\b/i.test(line)) { bucket = strengths; continue; }
    if (/^risks\b/i.test(line)) { bucket = risks; continue; }
    if (!bucket) continue;
    if (/^[-*•]\s+/.test(line)) bucket.push(line.replace(/^[-*•]\s+/, '').replace(/\*\*/g, ''));
  }

  if (!strengths.length && !risks.length) return null;
  return { strengths, risks };
}

import { openai, OPENAI_MODEL } from './openaiClient.js';

/**
 * Help for someone stuck on a question.
 *
 * Suggestions are offered, never recorded. Whatever comes back is shown as a
 * prompt to think with and the question is asked again, so the plan stays the
 * founder's own words rather than the model's - which matters when the document
 * ends up in front of a bank.
 */

const IDEA_PROMPT = `You suggest business ideas to teenagers and young people in the UAE starting their first business.

Give exactly three ideas, each on its own line starting with "- ".

Rules:
- Each is one sentence, under 20 words, concrete enough to picture.
- They are young, often still studying, with little or no money to start. Suggest things that can begin small, from home or a laptop, and run around school or university. Tutoring, content and design work for local shops, handmade or printed goods, pet sitting, event help, coaching a skill they already have, reselling.
- Nothing needing staff, premises, a vehicle, heavy equipment, investors, or a licence that takes years.
- Nothing age-restricted: no alcohol, tobacco, vaping, gambling, driving-based work, or anything requiring a professional qualification they wouldn't hold yet.
- Suited to the UAE: the climate, the population, how people live and shop there.
- Vary them. Three versions of the same idea is no help.
- If they hinted at an interest, all three should follow it.
- No preamble, no numbering, no closing line. Only the three lines.`;

const ANSWER_PROMPT = `You help a teenager or young person in the UAE answer one question about their own business plan.

They are starting their first business, often while studying, with very little money. Any figure you give should reflect that: small budgets, modest customer numbers, costs someone their age could actually cover.

You get their business so far and the question they are stuck on. Reply with a suggested answer they could give.

Rules:
- Two sentences at most, under 40 words total.
- Be concrete and specific to their business. A number question needs an actual number; a written question needs actual wording they could use.
- Base it on what they have already told you. Never contradict it.
- For money and volume questions, pick a figure that is realistic for that kind of business in the UAE at its earliest stage, and say briefly why.
- Never name real companies, brands or people. You will get them wrong, and a made-up competitor in a document shown to a bank is worse than none. Describe the kind of business instead.
- Write to them as "you". No preamble, no sign-off, no markdown.`;

const QUESTION_CONTEXT = {
  avg_sale_value: 'They need a realistic price per customer, per visit or per month, in AED.',
  customers_per_month:
    'They need a realistic number of NEW customers won per month in the first year. First-time founders overestimate this badly, so keep it modest.',
  monthly_costs:
    'They need monthly staff and day-to-day running costs in AED, excluding rent and marketing which are asked separately.',
  marketing_budget: 'They need a monthly marketing spend in AED, appropriate to a business just starting out.',
  space_needs: 'They must pick one of: none, flexi-desk, office, or retail.',
  setup_type: 'They must pick one of: mainland, free zone, or offshore.',
  revenue_repeat: 'They must say whether customers pay again each month, or just once.',
};

function businessContext(session) {
  const s1 = session.stage1_answers || {};
  const s2 = session.stage2_answers || {};
  const s3 = session.stage3_answers || {};
  const lines = [
    s1.idea && `Idea: ${s1.idea}`,
    s1.target_customer && `Customer: ${s1.target_customer}`,
    s1.problem && `Problem: ${s1.problem}`,
    s2.product && `Product or service: ${s2.product}`,
    s2.revenue_model && `How it makes money: ${s2.revenue_model}`,
    s2.team && `Team: ${s2.team}`,
    s2.setup_type && `Setup: ${s2.setup_type}`,
    s3.space_needs && `Space: ${s3.space_needs}`,
    s3.marketing_budget && `Monthly marketing: ${s3.marketing_budget}`,
    s3.avg_sale_value && `Price per customer: ${s3.avg_sale_value}`,
  ].filter(Boolean);
  return lines.join('\n');
}

/** Three business ideas, optionally steered by whatever they hinted at. */
export async function suggestIdeas(hint) {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.9, // variety matters more than precision here
      messages: [
        { role: 'system', content: IDEA_PROMPT },
        {
          role: 'user',
          content: hint
            ? `They said: "${hint}". Take any interest or field in that as the direction.`
            : 'They have no idea yet and no particular field in mind.',
        },
      ],
    });

    const ideas = response.choices[0].message.content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[-*•]/.test(l))
      .map((l) => l.replace(/^[-*•]\s*/, ''))
      .slice(0, 3);

    if (!ideas.length) return null;

    return [
      'No problem - here are three to react to:',
      '',
      ...ideas.map((idea) => `- ${idea}`),
      '',
      "Pick one, change one, or say something else entirely. It's your plan:",
    ].join('\n');
  } catch (err) {
    console.error('Idea suggestion failed:', err.message);
    return null;
  }
}

const NUDGE_PROMPT = `You give a teenager or young person in the UAE a short nudge on a question about their own business plan.

They are starting their first business, often while studying, with very little money. Any figure you give should reflect that: small budgets, modest customer numbers, costs someone their age could actually cover.

You get their business so far and the question being asked. Reply with one short example of the kind of answer that fits.

Rules:
- ONE sentence, under 18 words. Shorter is better.
- Specific to their business. A money question needs an actual AED figure; a written question needs a concrete example.
- It is a prompt to think with, not their answer. Never write it as though it is settled.
- Never name real companies, brands or people. You will get them wrong, and a made-up competitor in a document shown to a bank is worse than none. Describe the kind of business instead: "the car wash at your nearest mall", not a name.
- No preamble, no "for example", no markdown, no quotes. Just the example itself.`;

/**
 * A short nudge shown under the question without being asked for.
 *
 * Kept to one line on purpose. A full answer offered unprompted gets accepted
 * as-is, and the plan stops being the founder's - which is the whole point of
 * asking rather than generating. Enough to unblock, not enough to copy.
 */
export async function nudgeFor(question, session) {
  const context = businessContext(session);
  if (!context) return null;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.6,
      max_tokens: 60,
      messages: [
        { role: 'system', content: NUDGE_PROMPT },
        {
          role: 'user',
          content: [
            'Their business so far:',
            context,
            '',
            `Question being asked: "${question.prompt}"`,
            QUESTION_CONTEXT[question.key] ? `Note: ${QUESTION_CONTEXT[question.key]}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    });

    const nudge = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    return nudge ? `Something like: ${nudge}` : null;
  } catch (err) {
    console.error('Nudge generation failed:', err.message);
    return null;
  }
}

/** A suggested answer to the question they're stuck on. */
export async function suggestAnswerFor(question, session) {
  const context = businessContext(session);
  if (!context) return null;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        { role: 'system', content: ANSWER_PROMPT },
        {
          role: 'user',
          content: [
            'Their business so far:',
            context,
            '',
            `The question they are stuck on: "${question.prompt}"`,
            QUESTION_CONTEXT[question.key] ? `Note: ${QUESTION_CONTEXT[question.key]}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    });

    const suggestion = response.choices[0].message.content.trim();
    if (!suggestion) return null;

    return [
      'Here\'s a starting point based on what you\'ve told me:',
      '',
      suggestion,
      '',
      'Use that, adjust it, or tell me your own:',
    ].join('\n');
  } catch (err) {
    console.error('Answer suggestion failed:', err.message);
    return null;
  }
}

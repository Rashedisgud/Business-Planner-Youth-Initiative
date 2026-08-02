import { openai, OPENAI_MODEL } from './openaiClient.js';

/**
 * A short, encouraging read of the idea, meant for a teenager or first-time
 * founder rather than an MBA. Everything here is aimed at cutting jargon and
 * length: the earlier version returned three headed sections that read like a
 * report, and testers gave up on it. This asks for short paragraphs in plain
 * words instead.
 */
const SYSTEM_PROMPT = `You are helping a young person in the UAE with a first business idea. Talk to them the way a supportive older sibling would - not a consultant, not a teacher.

You get their idea, who it is for, the problem it solves, and who else is doing something similar.

Reply in exactly this shape:

<one short sentence saying whether this could work, in plain words. Lead with a positive.>

<one short sentence on what makes it different, or on what to watch out for compared to the ones already doing it.>

One thing to think about:
<one clear question that gets them thinking, no more than 15 words>

Rules:
- Under 70 words in total. Shorter is better.
- Everyday words only. No "sanity check", "leverage", "differentiate", "sustainability", "value proposition", "scalable". If a 14-year-old would not use it, do not use it.
- Be warm and specific to what they wrote, not generic.
- Never invent facts about named companies. Describe the kind of business instead.
- No markdown, no bullet points, no bold. Plain sentences on plain lines.`;

export async function generateStage1Feedback(answers) {
  const userContent = [
    `Idea: ${answers.idea}`,
    `Who it's for: ${answers.target_customer}`,
    `Problem it solves: ${answers.problem}`,
    `Others already doing something similar: ${answers.competitors}`,
  ].join('\n');

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.5,
    max_tokens: 220,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  return response.choices[0].message.content.trim();
}

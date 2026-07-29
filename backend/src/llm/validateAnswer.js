import { openai, OPENAI_MODEL } from './openaiClient.js';

const SYSTEM_PROMPT = `You lightly clean up a founder's answer to a business-plan question before it's stored and later inserted into a PDF.
Rules:
- Preserve the founder's meaning and facts exactly. Never add information they didn't give.
- Fix grammar, remove filler ("um", "I guess", "like"), and tighten phrasing into complete sentences.
- Keep the founder's voice and level of detail - do not expand a short answer into a long one.
- Output only the cleaned answer text, nothing else (no quotes, no preamble).`;

export async function validateAnswer(questionPrompt, rawAnswer) {
  if (!rawAnswer || rawAnswer.trim().length < 3) return rawAnswer;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${questionPrompt}\nFounder's answer: ${rawAnswer}`,
        },
      ],
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('validateAnswer failed, falling back to raw answer:', err.message);
    return rawAnswer;
  }
}

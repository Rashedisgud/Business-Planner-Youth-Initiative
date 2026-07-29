/**
 * Some questions offer to explain themselves ("if you're not sure, say so and
 * I'll explain the difference"). Without this the flow would take "I'm not
 * sure" as the answer and move on, breaking a promise it just made.
 *
 * When an answer looks like a request for help rather than an answer, the
 * question is asked again with the explanation in front of it.
 */

const UNSURE = /\b(not sure|unsure|no idea|don'?t know|dont know|do not know|explain|what'?s the difference|whats the difference|difference|help|confused|which one|tell me more|not certain|no clue|idk)\b/i;

/**
 * Guard against treating a real answer as a request for help. "Free zone, not
 * sure why anyone picks mainland" is an answer, so require that the reply does
 * not already commit to one of the options.
 */
const SETUP_COMMITTED = /\b(mainland|free ?zone|offshore)\b/i;

const SETUP_EXPLANATION = [
  "No problem - here's the short version.",
  '',
  'Mainland: licensed by the emirate\'s Department of Economy. You can trade directly with customers anywhere in the UAE and bid for government work. Most activities now allow full foreign ownership, and you normally need real office space.',
  '',
  'Free zone: licensed by one specific free zone authority. Usually the cheapest and quickest to set up, full foreign ownership, and packages often bundle a flexi-desk. The trade-off is that selling directly into the UAE mainland market typically needs a local distributor or agent.',
  '',
  'Offshore: a registered company that is not permitted to trade inside the UAE at all. It is used for holding assets or international business, and it does not come with visas. It is not the right choice if you plan to operate locally.',
  '',
  'Most first-time founders serving UAE customers start in a free zone. Rules differ by emirate and by activity and they change, so confirm with the specific authority before committing.',
  '',
  'So which would you like to go with - mainland, free zone, or offshore?',
].join('\n');

const CLARIFICATIONS = {
  setup_type: {
    matches: (answer) => UNSURE.test(answer) && !SETUP_COMMITTED.test(answer),
    text: SETUP_EXPLANATION,
  },
};

/**
 * Returns explanation text when the answer is asking for help rather than
 * answering, otherwise null.
 */
export function clarificationFor(questionKey, answer) {
  const entry = CLARIFICATIONS[questionKey];
  if (!entry || typeof answer !== 'string') return null;
  return entry.matches(answer) ? entry.text : null;
}

/**
 * Catches messages that aren't answers - a greeting, or someone saying they
 * don't follow - so they get a reply and the question again, instead of "hello"
 * being recorded as their business idea.
 *
 * The bar for treating something as small talk is deliberately high. Wrongly
 * rejecting a real answer is far more annoying than briefly recording a odd
 * one, so anything carrying actual content is let through, including "hi, I
 * want to open a cafe".
 */

const GREETING_WORDS = [
  'hi', 'hii', 'hiii', 'hello', 'helo', 'hey', 'heyy', 'yo', 'hiya', 'howdy',
  'greetings', 'sup', 'salam', 'salaam', 'salamu', 'assalam', 'assalamu',
  'alaikum', 'aleikum', 'walaikum', 'marhaba', 'mrhba', 'ahlan', 'shukran',
  'good', 'morning', 'afternoon', 'evening', 'day', 'night',
  'how', 'are', 'you', 'doing', 'whats', 'what', 'up', 'is', 'your', 'name',
  'there', 'im', 'i', 'am', 'me', 'a', 'an', 'the', 'and', 'so', 'well', 'hm',
  'hmm', 'haha', 'lol', 'nice', 'cool', 'great', 'thanks', 'thank', 'ty', 'pls',
  'please', 'test', 'testing', 'hola', 'bonjour',
  // "ok" and "okay" are never an answer to any of the questions asked, unlike
  // "yes", "no" and "none", which are - so those stay out of this list.
  'ok', 'okay', 'okey', 'alright',
];

const GREETING_SET = new Set(GREETING_WORDS);

const CONFUSED =
  /^(what|huh|\?+|sorry|pardon|come again|i (don'?t|do not) (get|understand|know what)|what do you mean|explain|repeat|say (that )?again|idk|no idea|not sure what)\b/i;

/** Letters and digits only, so punctuation and emoji don't count as content. */
function meaningfulWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns a reply when the message is small talk rather than an answer, and
 * null when it should be treated as the answer.
 */
export function smallTalkReplyFor(rawAnswer, { isFirstQuestion = false } = {}) {
  if (typeof rawAnswer !== 'string') return null;
  const text = rawAnswer.trim();
  if (!text) return null;

  const words = meaningfulWords(text);
  if (!words.length) {
    return "I didn't catch anything there - could you try again?";
  }

  // Long messages are answers, whatever they open with.
  if (words.length > 12) return null;

  const leftover = words.filter((w) => !GREETING_SET.has(w));

  // Nothing but greeting words: a hello and no answer.
  if (leftover.length === 0) {
    return isFirstQuestion
      ? "Hello! Good to meet you. Whenever you're ready, tell me the idea:"
      : "Hello! Ready when you are:";
  }

  // Said they don't follow, and offered nothing else.
  if (CONFUSED.test(text) && leftover.length <= 3) {
    return "No problem, let me put it another way - just answer in your own words, however short:";
  }

  return null;
}

// Phrases that only ever mean "I'm asking you", whatever surrounds them.
const CLEARLY_ASKING =
  /\b(suggest|suggestions?|any ideas|give me (some )?ideas|some ideas|i don'?t know|dont know|no idea|not sure|no clue|what should i|surprise me|inspire me|i'?m stuck|im stuck|examples? please)\b/i;

// Phrases that also appear inside real answers - "an app that helps you choose
// a gym" is a business, not a request - so these only count when the whole
// message is short enough to be nothing but the asking.
const MAYBE_ASKING =
  /\b(recommend|help me|you (pick|choose|decide)|examples?|options|stuck|anything)\b/i;

const SHORT_ENOUGH_TO_BE_A_REQUEST = 4;

/**
 * True when the message is asking for a suggestion rather than giving an answer.
 *
 * Deliberately cautious: mistaking someone's real answer for a question is far
 * worse than missing a request for help, since they can always ask again.
 */
export function isAskingForHelp(rawAnswer) {
  if (typeof rawAnswer !== 'string') return false;
  const text = rawAnswer.trim();
  if (!text) return false;

  const words = meaningfulWords(text);
  if (words.length > 10) return false;

  if (CLEARLY_ASKING.test(text)) return true;
  return words.length <= SHORT_ENOUGH_TO_BE_A_REQUEST && MAYBE_ASKING.test(text);
}

const ASKING_FOR_HELP = new RegExp(
  `${CLEARLY_ASKING.source}|${MAYBE_ASKING.source}`,
  'gi'
);

/**
 * Anything left once the asking is stripped out - "suggest something with food"
 * yields "something with food", which steers the suggestions.
 */
export function hintFromHelpRequest(rawAnswer) {
  const text = String(rawAnswer || '').trim();
  const stripped = text
    .replace(ASKING_FOR_HELP, ' ')
    .replace(/\b(me|some|any|a|an|the|please|for|of|about|with|something|anything|can|you|i|to|do|know)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim();
  return stripped.length >= 3 ? text : null;
}

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BENCHMARKS = JSON.parse(
  readFileSync(
    path.join(__dirname, '..', 'config', 'budget_benchmarks.json'),
    'utf-8'
  )
);

/**
 * Which setup, including not having one.
 *
 * Plenty of people here are testing an idea rather than registering a company,
 * and billing them for a trade licence they have not bought puts thousands of
 * dirhams of imaginary cost in front of someone deciding whether to start at
 * all. Checked first, since "not registering as a free zone company yet"
 * mentions free zone.
 */
function matchSetupType(text = '') {
  const t = text.toLowerCase();
  if (
    /\b(not yet|not registering|no licen[cs]e|without a licen[cs]e|just testing|testing (it|the idea)|too early|informal|not ready|haven'?t decided|side project|hobby|no company)\b/.test(
      t
    )
  ) {
    return 'not_yet';
  }
  if (t.includes('free zone') || t.includes('freezone')) return 'free_zone';
  if (t.includes('offshore')) return 'offshore';
  if (t.includes('mainland')) return 'mainland';
  return 'free_zone'; // most common default for first-time founders
}

function matchSpaceNeeds(text = '') {
  const t = text.toLowerCase();
  if (t.includes('flexi')) return 'flexi-desk';
  if (t.includes('retail')) return 'retail';
  if (t.includes('office')) return 'office';
  if (t.includes('none') || t.includes('no space') || t.includes('remote')) return 'none';
  return 'flexi-desk';
}

const WORD_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};

function wordOrDigit(token) {
  if (!token) return null;
  const asNumber = parseInt(token, 10);
  if (Number.isFinite(asNumber)) return asNumber;
  return WORD_NUMBERS[token.toLowerCase()] ?? null;
}

const NUMBER_TOKEN =
  '(\\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)';

/**
 * Visas needed, counting staff only.
 *
 * The business owner is not counted: they hold the licence rather than being
 * sponsored by it, so charging the budget for their visa overstates the cost of
 * starting alone. Someone working on their own therefore needs none.
 *
 * Numbers spelled as words are read too, because answers are tidied by the
 * model on the way in and "2 staff" often comes back as "two staff".
 */
function extractVisaCount(text) {
  const value = String(text || '');

  // An explicit count wins - they know their own situation better than this does.
  const stated = value.match(new RegExp(`${NUMBER_TOKEN}\\s*visas?`, 'i'));
  if (stated) return Math.max(0, wordOrDigit(stated[1]) ?? 0);
  if (/\b(no|zero|none|don'?t need|do not need)\b[^.]{0,20}\bvisas?\b/i.test(value)) return 0;

  // Working alone means nobody to sponsor.
  if (/\b(just me|only me|solo|myself|on my own|by myself|no one else|nobody else)\b/i.test(value)) {
    return 0;
  }

  // "a team of five" counts everyone, so the owner comes back off.
  const team = value.match(new RegExp(`\\b(?:team of|group of|we are|there are)\\s*${NUMBER_TOKEN}`, 'i'));
  if (team) return Math.max(0, (wordOrDigit(team[1]) ?? 1) - 1);

  // Otherwise count the people named alongside the owner. Any job title counts,
  // since listing them by trade ("two chefs", "one groomer") is the natural way
  // to answer, and the units below are the only common things a number is
  // followed by that aren't people.
  const NOT_PEOPLE =
    /^(year|month|week|day|hour|minute|aed|dirham|dollar|thousand|million|percent|van|car|branch|location|shop|store|site)/i;
  const hires = value.match(new RegExp(`${NUMBER_TOKEN}\\s+([a-z]+)`, 'i'));
  if (hires && !NOT_PEOPLE.test(hires[2])) return Math.max(0, wordOrDigit(hires[1]) ?? 0);

  return 0;
}

function bucketMarketingBudget(text = '') {
  const numbers = text.match(/\d[\d,]*/g);
  const value = numbers ? parseInt(numbers[0].replace(/,/g, ''), 10) : null;
  if (value === null) return { bucket: 'medium', stated: null };
  if (value < 3000) return { bucket: 'low', stated: value };
  if (value <= 10000) return { bucket: 'medium', stated: value };
  return { bucket: 'high', stated: value };
}

/**
 * Takes the answers from every stage merged together. Setup type and team moved
 * out of stage 3 when the duplicate questions were removed, and plans created
 * before that still hold them under the old keys, so both are accepted.
 */
export function computeBudget(answers = {}) {
  const setupType = matchSetupType(answers.setup_type);
  const spaceNeeds = matchSpaceNeeds(answers.space_needs);
  const marketing = bucketMarketingBudget(answers.marketing_budget);

  // No company means nothing to sponsor a visa through, whatever was said about
  // the team.
  const visaCount =
    setupType === 'not_yet' ? 0 : extractVisaCount(answers.team ?? answers.team_size);

  const license = BENCHMARKS.trade_license[setupType];
  const visa = BENCHMARKS.visa_cost_per_person;
  const space = BENCHMARKS.space[spaceNeeds];
  const marketingRange = BENCHMARKS.marketing[marketing.bucket];

  const lineItems = [
    {
      label:
        setupType === 'not_yet'
          ? 'Trade licence (not registering yet)'
          : `Trade licence (${setupType.replace('_', ' ')})`,
      min: license.min,
      max: license.max,
      unit: license.unit,
    },
    {
      // Labelled as staff so the assumption is visible: the owner isn't sponsored.
      label:
        visaCount === 0
          ? 'Staff visas (none - owner only)'
          : `Staff visas (${visaCount} x ${visa.min}-${visa.max} AED)`,
      min: visa.min * visaCount,
      max: visa.max * visaCount,
      unit: 'one-time/renewal',
    },
    {
      label: `Space (${spaceNeeds})`,
      min: space.min,
      max: space.max,
      unit: space.unit,
    },
    // Their own figure wins over the benchmark band. Someone who says 300 a
    // month should not be handed a 12,000 to 36,000 marketing line - the band
    // exists for when no number was given at all.
    marketing.stated !== null
      ? {
          label: `Marketing (${marketing.stated.toLocaleString()} AED/month, as you said)`,
          min: marketing.stated * 12,
          max: marketing.stated * 12,
          unit: 'per year',
        }
      : {
          label: `Marketing (${marketing.bucket} estimate)`,
          min: marketingRange.min * 12,
          max: marketingRange.max * 12,
          unit: 'per year (12mo est.)',
        },
  ];

  const totalMin = lineItems.reduce((sum, i) => sum + i.min, 0);
  const totalMax = lineItems.reduce((sum, i) => sum + i.max, 0);

  return {
    setupType,
    spaceNeeds,
    visaCount,
    lineItems,
    totalMin,
    totalMax,
    disclaimer: BENCHMARKS.disclaimer,
  };
}

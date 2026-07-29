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

function matchSetupType(text = '') {
  const t = text.toLowerCase();
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

function extractVisaCount(text = '') {
  const match = text.match(/(\d+)\s*(visa|person|people|founder|employee)/i);
  if (match) return Math.max(1, parseInt(match[1], 10));
  if (/\bsolo\b/i.test(text)) return 1;
  return 1;
}

function bucketMarketingBudget(text = '') {
  const numbers = text.match(/\d[\d,]*/g);
  const value = numbers ? parseInt(numbers[0].replace(/,/g, ''), 10) : null;
  if (value === null) return { bucket: 'medium', stated: null };
  if (value < 3000) return { bucket: 'low', stated: value };
  if (value <= 10000) return { bucket: 'medium', stated: value };
  return { bucket: 'high', stated: value };
}

export function computeBudget(stage3Answers) {
  const setupType = matchSetupType(stage3Answers.setup_type);
  const spaceNeeds = matchSpaceNeeds(stage3Answers.space_needs);
  const visaCount = extractVisaCount(stage3Answers.team_size);
  const marketing = bucketMarketingBudget(stage3Answers.marketing_budget);

  const license = BENCHMARKS.trade_license[setupType];
  const visa = BENCHMARKS.visa_cost_per_person;
  const space = BENCHMARKS.space[spaceNeeds];
  const marketingRange = BENCHMARKS.marketing[marketing.bucket];

  const lineItems = [
    {
      label: `Trade license (${setupType.replace('_', ' ')})`,
      min: license.min,
      max: license.max,
      unit: license.unit,
    },
    {
      label: `Visas (${visaCount} x ${visa.min}-${visa.max} AED)`,
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
    {
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

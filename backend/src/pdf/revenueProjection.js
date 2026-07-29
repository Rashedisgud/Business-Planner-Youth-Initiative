/**
 * Twelve month revenue projection.
 *
 * Modelled on the commercial plan spreadsheet this was based on: customers are
 * won at a steady rate each month and, when the business is a recurring one,
 * they keep paying. That makes revenue accumulate month over month rather than
 * staying flat, which is what makes the difference between a business that
 * reaches break even and one that does not.
 *
 * Everything here is arithmetic on numbers the founder gave us. Nothing is
 * inferred or invented - if the answers aren't usable we return null and the
 * section is left out of the document entirely, because a made up forecast in
 * something that gets shown to a bank is worse than no forecast.
 */

const MONTH_COUNT = 12;

/** Pull a number out of free text like "around 3,000 AED per month". */
function parseNumber(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/,/g, '');
  const match = cleaned.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Distinguish "they pay monthly" from "one off". This decides whether revenue
 * accumulates or stays flat, so getting it wrong changes the projection
 * enormously - the terms are matched on their stems because "monthly",
 * "annually" and "renewals" all mean the same thing here and an exact word
 * match misses every one of them.
 */
function looksRecurring(text) {
  if (typeof text !== 'string') return false;
  const t = text.toLowerCase();

  // "once a month" is recurring despite containing "once", so it is settled
  // before the one-off phrasings below.
  if (/\bonce\s+(a|per|every)\b/.test(t)) return true;

  if (
    /\b(one[\s-]?off|one[\s-]?time|single purchase|single payment|not recurring|no subscription|only once|just once|pay once)\b/.test(
      t
    )
  ) {
    return false;
  }

  return /\b(month|recur|subscri|retainer|repeat|ongoing|annual|renew|every week|each week|weekly|regular)/.test(
    t
  );
}

export function computeProjection(stage3 = {}, budget = null) {
  const price = parseNumber(stage3.avg_sale_value);
  const newPerMonth = parseNumber(stage3.customers_per_month);
  if (!price || !newPerMonth) return null;

  const recurring = looksRecurring(stage3.revenue_repeat);
  const runningCosts = parseNumber(stage3.monthly_costs) ?? 0;
  const marketing = parseNumber(stage3.marketing_budget) ?? 0;

  // Rent already sits in the budget as an annual figure, so spread it back over
  // the year instead of asking for it twice.
  const spaceAnnual = budget?.lineItems?.find((i) => i.label.startsWith('Space'));
  const rentMonthly = spaceAnnual ? (spaceAnnual.min + spaceAnnual.max) / 2 / 12 : 0;
  const monthlyCosts = runningCosts + marketing + rentMonthly;

  const months = [];
  let payingCustomers = 0;
  let cumulativeRevenue = 0;

  for (let m = 1; m <= MONTH_COUNT; m += 1) {
    payingCustomers = recurring ? payingCustomers + newPerMonth : newPerMonth;
    const revenue = payingCustomers * price;
    cumulativeRevenue += revenue;
    months.push({
      month: m,
      payingCustomers,
      revenue,
      cumulativeRevenue,
      net: revenue - monthlyCosts,
    });
  }

  const firstProfitable = months.find((m) => m.net >= 0);

  return {
    recurring,
    price,
    newPerMonth,
    monthlyCosts,
    months,
    yearRevenue: cumulativeRevenue,
    yearCosts: monthlyCosts * MONTH_COUNT,
    yearNet: cumulativeRevenue - monthlyCosts * MONTH_COUNT,
    breakEvenMonth: firstProfitable ? firstProfitable.month : null,
  };
}

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { computeBudget } from './budgetCalculator.js';
import { computeProjection } from './revenueProjection.js';

const PAGE_SIZE = [595.28, 841.89]; // A4
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const FOOTER_TOP = MARGIN + 34; // content must not run below this

const ACCENT = rgb(0.85, 0.47, 0.02);
const INK = rgb(0.16, 0.14, 0.13);
const BODY = rgb(0.25, 0.23, 0.21);
const MUTED = rgb(0.48, 0.45, 0.42);
const RULE = rgb(0.88, 0.86, 0.83);
const SHADE = rgb(0.97, 0.96, 0.94);

const DISCLAIMER =
  'Figures are rough estimates for early planning only. Confirm exact costs with the relevant free zone authority or the Dubai Department of Economy and Tourism (DED) before acting.';

// Stage 1 is the founder's own framing of the idea, so it opens the document
// as a summary before the detailed plan.
const SUMMARY_FIELDS = [
  ['idea', 'The idea'],
  ['target_customer', 'Target customer'],
  ['problem', 'Problem being solved'],
  ['competitors', 'Existing alternatives'],
  ['revenue_model', 'How it makes money'],
];

const SECTION_LABELS = {
  problem_solution: 'Problem & Solution',
  target_market: 'Target Market & Customer',
  product: 'Product / Service Description',
  revenue_model: 'Revenue Model',
  marketing_plan: 'Marketing & Customer Acquisition Plan',
  team: 'Team',
  setup_type: 'UAE Setup Preference',
};

/**
 * The cover title is whatever someone typed as their idea, which is meant to be
 * one sentence but can be a paragraph. Step the size down to try to fit, then
 * truncate rather than letting it run off the page.
 */
function fitCoverTitle(text, font, maxWidth, maxLines) {
  for (const size of [26, 22, 18]) {
    const lines = wrapText(text, font, size, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = 18;
  const lines = wrapText(text, font, size, maxWidth).slice(0, maxLines);
  const last = lines.length - 1;
  lines[last] = `${lines[last].replace(/[\s.,;:]+\S*$/, '')}...`;
  return { size, lines };
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

class Doc {
  constructor(doc, fonts, businessName) {
    this.doc = doc;
    this.fonts = fonts;
    this.businessName = businessName;
    this.page = null;
    this.y = 0;
    this.isFirstContentPage = true;
  }

  newPage({ running = true } = {}) {
    this.page = this.doc.addPage(PAGE_SIZE);
    this.y = PAGE_SIZE[1] - MARGIN;
    if (running) this.drawRunningHeader();
    this.drawFooter();
    return this.page;
  }

  drawRunningHeader() {
    const { regular } = this.fonts;
    const size = 8.5;
    const label = this.businessName;
    const max = CONTENT_WIDTH - 40;
    let text = label;
    while (regular.widthOfTextAtSize(text, size) > max && text.length > 4) {
      text = text.slice(0, -2);
    }
    if (text !== label) text += '...';

    this.page.drawText(text, {
      x: MARGIN,
      y: PAGE_SIZE[1] - MARGIN + 14,
      size,
      font: regular,
      color: MUTED,
    });
    this.page.drawLine({
      start: { x: MARGIN, y: PAGE_SIZE[1] - MARGIN + 8 },
      end: { x: PAGE_SIZE[0] - MARGIN, y: PAGE_SIZE[1] - MARGIN + 8 },
      thickness: 0.5,
      color: RULE,
    });
    this.y = PAGE_SIZE[1] - MARGIN - 8;
  }

  drawFooter() {
    const { regular } = this.fonts;
    const lines = wrapText(DISCLAIMER, regular, 7.5, CONTENT_WIDTH - 30);
    let fy = MARGIN - 6 + lines.length * 9.5;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: fy,
        size: 7.5,
        font: regular,
        color: MUTED,
      });
      fy -= 9.5;
    }
  }

  ensureSpace(height) {
    if (!this.page || this.y - height < FOOTER_TOP) this.newPage();
  }

  /** Big section title with an accent rule under it. */
  sectionTitle(text) {
    // Avoid a title stranded at the bottom of a page.
    this.ensureSpace(70);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y - 14,
      size: 17,
      font: this.fonts.bold,
      color: INK,
    });
    this.y -= 22;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y - 6 },
      end: { x: MARGIN + 46, y: this.y - 6 },
      thickness: 2.5,
      color: ACCENT,
    });
    this.y -= 24;
  }

  subheading(text) {
    this.ensureSpace(40);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 11.5,
      font: this.fonts.bold,
      color: ACCENT,
    });
    this.y -= 16;
  }

  paragraph(text, opts = {}) {
    const size = opts.size ?? 10.5;
    const lineHeight = size * 1.45;
    const color = opts.color ?? BODY;
    const indent = opts.indent ?? 0;
    const lines = wrapText(text, this.fonts.regular, size, CONTENT_WIDTH - indent);
    for (const line of lines) {
      if (!line) {
        this.y -= lineHeight * 0.5;
        continue;
      }
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y,
        size,
        font: opts.bold ? this.fonts.bold : this.fonts.regular,
        color,
      });
      this.y -= lineHeight;
    }
    this.y -= opts.gap ?? 8;
  }

  bullet(text) {
    const size = 10.5;
    const lineHeight = size * 1.45;
    const lines = wrapText(text, this.fonts.regular, size, CONTENT_WIDTH - 16);
    lines.forEach((line, i) => {
      this.ensureSpace(lineHeight);
      if (i === 0) {
        this.page.drawCircle({
          x: MARGIN + 3,
          y: this.y + 3.5,
          size: 1.6,
          color: ACCENT,
        });
      }
      this.page.drawText(line, {
        x: MARGIN + 16,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: BODY,
      });
      this.y -= lineHeight;
    });
    this.y -= 3;
  }

  /** Label above value, used for the summary block. */
  labelledValue(label, value) {
    this.ensureSpace(46);
    this.page.drawText(label.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 8,
      font: this.fonts.bold,
      color: MUTED,
    });
    this.y -= 13;
    this.paragraph(value, { gap: 12 });
  }

  tableRow(cols, xs, opts = {}) {
    const size = 10;
    const rowHeight = 20;
    this.ensureSpace(rowHeight);
    const top = this.y + 6;

    if (opts.shade) {
      this.page.drawRectangle({
        x: MARGIN,
        y: top - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: opts.shade,
      });
    }
    if (opts.ruleAbove) {
      this.page.drawLine({
        start: { x: MARGIN, y: top },
        end: { x: PAGE_SIZE[0] - MARGIN, y: top },
        thickness: opts.ruleAbove,
        color: RULE,
      });
    }

    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const color = opts.color ?? INK;
    cols.forEach((col, i) => {
      const text = String(col);
      // Figures read better right-aligned so the digits line up.
      const x =
        i === 0 ? xs[i] : xs[i] - font.widthOfTextAtSize(text, size);
      this.page.drawText(text, { x, y: this.y, size, font, color });
    });
    this.y -= rowHeight;
  }
}

/**
 * The stage 1 assessment comes back with markdown-ish emphasis and dashes.
 * Rendering it raw would show literal asterisks, so translate the few patterns
 * the prompt actually produces.
 */
function renderAssessment(d, feedback) {
  for (const rawLine of feedback.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
    if (heading) {
      const [, title, rest] = heading;
      d.subheading(title.replace(/:$/, ''));
      if (rest) d.paragraph(rest);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      d.bullet(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    d.paragraph(line.replace(/\*\*/g, ''));
  }
}

export async function generatePlanPdf(session) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const stage1 = session.stage1_answers || {};
  const stage2 = session.stage2_answers || {};
  const stage3 = session.stage3_answers || {};

  const businessIdea = stage1.idea || 'Untitled Business';
  const dateStr = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setTitle(`Business Plan - ${businessIdea}`.slice(0, 200));
  doc.setSubject('Business plan and UAE setup budget estimate');
  doc.setCreator('Business Planner Youth Initiative (BPYI)');
  doc.setProducer('Business Planner Youth Initiative (BPYI)');
  doc.setCreationDate(new Date());

  const d = new Doc(doc, { regular, bold }, businessIdea);

  /* ---------- Cover ---------- */
  const cover = d.newPage({ running: false });
  cover.drawRectangle({
    x: 0,
    y: PAGE_SIZE[1] - 10,
    width: PAGE_SIZE[0],
    height: 10,
    color: ACCENT,
  });
  cover.drawText('BUSINESS PLAN', {
    x: MARGIN,
    y: PAGE_SIZE[1] - 250,
    size: 11,
    font: bold,
    color: ACCENT,
  });

  const title = fitCoverTitle(businessIdea, bold, CONTENT_WIDTH, 5);
  let ty = PAGE_SIZE[1] - 288;
  for (const line of title.lines) {
    cover.drawText(line, { x: MARGIN, y: ty, size: title.size, font: bold, color: INK });
    ty -= title.size * 1.27;
  }

  cover.drawLine({
    start: { x: MARGIN, y: ty - 10 },
    end: { x: MARGIN + 70, y: ty - 10 },
    thickness: 2.5,
    color: ACCENT,
  });
  cover.drawText(dateStr, {
    x: MARGIN,
    y: ty - 36,
    size: 11,
    font: regular,
    color: MUTED,
  });
  cover.drawText('Prepared with the Business Planner Youth Initiative (BPYI)', {
    x: MARGIN,
    y: MARGIN + 46,
    size: 9,
    font: regular,
    color: MUTED,
  });

  /* ---------- Summary ---------- */
  const summaryValues = SUMMARY_FIELDS.filter(([key]) => stage1[key]);
  if (summaryValues.length) {
    d.newPage();
    d.sectionTitle('Summary');
    for (const [key, label] of summaryValues) {
      d.labelledValue(label, stage1[key]);
    }
  }

  /* ---------- Initial assessment ---------- */
  const feedback = session.stage1_feedback;
  if (feedback && !/couldn't be generated/i.test(feedback)) {
    d.ensureSpace(120);
    d.sectionTitle('Initial Assessment');
    renderAssessment(d, feedback);
  }

  /* ---------- The plan ---------- */
  const planSections = Object.entries(SECTION_LABELS).filter(([key]) => stage2[key]);
  if (planSections.length) {
    d.newPage();
    d.sectionTitle('The Plan');
    planSections.forEach(([key, label], i) => {
      d.subheading(`${i + 1}. ${label}`);
      d.paragraph(stage2[key], { gap: 14 });
    });
  }

  /* ---------- Budget ---------- */
  const budget = computeBudget(stage3);
  d.newPage();
  d.sectionTitle('Budget Estimate');

  const visaText = `${budget.visaCount} ${budget.visaCount === 1 ? 'visa' : 'visas'}`;
  const spaceText =
    budget.spaceNeeds === 'none' ? 'no physical space' : `${budget.spaceNeeds} space`;
  d.paragraph(
    `Based on a ${budget.setupType.replace('_', ' ')} setup with ${visaText} and ${spaceText}.`,
    { gap: 16 }
  );

  const colX = [MARGIN, MARGIN + 330, MARGIN + CONTENT_WIDTH];
  d.tableRow(['Item', 'Low (AED)', 'High (AED)'], colX, {
    bold: true,
    shade: SHADE,
    color: INK,
  });
  budget.lineItems.forEach((item, i) => {
    d.tableRow(
      [item.label, item.min.toLocaleString(), item.max.toLocaleString()],
      colX,
      i % 2 === 1 ? { shade: SHADE } : {}
    );
  });
  d.tableRow(
    [
      'Estimated total, first year',
      budget.totalMin.toLocaleString(),
      budget.totalMax.toLocaleString(),
    ],
    colX,
    { bold: true, ruleAbove: 1.2 }
  );

  d.y -= 18;
  d.paragraph(budget.disclaimer, { size: 9.5, color: MUTED });

  /* ---------- Revenue projection ---------- */
  const projection = computeProjection(stage3, budget);
  if (projection) {
    d.newPage();
    d.sectionTitle('Revenue Projection');

    const basis = projection.recurring
      ? `Assumes ${projection.newPerMonth} new customers a month, each paying AED ${projection.price.toLocaleString()} every month and staying on. Revenue builds as customers accumulate.`
      : `Assumes ${projection.newPerMonth} customers a month, each paying AED ${projection.price.toLocaleString()} once. Revenue stays flat because customers are not retained.`;
    d.paragraph(basis, { gap: 6 });
    d.paragraph(
      `Monthly running costs are taken as AED ${Math.round(projection.monthlyCosts).toLocaleString()}, combining staff and day-to-day costs, marketing, and rent spread over the year.`,
      { gap: 16 }
    );

    const px = [MARGIN, MARGIN + 250, MARGIN + 370, MARGIN + CONTENT_WIDTH];
    d.tableRow(['Month', 'Paying customers', 'Revenue (AED)', 'Cumulative (AED)'], px, {
      bold: true,
      shade: SHADE,
    });
    projection.months.forEach((m, i) => {
      d.tableRow(
        [
          `Month ${m.month}`,
          m.payingCustomers.toLocaleString(),
          Math.round(m.revenue).toLocaleString(),
          Math.round(m.cumulativeRevenue).toLocaleString(),
        ],
        px,
        i % 2 === 1 ? { shade: SHADE } : {}
      );
    });
    d.tableRow(
      [
        'Year one total',
        '',
        '',
        Math.round(projection.yearRevenue).toLocaleString(),
      ],
      px,
      { bold: true, ruleAbove: 1.2 }
    );

    d.y -= 22;
    d.subheading('What this suggests');
    const net = Math.round(projection.yearNet);
    d.bullet(
      `Year one revenue of about AED ${Math.round(projection.yearRevenue).toLocaleString()} against running costs of about AED ${Math.round(projection.yearCosts).toLocaleString()}.`
    );
    d.bullet(
      net >= 0
        ? `That leaves roughly AED ${net.toLocaleString()} before the one-off setup costs in the previous section.`
        : `That is short by roughly AED ${Math.abs(net).toLocaleString()}, before the one-off setup costs in the previous section. Expect to fund that gap.`
    );
    d.bullet(
      projection.breakEvenMonth
        ? `Monthly revenue overtakes monthly costs around month ${projection.breakEvenMonth}.`
        : 'On these numbers monthly revenue does not overtake monthly costs within the first year. Raising the price, winning customers faster, or cutting running costs would each change that.'
    );

    d.y -= 8;
    d.paragraph(
      'This projection is arithmetic on the figures you supplied, not a forecast or a guarantee. Real results depend on demand, pricing power, and how quickly you can actually win customers. Treat it as a way to test whether your assumptions hold together.',
      { size: 9.5, color: MUTED }
    );
  }

  /* ---------- Page numbers (skip the cover) ---------- */
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    if (i === 0) return;
    const label = `${i} / ${pages.length - 1}`;
    page.drawText(label, {
      x: PAGE_SIZE[0] - MARGIN - regular.widthOfTextAtSize(label, 8.5),
      y: PAGE_SIZE[1] - MARGIN + 14,
      size: 8.5,
      font: regular,
      color: MUTED,
    });
  });

  return doc.save();
}

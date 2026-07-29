import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { computeBudget } from './budgetCalculator.js';

const PAGE_SIZE = [595.28, 841.89]; // A4
const MARGIN = 56;
const DISCLAIMER =
  'Figures are rough estimates for early planning only. Confirm exact costs with the relevant free zone authority or the Dubai Department of Economy and Tourism (DED) before acting.';

const SECTION_LABELS = {
  problem_solution: 'Problem & Solution',
  target_market: 'Target Market & Customer',
  product: 'Product / Service Description',
  revenue_model: 'Revenue Model',
  marketing_plan: 'Marketing & Customer Acquisition Plan',
  team: 'Team',
  setup_type: 'UAE Setup Preference',
};

function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class PageCursor {
  constructor(doc, fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.page = null;
    this.y = 0;
  }

  newPage() {
    this.page = this.doc.addPage(PAGE_SIZE);
    this.y = PAGE_SIZE[1] - MARGIN;
    this.drawFooter();
    return this.page;
  }

  drawFooter() {
    const { regular } = this.fonts;
    const lines = wrapText(DISCLAIMER, regular, 8, PAGE_SIZE[0] - MARGIN * 2);
    let fy = MARGIN - 8 + lines.length * 10;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: fy,
        size: 8,
        font: regular,
        color: rgb(0.5, 0.5, 0.5),
      });
      fy -= 10;
    }
  }

  ensureSpace(height) {
    if (!this.page || this.y - height < MARGIN + 30) {
      this.newPage();
    }
  }

  heading(text) {
    this.ensureSpace(28);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 15,
      font: this.fonts.bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.y -= 24;
  }

  paragraph(text) {
    const size = 11;
    const lineHeight = 15;
    const lines = wrapText(text, this.fonts.regular, size, PAGE_SIZE[0] - MARGIN * 2);
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: rgb(0.15, 0.15, 0.15),
      });
      this.y -= lineHeight;
    }
    this.y -= 8;
  }

  tableRow(cols, widths, opts = {}) {
    const size = opts.size || 10;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    this.ensureSpace(18);
    let x = MARGIN;
    cols.forEach((col, i) => {
      this.page.drawText(String(col), { x, y: this.y, size, font, color: rgb(0.1, 0.1, 0.1) });
      x += widths[i];
    });
    this.y -= 18;
  }
}

export async function generatePlanPdf(session) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cursor = new PageCursor(doc, { regular, bold });

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
  doc.setCreationDate(new Date());

  // Cover page
  const cover = cursor.newPage();
  cover.drawText('Business Plan', {
    x: MARGIN,
    y: PAGE_SIZE[1] - 220,
    size: 30,
    font: bold,
    color: rgb(0.05, 0.05, 0.05),
  });

  const taglineLines = wrapText(businessIdea, regular, 16, PAGE_SIZE[0] - MARGIN * 2);
  let taglineY = PAGE_SIZE[1] - 260;
  for (const line of taglineLines) {
    cover.drawText(line, {
      x: MARGIN,
      y: taglineY,
      size: 16,
      font: regular,
      color: rgb(0.3, 0.3, 0.3),
    });
    taglineY -= 21;
  }

  cover.drawText(dateStr, {
    x: MARGIN,
    y: taglineY - 12,
    size: 12,
    font: regular,
    color: rgb(0.45, 0.45, 0.45),
  });

  // Business plan sections
  cursor.newPage();
  cursor.heading('Business Plan');
  for (const [key, label] of Object.entries(SECTION_LABELS)) {
    const value = stage2[key];
    if (!value) continue;
    cursor.ensureSpace(50);
    cursor.page.drawText(label, {
      x: MARGIN,
      y: cursor.y,
      size: 12.5,
      font: bold,
      color: rgb(0.15, 0.15, 0.4),
    });
    cursor.y -= 18;
    cursor.paragraph(value);
  }

  // Budget breakdown
  const budget = computeBudget(stage3);
  cursor.newPage();
  cursor.heading('Budget Breakdown');
  cursor.paragraph(
    `Estimated setup: ${budget.setupType.replace('_', ' ')}, ${budget.visaCount} visa(s), ${budget.spaceNeeds} space.`
  );

  const colWidths = [260, 130, 130];
  cursor.tableRow(['Item', 'Low (AED)', 'High (AED)'], colWidths, { bold: true });
  for (const item of budget.lineItems) {
    cursor.tableRow(
      [item.label, item.min.toLocaleString(), item.max.toLocaleString()],
      colWidths
    );
  }
  cursor.y -= 6;
  cursor.tableRow(
    ['Estimated total (first year)', budget.totalMin.toLocaleString(), budget.totalMax.toLocaleString()],
    colWidths,
    { bold: true }
  );

  cursor.y -= 20;
  cursor.paragraph(budget.disclaimer);

  return doc.save();
}

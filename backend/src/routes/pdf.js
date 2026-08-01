import { Router } from 'express';
import { getSession } from '../db/sessions.js';
import { generatePlanPdf } from '../pdf/generatePlan.js';
import { computeBudget } from '../pdf/budgetCalculator.js';
import { computeProjection } from '../pdf/revenueProjection.js';
import { generateProsAndCons } from '../llm/prosAndCons.js';
import { generateConclusion } from '../llm/conclusion.js';

export const pdfRouter = Router();

pdfRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user_id && (!req.user || req.user.id !== session.user_id)) {
      return res.status(403).json({ error: 'This plan belongs to a different account.' });
    }

    // Worked out here so the strengths and risks can take the founder's own
    // budget and revenue assumptions into account. generateProsAndCons swallows
    // its own failures and returns null, so a model outage costs the section
    // rather than the document.
    // Setup type and team live in stage 2 now, so the budget needs both stages.
    const budget = computeBudget({
      ...(session.stage2_answers || {}),
      ...(session.stage3_answers || {}),
    });
    const projection = computeProjection(session.stage3_answers || {}, budget);
    // Run together rather than one after the other - they don't depend on each
    // other, and waiting for both in sequence doubles the wait on a download.
    const [analysis, conclusion] = await Promise.all([
      generateProsAndCons({
        stage1: session.stage1_answers || {},
        stage2: session.stage2_answers || {},
        budget,
        projection,
      }),
      generateConclusion({
        stage1: session.stage1_answers || {},
        stage2: session.stage2_answers || {},
        budget,
        projection,
      }),
    ]);

    const bytes = await generatePlanPdf(session, { analysis, conclusion });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="business-plan-${session.id}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
});

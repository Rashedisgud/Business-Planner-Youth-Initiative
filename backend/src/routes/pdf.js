import { Router } from 'express';
import { getSession } from '../db/sessions.js';
import { generatePlanPdf } from '../pdf/generatePlan.js';

export const pdfRouter = Router();

pdfRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user_id && (!req.user || req.user.id !== session.user_id)) {
      return res.status(403).json({ error: 'This plan belongs to a different account.' });
    }

    const bytes = await generatePlanPdf(session);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="business-plan-${session.id}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
});

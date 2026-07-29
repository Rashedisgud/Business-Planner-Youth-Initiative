import { Router } from 'express';
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  listSessionsForUser,
} from '../db/sessions.js';
import { requireAuth } from '../middleware/optionalAuth.js';
import { sessionCreateLimiter, answerLimiter } from '../middleware/rateLimiters.js';
import {
  questionAt,
  stageAnswersKey,
  isStageComplete,
} from '../config/questionFlow.js';
import { clarificationFor } from '../config/clarifications.js';
import { generateStage1Feedback } from '../llm/stage1Feedback.js';
import { validateAnswer } from '../llm/validateAnswer.js';

export const sessionRouter = Router();

const FEEDBACK_UNAVAILABLE =
  "Your answers are saved, but the automatic feedback couldn't be generated just now. That doesn't affect your plan - continue to the business plan builder and everything you've entered will still be used.";

function statusFor(session) {
  const { current_stage, current_question_index } = session;
  if (!isStageComplete(current_stage, current_question_index)) {
    const q = questionAt(current_stage, current_question_index);
    return { type: 'question', stage: current_stage, key: q.key, prompt: q.prompt };
  }
  if (current_stage === 1) {
    return { type: 'stage1_feedback', text: session.stage1_feedback };
  }
  if (current_stage === 2) {
    return { type: 'stage_complete', stage: 2 };
  }
  return { type: 'ready_for_pdf' };
}

function forbiddenIfNotOwner(session, user, res) {
  if (session.user_id && (!user || user.id !== session.user_id)) {
    res.status(403).json({ error: 'This plan belongs to a different account.' });
    return true;
  }
  return false;
}

sessionRouter.post('/', sessionCreateLimiter, async (req, res, next) => {
  try {
    const session = await createSession({ userId: req.user?.id ?? null });
    res.status(201).json({ session, status: statusFor(session) });
  } catch (err) {
    next(err);
  }
});

sessionRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const sessions = await listSessionsForUser(req.user.id);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

/**
 * Deleting is permanent, so it is restricted to plans the caller actually owns.
 * Anonymous plans have no owner and deliberately cannot be deleted this way -
 * there would be no way to prove the request came from whoever made them.
 */
sessionRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Plan not found' });
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'This plan belongs to a different account.' });
    }
    await deleteSession(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

sessionRouter.get('/:id', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (forbiddenIfNotOwner(session, req.user, res)) return;
    res.json({ session, status: statusFor(session) });
  } catch (err) {
    next(err);
  }
});

sessionRouter.post('/:id/answer', answerLimiter, async (req, res, next) => {
  try {
    const { value } = req.body;
    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'value is required' });
    }

    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (forbiddenIfNotOwner(session, req.user, res)) return;

    const { current_stage, current_question_index } = session;
    if (isStageComplete(current_stage, current_question_index)) {
      return res.status(400).json({ error: 'Current stage already complete; call /advance' });
    }

    const question = questionAt(current_stage, current_question_index);

    // Some questions offer to explain themselves. If this reply is asking for
    // that explanation rather than answering, give it and ask again instead of
    // recording "I'm not sure" as the answer.
    const clarification = clarificationFor(question.key, value.trim());
    if (clarification) {
      return res.json({
        session,
        status: { ...statusFor(session), note: clarification },
      });
    }

    const cleaned =
      current_stage === 2 ? await validateAnswer(question.prompt, value.trim()) : value.trim();

    const answersKey = stageAnswersKey(current_stage);
    const updatedAnswers = { ...session[answersKey], [question.key]: cleaned };
    const newIndex = current_question_index + 1;

    const patch = { [answersKey]: updatedAnswers, current_question_index: newIndex };

    if (current_stage === 1 && isStageComplete(1, newIndex)) {
      // Generating the feedback must never cost someone their answer. If the
      // model call fails we still save their progress and let them move on to
      // the plan builder, rather than stranding them on the last question.
      try {
        patch.stage1_feedback = await generateStage1Feedback(updatedAnswers);
      } catch (err) {
        console.error('Stage 1 feedback generation failed, saving answers anyway:', err.message);
        patch.stage1_feedback = FEEDBACK_UNAVAILABLE;
      }
    }

    const updated = await updateSession(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    res.json({ session: updated, status: statusFor(updated) });
  } catch (err) {
    next(err);
  }
});

sessionRouter.post('/:id/advance', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (forbiddenIfNotOwner(session, req.user, res)) return;

    const { current_stage, current_question_index } = session;
    if (!isStageComplete(current_stage, current_question_index)) {
      return res.status(400).json({ error: 'Current stage is not complete yet' });
    }
    if (current_stage >= 3) {
      return res.status(400).json({ error: 'Already at the final stage' });
    }

    const updated = await updateSession(req.params.id, {
      current_stage: current_stage + 1,
      current_question_index: 0,
    });
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    res.json({ session: updated, status: statusFor(updated) });
  } catch (err) {
    next(err);
  }
});

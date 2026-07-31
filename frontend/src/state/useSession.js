import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import questionsConfig from '../config/questions_config.json';

const STORAGE_KEY = 'byi_session_id';

const STAGE_INTROS = {
  1: "Hi, welcome! I'll help you sanity-check your business idea, then build a full plan and budget together. There are no wrong answers here - just tell me what you're thinking. Let's start with the idea itself.",
  2: "Nice work - that's the hardest part done. Now let's build out the full business plan. I'll take it one section at a time, and short answers are completely fine.",
  3: "Almost there. Last few are numbers, for your setup budget and a revenue projection. Don't worry about being precise - your best guess is genuinely enough.",
};

function questionsForStage(stage) {
  return questionsConfig.filter((q) => q.stage === stage);
}

/**
 * Short reference shown right alongside a question, automatically - a user
 * shouldn't have to type "explain" or "not sure" just to get a plain-language
 * definition of terms most first-time founders won't know.
 */
const QUESTION_HINTS = {
  // Keyed by stage and question key. Stage 3 re-confirms the setup type, so the
  // guide is attached only to stage 2 where the choice is actually made -
  // repeating the whole thing would just be clutter.
  '2:setup_type': [
    'Quick guide:',
    'Mainland - trade with anyone in the UAE, most activities allow full foreign ownership, usually needs real office space.',
    "Free zone - usually the cheapest and quickest to set up, but selling directly into the mainland typically needs a local distributor.",
    "Offshore - for holding assets or business outside the UAE only; you can't trade inside the UAE and it doesn't come with visas.",
    'Most first-time founders serving UAE customers start in a free zone, though it varies by emirate and activity.',
  ].join('\n'),
};

function hintFor(stage, key) {
  const text = QUESTION_HINTS[`${stage}:${key}`];
  return text ? { text, kind: 'hint' } : null;
}

function buildTranscript(session) {
  const messages = [];
  for (const stage of [1, 2, 3]) {
    const answers = session[`stage${stage}_answers`] || {};
    const questions = questionsForStage(stage);
    const answeredAny = questions.some((q) => answers[q.key]);
    // Show the intro as soon as someone reaches a stage, not just once they've
    // answered something - otherwise a brand new chat opens on a bare question
    // with no greeting.
    if (!answeredAny && session.current_stage !== stage) continue;

    messages.push({ id: `intro-${stage}`, role: 'bot', text: STAGE_INTROS[stage] });
    for (const q of questions) {
      if (!answers[q.key]) break;
      messages.push({ id: `q-${stage}-${q.key}`, role: 'bot', text: q.prompt });
      const hint = hintFor(stage, q.key);
      if (hint) messages.push({ id: `hint-${stage}-${q.key}`, role: 'bot', ...hint });
      messages.push({ id: `a-${stage}-${q.key}`, role: 'user', text: answers[q.key] });
    }
  }
  return messages;
}

/**
 * A stage's opening line and its first question arrive as two bubbles back to
 * back, which reads as the bot talking twice before anyone has said anything.
 * They're one message instead - the greeting leads, the question follows.
 */
function mergeIntroIntoQuestion(messages) {
  const isIntro = (m) => m.role === 'bot' && m.id.startsWith('intro-');
  const isQuestion = (m) => m.role === 'bot' && /^(status-)?q-/.test(m.id);

  const merged = [];
  for (const msg of messages) {
    const previous = merged[merged.length - 1];
    if (previous && isIntro(previous) && isQuestion(msg)) {
      // Keep the question's identity and its example; take the greeting's words.
      merged[merged.length - 1] = { ...msg, text: `${previous.text}\n\n${msg.text}` };
      continue;
    }
    merged.push(msg);
  }
  return merged;
}

function messageForStatus(status) {
  if (!status) return null;
  if (status.type === 'question') {
    // The example rides along with the question rather than arriving as its own
    // bubble, so offering one on every question doesn't double the chat.
    return {
      id: `status-q-${status.key}`,
      role: 'bot',
      text: status.prompt,
      nudge: status.nudge || null,
    };
  }
  return null;
}

/** The guide for the question currently being asked. */
function hintForStatus(status, session) {
  if (status?.type !== 'question') return null;
  const hint = hintFor(session?.current_stage, status.key);
  return hint ? { id: `status-hint-${status.key}`, role: 'bot', ...hint } : null;
}

/** What they typed, when it wasn't recorded as an answer - a greeting, or a
    request for an explanation. Without it the reply reads like the bot talking
    to itself. */
function echoForStatus(status) {
  if (!status?.echo) return null;
  return { id: `status-echo-${status.key ?? 'x'}`, role: 'user', text: status.echo };
}

/** An explanation the bot gave in response to "I'm not sure", shown above the repeated question. */
function noteForStatus(status) {
  if (!status?.note) return null;
  return { id: `status-note-${status.key ?? 'x'}`, role: 'bot', text: status.note, kind: 'feedback' };
}

function trailingStatusMessage(status) {
  if (!status) return null;
  if (status.type === 'stage1_feedback')
    return { id: 'status-feedback', role: 'bot', text: status.text, kind: 'feedback' };
  if (status.type === 'stage_complete')
    return { id: `status-complete-${status.stage}`, role: 'bot', text: 'Nicely done - that section is complete.', kind: 'stage_complete' };
  if (status.type === 'ready_for_pdf')
    return {
      id: 'status-ready',
      role: 'bot',
      text: "That's everything - congratulations! Your full business plan and budget are ready to download below.",
      kind: 'ready_for_pdf',
    };
  return null;
}

export function useSession({ accessToken = null, resumeSessionId = null } = {}) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const applyResult = useCallback((result) => {
    setSession(result.session);
    setStatus(result.status);
    localStorage.setItem(STORAGE_KEY, result.session.id);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (resumeSessionId) {
          try {
            const result = await api.getSession(resumeSessionId, accessToken);
            applyResult(result);
            return;
          } catch {
            // The plan was deleted, possibly on another device. Fall through and
            // start a fresh one instead of stranding them on an error.
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        const params = new URLSearchParams(window.location.search);
        const paramSessionId = params.get('session');
        if (paramSessionId) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        const existingId = paramSessionId || localStorage.getItem(STORAGE_KEY);

        if (existingId) {
          try {
            const result = await api.getSession(existingId, accessToken);
            if (result.status.type !== 'ready_for_pdf') {
              applyResult(result);
              return;
            }
            // That plan is already finished - fall through to starting a fresh one
            // instead of reopening the completed plan every time.
          } catch {
            // Stored id points at a plan that's gone - drop it and start fresh.
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        const created = await api.createSession(accessToken);
        applyResult(created);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyResult, resumeSessionId]);

  const submitAnswer = useCallback(
    async (value) => {
      if (!session) return;
      setSending(true);
      setError(null);
      try {
        const result = await api.submitAnswer(session.id, value, accessToken);
        applyResult(result);
      } catch (err) {
        // If the plan vanished under us mid-conversation, quietly start a new
        // one rather than leaving them stuck on a dead session.
        if (/no longer exists|not found/i.test(err.message)) {
          localStorage.removeItem(STORAGE_KEY);
          const created = await api.createSession(accessToken);
          applyResult(created);
          setError("That plan was no longer available, so I've started a fresh one for you.");
        } else {
          setError(err.message);
        }
      } finally {
        setSending(false);
      }
    },
    [session, applyResult, accessToken]
  );

  const advanceStage = useCallback(async () => {
    if (!session) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.advanceStage(session.id, accessToken);
      applyResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }, [session, applyResult, accessToken]);

  const startNewSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.createSession(accessToken);
      applyResult(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, applyResult]);

  const messages = useMemo(() => {
    if (!session) return [];
    const transcript = buildTranscript(session);
    // An explanation comes before the question it relates to, since the question
    // is being asked again.
    for (const msg of [
      echoForStatus(status),
      noteForStatus(status),
      messageForStatus(status),
      hintForStatus(status, session),
      trailingStatusMessage(status),
    ]) {
      if (msg && !transcript.find((m) => m.id === msg.id)) transcript.push(msg);
    }
    return mergeIntroIntoQuestion(transcript);
  }, [session, status]);

  return {
    session,
    status,
    messages,
    loading,
    sending,
    error,
    submitAnswer,
    advanceStage,
    startNewSession,
  };
}

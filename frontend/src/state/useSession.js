import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import questionsConfig from '../config/questions_config.json';

const STORAGE_KEY = 'byi_session_id';

const STAGE_INTROS = {
  1: "Hi! I'll help you sanity-check your business idea, then build a full plan and budget. Let's start with the idea itself.",
  2: "Great, let's build the full business plan. I'll ask a few sections one at a time.",
  3: "Last step: a rough budget estimate for setting up in the UAE.",
};

function questionsForStage(stage) {
  return questionsConfig.filter((q) => q.stage === stage);
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
      messages.push({ id: `a-${stage}-${q.key}`, role: 'user', text: answers[q.key] });
    }
  }
  return messages;
}

function messageForStatus(status) {
  if (!status) return null;
  if (status.type === 'question') return { id: `status-q-${status.key}`, role: 'bot', text: status.prompt };
  if (status.type === 'stage1_feedback')
    return { id: 'status-feedback', role: 'bot', text: status.text, kind: 'feedback' };
  if (status.type === 'stage_complete')
    return { id: `status-complete-${status.stage}`, role: 'bot', text: 'Section complete.', kind: 'stage_complete' };
  if (status.type === 'ready_for_pdf')
    return { id: 'status-ready', role: 'bot', text: "You're done! Download your PDF business plan below.", kind: 'ready_for_pdf' };
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
          const result = await api.getSession(resumeSessionId, accessToken);
          applyResult(result);
          return;
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
            // fall through to creating a new session
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
        setError(err.message);
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
    const live = messageForStatus(status);
    if (live && !transcript.find((m) => m.id === live.id)) transcript.push(live);
    return transcript;
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

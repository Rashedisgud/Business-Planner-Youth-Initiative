import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Spinner from './Spinner.jsx';

const STAGE_LABEL = { 1: 'Idea Validation', 2: 'Business Plan', 3: 'Budget / Ready' };
const SESSION_KEY = 'byi_session_id';

export default function MyPlansModal({ accessToken, onClose, onResume }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listMySessions(accessToken)
      .then(({ sessions }) => {
        if (!cancelled) setSessions(sessions);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);
    try {
      await api.deleteSession(id, accessToken);
      setSessions((list) => list.filter((s) => s.id !== id));
      // Don't leave the browser pointing at a plan that no longer exists.
      if (localStorage.getItem(SESSION_KEY) === id) localStorage.removeItem(SESSION_KEY);
      setConfirmingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>My plans</h3>

        {loading && <Spinner />}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && sessions.length === 0 && (
          <p className="reviews-empty">You haven't started a plan yet.</p>
        )}

        {!loading && sessions.length > 0 && (
          <div className="my-plans-list">
            {sessions.map((s) => (
              <div className="my-plan-row" key={s.id}>
                <div className="my-plan-info">
                  <p className="my-plan-title">{s.stage1_answers?.idea || 'Untitled idea'}</p>
                  <p className="my-plan-meta">{STAGE_LABEL[s.current_stage]}</p>
                </div>

                {confirmingId === s.id ? (
                  <div className="my-plan-actions">
                    <span className="my-plan-confirm">Delete for good?</span>
                    <button
                      className="link-button link-button--danger"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                    >
                      {deletingId === s.id ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button className="link-button" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="my-plan-actions">
                    <button className="btn-secondary" onClick={() => onResume(s.id)}>
                      Resume
                    </button>
                    <button
                      className="link-button link-button--danger"
                      onClick={() => setConfirmingId(s.id)}
                      aria-label={`Delete plan: ${s.stage1_answers?.idea || 'Untitled idea'}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

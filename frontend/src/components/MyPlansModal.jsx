import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Spinner from './Spinner.jsx';

const STAGE_LABEL = { 1: 'Idea Validation', 2: 'Business Plan', 3: 'Budget / Ready' };

export default function MyPlansModal({ accessToken, onClose, onResume }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        {!loading && !error && sessions.length > 0 && (
          <div className="my-plans-list">
            {sessions.map((s) => (
              <div className="my-plan-row" key={s.id}>
                <div>
                  <p className="my-plan-title">{s.stage1_answers?.idea || 'Untitled idea'}</p>
                  <p className="my-plan-meta">{STAGE_LABEL[s.current_stage]}</p>
                </div>
                <button className="btn-secondary" onClick={() => onResume(s.id)}>
                  Resume
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

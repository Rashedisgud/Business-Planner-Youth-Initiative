import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAdminAuth } from '../state/useAdminAuth.js';
import AdminUnlock from './AdminUnlock.jsx';

const EMPTY_FORM = { author_name: '', role_or_company: '', quote: '', rating: 5 };

function Stars({ value, onChange }) {
  return (
    <div className={`star-picker ${onChange ? 'star-picker--interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= value ? 'star--filled' : ''}`}
          onClick={onChange ? () => onChange(n) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewForm({ initial, onCancel, onSubmit, saving, error }) {
  const [form, setForm] = useState(initial);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <form
      className="review-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <label htmlFor="review-author">Name</label>
      <input
        id="review-author"
        value={form.author_name}
        onChange={(e) => update('author_name', e.target.value)}
        placeholder="Customer name"
        required
      />

      <label htmlFor="review-role">Role / company (optional)</label>
      <input
        id="review-role"
        value={form.role_or_company || ''}
        onChange={(e) => update('role_or_company', e.target.value)}
        placeholder="e.g. Founder, Retail"
      />

      <label htmlFor="review-quote">Review</label>
      <textarea
        id="review-quote"
        value={form.quote}
        onChange={(e) => update('quote', e.target.value)}
        rows={3}
        required
      />

      <label>Rating</label>
      <Stars value={form.rating} onChange={(n) => update('rating', n)} />

      {error && <p className="error-text">{error}</p>}

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save review'}
        </button>
      </div>
    </form>
  );
}

export default function ReviewsSection({ editable = false }) {
  const { password, isUnlocked: isAuthed, verify, forget } = useAdminAuth();
  const isUnlocked = editable && isAuthed;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showUnlock, setShowUnlock] = useState(false);
  const [formMode, setFormMode] = useState(null); // null | 'add' | reviewId being edited
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listReviews()
      .then(({ reviews }) => {
        if (!cancelled) setReviews(reviews);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlock(candidate) {
    await verify(candidate);
    setShowUnlock(false);
  }

  async function handleSubmit(form) {
    setSaving(true);
    setFormError(null);
    try {
      if (formMode === 'add') {
        const { review } = await api.createReview(form, password);
        setReviews((r) => [review, ...r]);
      } else {
        const { review } = await api.updateReview(formMode, form, password);
        setReviews((r) => r.map((x) => (x.id === review.id ? review : x)));
      }
      setFormMode(null);
    } catch (err) {
      if (err.message?.toLowerCase().includes('incorrect admin password')) {
        forget();
        setFormError('Your saved password was rejected - please unlock again.');
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.deleteReview(id, password);
      setReviews((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      if (err.message?.toLowerCase().includes('incorrect admin password')) {
        forget();
      } else {
        window.alert(err.message);
      }
    }
  }

  if (loading || loadError) return null;
  if (!isUnlocked && reviews.length === 0) return null;

  return (
    <section id="reviews" className="section reviews-section">
      <div className="section-inner">
        <span className="section-eyebrow">Reviews</span>
        <h2 className="section-title">What users are saying</h2>

        {reviews.length > 0 && (
          <div className="reviews-grid">
            {reviews.map((r) => (
              <div className="review-card" key={r.id}>
                <Stars value={r.rating} />
                <p className="review-quote">&ldquo;{r.quote}&rdquo;</p>
                <p className="review-author">
                  {r.author_name}
                  {r.role_or_company ? <span className="review-role"> - {r.role_or_company}</span> : null}
                </p>
                {isUnlocked && (
                  <div className="review-admin-actions">
                    <button
                      className="link-button"
                      onClick={() => {
                        setFormMode(r.id);
                        setFormError(null);
                      }}
                    >
                      Edit
                    </button>
                    <button className="link-button" onClick={() => handleDelete(r.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isUnlocked && reviews.length === 0 && (
          <p className="reviews-empty">No reviews yet - add the first one.</p>
        )}

        {isUnlocked && formMode === null && (
          <button className="btn-secondary" onClick={() => setFormMode('add')}>
            + Add review
          </button>
        )}

        {isUnlocked && formMode !== null && (
          <div className="review-form-wrap">
            <ReviewForm
              initial={formMode === 'add' ? EMPTY_FORM : reviews.find((r) => r.id === formMode)}
              onCancel={() => {
                setFormMode(null);
                setFormError(null);
              }}
              onSubmit={handleSubmit}
              saving={saving}
              error={formError}
            />
          </div>
        )}

        {editable && !isUnlocked && (
          <div className="reviews-manage-link">
            {showUnlock ? (
              <AdminUnlock
                label="Enter your admin password"
                onUnlock={handleUnlock}
                onCancel={() => setShowUnlock(false)}
              />
            ) : (
              <button className="link-button" onClick={() => setShowUnlock(true)}>
                Unlock
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

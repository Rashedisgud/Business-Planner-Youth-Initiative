import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAdminAuth } from '../state/useAdminAuth.js';
import AdminUnlock from './AdminUnlock.jsx';

const FIELDS = [
  { key: 'email', label: 'Email', type: 'email', placeholder: 'hello@bypi.org' },
  { key: 'phone', label: 'Phone or WhatsApp', type: 'tel', placeholder: '+971 50 000 0000' },
  { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@bpyi' },
];

/** Turns a stored value into something clickable where that makes sense. */
function linkFor(key, value) {
  if (key === 'email') return `mailto:${value}`;
  if (key === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`;
  if (key === 'instagram') return `https://instagram.com/${value.replace(/^@/, '')}`;
  return null;
}

export default function ContactPanel({ editable = false }) {
  const { password, isUnlocked, verify, forget } = useAdminAuth();

  const [contact, setContact] = useState(null);
  const [mode, setMode] = useState('view'); // 'view' | 'password' | 'edit'
  const [draft, setDraft] = useState({ email: '', phone: '', instagram: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getContact()
      .then(({ contact }) => {
        if (cancelled) return;
        setContact(contact);
        setDraft({
          email: contact?.email || '',
          phone: contact?.phone || '',
          instagram: contact?.instagram || '',
        });
      })
      .catch(() => {
        // A missing contact row shouldn't take the footer down with it.
        if (!cancelled) setContact(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { contact: updated } = await api.updateContact(draft, password);
      setContact(updated);
      setMode('view');
    } catch (err) {
      if (err.message?.toLowerCase().includes('incorrect admin password')) {
        forget();
        setMode('password');
        setError('Your saved password was rejected - please re-enter it.');
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  // Only what's actually been filled in. A blank field is left out rather than
  // shown as an empty label.
  const filled = FIELDS.filter((f) => contact?.[f.key]);

  if (mode === 'edit') {
    return (
      <form className="contact-edit" onSubmit={handleSave}>
        {FIELDS.map((f) => (
          <div className="contact-field" key={f.key}>
            <label htmlFor={`contact-${f.key}`}>{f.label}</label>
            <input
              id={`contact-${f.key}`}
              type={f.type}
              value={draft[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <p className="contact-note">Leave a field empty to hide it.</p>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="contact-view">
      {filled.length > 0 && (
        <ul className="contact-list">
          {filled.map((f) => (
            <li key={f.key}>
              <span className="contact-label">{f.label}</span>
              <a href={linkFor(f.key, contact[f.key])} target={f.key === 'instagram' ? '_blank' : undefined} rel="noreferrer">
                {contact[f.key]}
              </a>
            </li>
          ))}
        </ul>
      )}

      {filled.length === 0 && editable && (
        <p className="contact-note">No contact details yet.</p>
      )}

      {editable && mode === 'view' && (
        <button className="btn-secondary btn-edit" onClick={() => setMode(isUnlocked ? 'edit' : 'password')}>
          ✎ Edit contact details
        </button>
      )}

      {mode === 'password' && (
        <AdminUnlock
          onUnlock={async (candidate) => {
            await verify(candidate);
            setMode('edit');
          }}
          onCancel={() => setMode('view')}
        />
      )}
    </div>
  );
}

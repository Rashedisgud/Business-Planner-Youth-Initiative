import { useState } from 'react';

const MIN_LENGTH = 6;

export default function PasswordModal({ email, onClose, onChangePassword }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two don't match.");
      return;
    }

    setBusy(true);
    try {
      await onChangePassword(password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>Change password</h3>

        {done ? (
          <div>
            <p className="auth-info">
              Done - your password has been changed. You'll use the new one next time you sign in.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {email && <p className="auth-subtle">Signed in as {email}</p>}

            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Change password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

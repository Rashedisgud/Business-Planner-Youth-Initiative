import { useState } from 'react';

export default function AdminUnlock({ onUnlock, onCancel, label = 'Enter admin password to edit' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await onUnlock(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form className="admin-unlock-form" onSubmit={handleSubmit}>
      <label htmlFor="admin-unlock-password">{label}</label>
      <input
        id="admin-unlock-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <p className="error-text">{error}</p>}
      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={verifying || !password}>
          {verifying ? 'Checking...' : 'Unlock'}
        </button>
      </div>
    </form>
  );
}

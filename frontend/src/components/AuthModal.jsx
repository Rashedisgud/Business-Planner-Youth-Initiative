import { useState } from 'react';

export default function AuthModal({ onClose, onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await onSignUp(email, password);
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        } else {
          // Already signed in - nothing to confirm.
          onClose();
        }
      } else {
        await onSignIn(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>{mode === 'signup' ? 'Create your account' : 'Sign in'}</h3>
        <p>
          {mode === 'signup'
            ? 'Save your plans so you can pick up where you left off, on any device.'
            : 'Sign in to see your saved plans.'}
        </p>

        <form className="admin-unlock-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p className="error-text">{error}</p>}
          {info && <p className="reviews-empty">{info}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
                setInfo(null);
              }}
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

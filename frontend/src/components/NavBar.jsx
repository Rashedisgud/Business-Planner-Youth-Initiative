import { useState, Fragment } from 'react';
import UaeFlagIcon from './UaeFlagIcon.jsx';
import AuthModal from './AuthModal.jsx';
import MyPlansModal from './MyPlansModal.jsx';
import PasswordModal from './PasswordModal.jsx';

export default function NavBar({ onStart, auth, onResumeSession }) {
  const [showAuth, setShowAuth] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, accessToken, signIn, signUp, signOut, changePassword, requestPasswordReset } = auth;

  return (
    <Fragment>
      <header className="nav-bar">
        <div className="nav-inner">
          <a className="nav-brand" href="#top">
            <span className="brand-mark">
              <UaeFlagIcon size={16} />
            </span>
            <span className="nav-brand-text">BPYI</span>
          </a>
          <nav className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#founder">Founder</a>
          </nav>

          {user ? (
            <div className="nav-account">
              <button className="link-button" onClick={() => setShowPlans(true)}>
                My plans
              </button>
              <button className="link-button nav-password" onClick={() => setShowPassword(true)}>
                Password
              </button>
              <button className="link-button" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="link-button nav-signin" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}

          <button className="btn-primary nav-cta" onClick={onStart}>
            Get started
          </button>
        </div>
      </header>

      {/* Rendered outside <header> deliberately: that element uses backdrop-filter,
          which creates a new containing block for position:fixed descendants and
          would otherwise pin these full-screen modals to the header's small box
          instead of the viewport. */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onRequestPasswordReset={requestPasswordReset}
        />
      )}

      {showPassword && (
        <PasswordModal
          email={user?.email}
          onClose={() => setShowPassword(false)}
          onChangePassword={changePassword}
        />
      )}

      {showPlans && (
        <MyPlansModal
          accessToken={accessToken}
          onClose={() => setShowPlans(false)}
          onResume={(id) => {
            setShowPlans(false);
            onResumeSession(id);
          }}
        />
      )}
    </Fragment>
  );
}

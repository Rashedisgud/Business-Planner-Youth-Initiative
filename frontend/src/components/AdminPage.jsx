import { useAdminAuth } from '../state/useAdminAuth.js';
import AdminUnlock from './AdminUnlock.jsx';
import FounderPanel from './FounderPanel.jsx';
import ReviewsSection from './ReviewsSection.jsx';
import ContactPanel from './ContactPanel.jsx';
import UaeFlagIcon from './UaeFlagIcon.jsx';

export default function AdminPage({ onGoHome }) {
  const { isUnlocked, verify } = useAdminAuth();

  return (
    <div className="home-page">
      <header className="nav-bar">
        <div className="nav-inner">
          <button className="nav-brand" onClick={onGoHome}>
            <span className="brand-mark">
              <UaeFlagIcon size={16} />
            </span>
            <span className="nav-brand-text">BPYI Admin</span>
          </button>
          <button className="link-button" onClick={onGoHome}>
            ← Back to site
          </button>
        </div>
      </header>

      {!isUnlocked ? (
        <section className="section">
          <div className="section-inner section-inner--narrow">
            <span className="section-eyebrow">Admin</span>
            <h2 className="section-title">Sign in to manage this site</h2>
            <div className="founder-section-card">
              <AdminUnlock label="Admin password" onUnlock={verify} />
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <div className="section-inner section-inner--narrow">
              <span className="section-eyebrow">Admin</span>
              <h2 className="section-title">Team section</h2>
              <div className="founder-section-card">
                <FounderPanel editable person={1} role="Founder" heading="Meet the founder" />
              </div>
              <div className="founder-section-card founder-section-card--second">
                <FounderPanel
                  editable
                  person={2}
                  role="Co-founder"
                  heading="Meet the co-founder"
                  emptyLabel="Not filled in yet - add the co-founder's details here, or leave blank to hide."
                />
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-inner section-inner--narrow">
              <span className="section-eyebrow">Admin</span>
              <h2 className="section-title">Contact details</h2>
              <div className="founder-section-card">
                <ContactPanel editable />
              </div>
            </div>
          </section>

          <ReviewsSection editable />
        </>
      )}
    </div>
  );
}

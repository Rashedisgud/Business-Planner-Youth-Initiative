export default function Hero({ onStart }) {
  return (
    <section className="hero" id="top">
      <div className="section-inner hero-inner">
        <span className="section-eyebrow">100% free - no account, no payment</span>
        <h1 className="hero-title">
          Turn your business idea into a plan a bank will actually accept.
        </h1>
        <p className="hero-subtitle">
          Answer a few questions in a guided chat and get a structured business plan and UAE
          budget estimate - not a blank template, not a one-shot AI essay you have to untangle.
        </p>
        <div className="hero-actions">
          <button className="btn-primary btn-lg" onClick={onStart}>
            Get started
          </button>
          <a className="hero-secondary-link" href="#how-it-works">
            See how it works ↓
          </a>
        </div>
        <p className="hero-note">
          Takes about 5 minutes. The full plan, budget, and PDF are free - no card required.
        </p>
      </div>
    </section>
  );
}

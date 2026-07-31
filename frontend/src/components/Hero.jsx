export default function Hero({ onStart }) {
  return (
    <section className="hero" id="top">
      <div className="section-inner hero-inner">
        <span className="section-eyebrow">Free. No account needed.</span>
        <h1 className="hero-title">
          Turn your business idea into a plan a bank will actually accept.
        </h1>
        <p className="hero-subtitle">
          A guided chat walks you through the questions a real business plan has to answer.
          What comes out at the end is built from what you typed, not written around it.
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
          Around five minutes from start to finish. Nothing to pay at any point.
        </p>
      </div>
    </section>
  );
}

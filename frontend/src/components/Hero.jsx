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
        </div>
        <p className="hero-note">
          Around five minutes from start to finish. Nothing to pay at any point.
        </p>

        {/* A miniature of the real cover page. It replaced a "see how it works"
            link that pointed at the section directly below it, and being cut off
            at the fold does the same job of showing there is more down there. */}
        <div className="hero-doc" aria-hidden="true">
          <div className="hero-doc-page">
            <div className="hero-doc-bar" />
            <div className="hero-doc-body">
              <span className="hero-doc-eyebrow">BUSINESS PLAN</span>
              <div className="hero-doc-title">
                <span />
                <span />
              </div>
              <div className="hero-doc-rule" />
              <div className="hero-doc-date" />
              <div className="hero-doc-rows">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

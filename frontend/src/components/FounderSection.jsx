import FounderPanel from './FounderPanel.jsx';

export default function FounderSection() {
  return (
    <section id="founder" className="section founder-section">
      <div className="section-inner section-inner--narrow">
        <span className="section-eyebrow">About</span>
        <h2 className="section-title">Meet the team</h2>
        <div className="founder-section-card">
          <FounderPanel person={1} role="Founder" heading="Meet the founder" />
        </div>
        <div className="founder-section-card founder-section-card--second">
          <FounderPanel
            person={2}
            role="Co-founder"
            heading="Meet the co-founder"
            emptyLabel="The co-founder section hasn't been filled in yet."
          />
        </div>
      </div>
    </section>
  );
}

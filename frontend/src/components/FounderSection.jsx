import FounderPanel from './FounderPanel.jsx';

export default function FounderSection() {
  return (
    <section id="founder" className="section founder-section">
      <div className="section-inner section-inner--narrow">
        <span className="section-eyebrow">About</span>
        <h2 className="section-title">Meet the founder</h2>
        <div className="founder-section-card">
          <FounderPanel />
        </div>
      </div>
    </section>
  );
}

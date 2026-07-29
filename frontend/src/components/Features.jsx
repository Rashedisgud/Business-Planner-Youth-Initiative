import UaeFlagIcon from './UaeFlagIcon.jsx';

const FEATURES = [
  {
    icon: '📋',
    title: 'Structured, not generic',
    body: 'Every answer is stored as structured data and dropped into a fixed template - not a wall of AI-generated text you have to edit down.',
  },
  {
    icon: 'flag',
    title: 'Built for UAE specifics',
    body: 'Mainland vs. free zone vs. offshore, visa costs, trade license ranges - the questions and budget benchmarks are written for this market, not adapted from a generic template.',
  },
  {
    icon: '🆓',
    title: 'Completely free',
    body: 'Every stage - idea check, full business plan, budget estimate, and the PDF download - costs nothing. No card, no subscription, no catch.',
  },
  {
    icon: '📄',
    title: 'One clear PDF',
    body: 'Cover page, full business plan, and a budget table with a plain-language disclaimer - ready to attach to a bank or free zone application.',
  },
];

export default function Features() {
  return (
    <section className="section features-section">
      <div className="section-inner">
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">
                {f.icon === 'flag' ? <UaeFlagIcon size={22} /> : f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

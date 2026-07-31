import UaeFlagIcon from './UaeFlagIcon.jsx';

const FEATURES = [
  {
    icon: 'flag',
    title: 'Written for the UAE',
    body: 'Mainland, free zone and offshore explained in plain terms, with licence and visa costs from real benchmark ranges rather than a template borrowed from somewhere else.',
  },
  {
    icon: '✎',
    title: 'Your words, kept',
    body: 'Each answer is stored as its own field and placed in the document. Nothing gets rewritten into something you would not recognise.',
  },
  {
    icon: '↺',
    title: 'Stop and come back',
    body: 'Progress saves as you go. Make an account and your plans follow you to another device.',
  },
  {
    icon: '↓',
    title: 'One PDF at the end',
    body: 'Plan, budget, revenue projection, and the risks worth planning for. Free, with no card at any point.',
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

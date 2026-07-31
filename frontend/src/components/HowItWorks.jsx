const STEPS = [
  {
    n: '1',
    label: 'Check the idea',
    body:
      'Four questions about what you want to build, who it serves, and who already does something like it. You get an honest read on whether the demand is there and what to think harder about.',
  },
  {
    n: '2',
    label: 'Build the plan',
    body:
      'Five sections, one at a time: what you sell, how it makes money, how people find you, who is working on it, and how you want to set up in the UAE. Answers are stored as fields, so they land in the document properly rather than as pasted chat.',
  },
  {
    n: '3',
    label: 'Work out the money',
    body:
      'Trade licence, staff visas, space, and marketing, priced from benchmark ranges for the UAE. Add what you plan to charge and it projects twelve months of revenue against your running costs.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="section-inner">
        <span className="section-eyebrow">How it works</span>
        <h2 className="section-title">Three stages, then a PDF you can hand over.</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-number">{s.n}</div>
              <h3>{s.label}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <p className="steps-footnote">
          The document covers your plan, a setup budget, a revenue projection, and an honest look
          at what could go wrong. Every cost figure is labelled as an estimate, because that is
          what it is.
        </p>
      </div>
    </section>
  );
}

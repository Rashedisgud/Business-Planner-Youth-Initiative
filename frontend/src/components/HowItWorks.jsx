const STEPS = [
  {
    n: '1',
    label: 'Idea Validation',
    body:
      "Answer 5 quick questions about your idea, customer, and competitors. Get a sanity check on demand, how you stack up against similar UAE businesses, and the red flags to think through before you go further.",
  },
  {
    n: '2',
    label: 'Business Plan Builder',
    body:
      'Work through 7 sections one at a time - problem, market, product, revenue, marketing, team, and UAE setup type. Every answer is saved as structured data, not just chat text, so it drops cleanly into your PDF.',
  },
  {
    n: '3',
    label: 'Budget Estimator',
    body:
      'Get a cost breakdown for trade license, visas, office or flexi-desk space, and marketing, based on rough UAE benchmark ranges - clearly labeled as estimates, not guaranteed figures.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="section-inner">
        <span className="section-eyebrow">How it works</span>
        <h2 className="section-title">Three guided stages, all free. One clear PDF at the end.</h2>
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
          Finish stages 2 and 3, then download a PDF with a cover page, your full business plan,
          and a budget breakdown table - ready for a bank, free zone application, or your own
          clarity. No payment at any point.
        </p>
      </div>
    </section>
  );
}

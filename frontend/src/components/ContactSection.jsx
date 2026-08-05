import ContactPanel from './ContactPanel.jsx';

/**
 * A visible home-page section for contact details, so the info isn't only
 * findable at the bottom of the page. The panel underneath is the same one
 * used by the admin and the footer - display styles are scoped to the wrapper
 * below rather than duplicated into the panel itself.
 */
export default function ContactSection() {
  return (
    <section id="contact" className="section contact-section">
      <div className="section-inner section-inner--narrow">
        <span className="section-eyebrow">Get in touch</span>
        <h2 className="section-title">Questions or feedback?</h2>
        <p className="section-lead">
          If something isn't working, or you have an idea for what BPYI should do next, we would
          rather hear it than not.
        </p>
        <div className="contact-section-card">
          <ContactPanel />
        </div>
      </div>
    </section>
  );
}

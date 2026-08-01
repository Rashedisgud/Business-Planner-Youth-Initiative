import UaeFlagIcon from './UaeFlagIcon.jsx';

// Change this and the address in the mailto below stays in step. A domain
// address rather than anyone's personal inbox: it can be pointed somewhere else
// later without editing the site, and it keeps a private address off a public
// page aimed at students.
const CONTACT_EMAIL = 'hello@bypi.org';

export default function Footer({ onAdminClick }) {
  return (
    <footer className="site-footer">
      <div className="section-inner footer-inner">
        <div className="footer-brand">
          <UaeFlagIcon size={16} />
          <span>Business Planner Youth Initiative (BPYI)</span>
        </div>

        <p className="footer-contact">
          Questions, or something not working?{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p className="footer-disclaimer">
          Cost figures, license types, and other UAE-specific information shown by this tool are
          rough estimates for planning purposes only. Confirm exact costs and requirements with
          the relevant free zone authority or the Dubai Department of Economy and Tourism (DED)
          before acting. This tool does not provide legal, financial, or investment advice.
        </p>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Business Planner Youth Initiative (BPYI).{' '}
          <button className="link-button footer-admin-link" onClick={onAdminClick}>
            Site admin
          </button>
        </p>
      </div>
    </footer>
  );
}

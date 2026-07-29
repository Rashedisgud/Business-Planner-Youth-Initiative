import UaeFlagIcon from './UaeFlagIcon.jsx';

export default function Footer({ onAdminClick }) {
  return (
    <footer className="site-footer">
      <div className="section-inner footer-inner">
        <div className="footer-brand">
          <UaeFlagIcon size={16} />
          <span>Business Planner Youth Initiative (BPYI)</span>
        </div>
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

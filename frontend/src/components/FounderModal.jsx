import FounderPanel from './FounderPanel.jsx';

export default function FounderModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--founder" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <FounderPanel />
      </div>
    </div>
  );
}

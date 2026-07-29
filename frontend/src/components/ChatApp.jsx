import { useState } from 'react';
import { useSession } from '../state/useSession.js';
import { api } from '../api/client.js';
import ChatWindow from './ChatWindow.jsx';
import AnswerInput from './AnswerInput.jsx';
import StageProgress from './StageProgress.jsx';
import FounderModal from './FounderModal.jsx';
import UaeFlagIcon from './UaeFlagIcon.jsx';
import Spinner from './Spinner.jsx';

export default function ChatApp({ onGoHome, auth, resumeSessionId }) {
  const { accessToken } = auth;
  const { session, status, messages, loading, sending, error, submitAnswer, advanceStage, startNewSession } =
    useSession({ accessToken, resumeSessionId });
  const [showFounder, setShowFounder] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) {
    return (
      <div className="app-shell app-shell--center">
        <Spinner label="Setting up your plan..." />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="app-shell app-shell--center">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  const stageLabel = { 1: 'Continue to Business Plan Builder', 2: 'Continue to Budget Estimator' };

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await api.downloadPdf(session.id, accessToken);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-row">
          <button className="brand-mark brand-mark--button" onClick={onGoHome} aria-label="Back to home">
            <UaeFlagIcon size={18} />
          </button>
          <div className="brand-text">
            <h1>Business Planner Youth Initiative (BPYI)</h1>
            <p>From idea to a bank-ready plan and budget</p>
          </div>
          <button className="about-founder-link" onClick={() => setShowFounder(true)}>
            About the founder
          </button>
        </div>
        <StageProgress currentStage={session?.current_stage || 1} />
      </header>

      <ChatWindow messages={messages} sending={sending} />

      {error && <p className="error-text">{error}</p>}

      {status?.type === 'question' && (
        <AnswerInput onSubmit={submitAnswer} disabled={sending} />
      )}

      {status?.type === 'stage1_feedback' && (
        <div className="action-row">
          <button className="btn-primary" onClick={advanceStage} disabled={sending}>
            {stageLabel[1]}
          </button>
        </div>
      )}

      {status?.type === 'stage_complete' && (
        <div className="action-row">
          <button className="btn-primary" onClick={advanceStage} disabled={sending}>
            {stageLabel[status.stage]}
          </button>
        </div>
      )}

      {status?.type === 'ready_for_pdf' && (
        <div className="action-row action-row--split">
          <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
          <button className="btn-secondary" onClick={startNewSession} disabled={downloading}>
            Start a new plan
          </button>
        </div>
      )}

      {downloadError && <p className="error-text">{downloadError}</p>}

      {showFounder && <FounderModal onClose={() => setShowFounder(false)} />}
    </div>
  );
}

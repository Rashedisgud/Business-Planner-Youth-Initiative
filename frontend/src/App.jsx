import { useState } from 'react';
import { useAuth } from './state/useAuth.js';
import HomePage from './components/HomePage.jsx';
import ChatApp from './components/ChatApp.jsx';
import AdminPage from './components/AdminPage.jsx';
import Spinner from './components/Spinner.jsx';

function initialView() {
  return window.location.hash === '#admin' ? 'admin' : 'home';
}

export default function App() {
  const auth = useAuth();
  const [view, setView] = useState(initialView); // 'home' | 'chat' | 'admin'
  const [resumeSessionId, setResumeSessionId] = useState(null);

  if (auth.loading) {
    return (
      <div className="app-shell app-shell--center">
        <Spinner />
      </div>
    );
  }

  function startNew() {
    setResumeSessionId(null);
    setView('chat');
  }

  function resumeSession(id) {
    setResumeSessionId(id);
    setView('chat');
  }

  function goAdmin() {
    window.history.replaceState({}, '', '#admin');
    setView('admin');
  }

  function goHome() {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    setView('home');
  }

  if (view === 'chat') {
    return <ChatApp auth={auth} resumeSessionId={resumeSessionId} onGoHome={goHome} />;
  }

  if (view === 'admin') {
    return <AdminPage onGoHome={goHome} />;
  }

  return <HomePage auth={auth} onStart={startNew} onResumeSession={resumeSession} onAdminClick={goAdmin} />;
}

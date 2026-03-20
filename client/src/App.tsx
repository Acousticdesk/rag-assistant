import { ApiKeySetup } from './components/ApiKeySetup';
import { ChatWindow } from './components/ChatWindow';
import { DocumentUpload } from './components/DocumentUpload';
import { useSession } from './hooks/useSession';
import './App.css';

function App() {
  const { session, saveSession, clearSession } = useSession();

  if (!session) {
    return <ApiKeySetup onSave={saveSession} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">✦</div>
            <span className="sidebar-logo-text">RAG Assistant</span>
          </div>
          <span className="provider-badge">{session.provider}</span>
        </div>

        <div className="sidebar-content">
          <p className="sidebar-section-title">Context Documents</p>
          <DocumentUpload session={session} />
        </div>

        <div className="sidebar-footer">
          <button className="btn-signout" onClick={clearSession}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <ChatWindow session={session} />
      </main>
    </div>
  );
}

export default App;

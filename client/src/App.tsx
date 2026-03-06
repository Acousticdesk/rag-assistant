import { useState } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ChatWindow } from './components/ChatWindow';
import { DocumentUpload } from './components/DocumentUpload';
import { useSession } from './hooks/useSession';
import './App.css';

function App() {
  const { session, saveSession, clearSession } = useSession();
  const [view, setView] = useState<'chat' | 'upload'>('chat');

  if (!session) {
    return <ApiKeySetup onSave={saveSession} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>RAG Assistant</h1>
        <nav>
          <button
            className={view === 'chat' ? 'active' : ''}
            onClick={() => setView('chat')}
          >
            Chat
          </button>
          <button
            className={view === 'upload' ? 'active' : ''}
            onClick={() => setView('upload')}
          >
            Upload
          </button>
          <button className="logout" onClick={clearSession}>
            Sign out
          </button>
        </nav>
      </header>
      <main>
        {view === 'chat' ? (
          <ChatWindow session={session} />
        ) : (
          <DocumentUpload session={session} />
        )}
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import type { Session } from '../hooks/useSession';
import './ApiKeySetup.css';

interface Props {
  onSave: (session: Session) => void;
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', available: true },
  { id: 'anthropic', label: 'Anthropic', available: false },
  { id: 'gemini', label: 'Google Gemini', available: false },
];

export function ApiKeySetup({ onSave }: Props) {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    onSave({ provider, apiKey: apiKey.trim() });
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <h2>Welcome to RAG Assistant</h2>
        <p className="setup-subtitle">
          Enter your API key to get started. It is stored only in your browser
          session and never sent to our servers.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Provider
            <div className="provider-grid">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={!p.available}
                  className={`provider-btn ${provider === p.id ? 'selected' : ''}`}
                  onClick={() => p.available && setProvider(p.id)}
                >
                  {p.label}
                  {!p.available && (
                    <span className="coming-soon">Coming soon</span>
                  )}
                </button>
              ))}
            </div>
          </label>

          <label>
            API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="sk-..."
              autoComplete="off"
            />
          </label>

          {error && <p className="setup-error">{error}</p>}

          <button type="submit" className="setup-submit">
            Start chatting
          </button>
        </form>
      </div>
    </div>
  );
}

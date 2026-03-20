import { useState, useRef, useEffect } from 'react';
import type { Session } from '../hooks/useSession';
import { sendChat, type Message } from '../services/api';
import './ChatWindow.css';

interface Props {
  session: Session;
}

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

export function ChatWindow({ session }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const reply = await sendChat(next, session);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">✦</div>
            <p className="chat-empty-title">Ask anything about your documents</p>
            <p className="chat-empty-hint">Upload files in the sidebar to ground your answers</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-bubble">{m.content}</div>
            <span className="chat-meta">{m.role === 'user' ? 'You' : 'Assistant'}</span>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="chat-bubble"><TypingDots /></div>
            <span className="chat-meta">Assistant</span>
          </div>
        )}

        {error && <p className="chat-error">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about your documents…"
            disabled={loading}
          />
          <button className="btn-send" type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

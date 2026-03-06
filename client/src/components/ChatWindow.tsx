import { useState, useRef, useEffect } from 'react';
import type { Session } from '../hooks/useSession';
import { sendChat, type Message } from '../services/api';
import './ChatWindow.css';

interface Props {
  session: Session;
}

export function ChatWindow({ session }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        {messages.length === 0 && (
          <p className="chat-empty">Send a message to get started.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <span className="chat-role">{m.role === 'user' ? 'You' : 'Assistant'}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <span className="chat-role">Assistant</span>
            <p className="chat-typing">Thinking…</p>
          </div>
        )}
        {error && <p className="chat-error">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

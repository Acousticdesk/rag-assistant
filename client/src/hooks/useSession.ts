import { useState } from 'react';

export interface Session {
  provider: string;
  apiKey: string;
}

const SESSION_KEY = 'rag_session';

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(loadSession);

  function saveSession(data: Session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setSession(data);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  return { session, saveSession, clearSession };
}

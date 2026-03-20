CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  sha256      TEXT NOT NULL UNIQUE,
  chunk_count INTEGER NOT NULL,
  token_count INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'processing',
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id),
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_message_sources (
  message_id  TEXT NOT NULL REFERENCES chat_messages(id),
  document_id TEXT NOT NULL REFERENCES documents(id),
  PRIMARY KEY (message_id, document_id)
);

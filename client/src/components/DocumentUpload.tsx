import { useState, useRef } from 'react';
import type { Session } from '../hooks/useSession';
import { uploadFile } from '../services/api';
import './DocumentUpload.css';

interface Props {
  session: Session;
}

export function DocumentUpload({ session }: Props) {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus('');
    setError('');
    try {
      const result = await uploadFile(file, session);
      setStatus(`Uploaded: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="upload-container">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <p className="drop-icon">📄</p>
        <p>Drag & drop a file here, or click to select</p>
        <p className="drop-hint">Supported: PDF, TXT, MD, DOCX</p>
      </div>

      {status && <p className="upload-status">{status}</p>}
      {error && <p className="upload-error">{error}</p>}

      <p className="upload-note">
        Document ingestion (chunking + embedding) will be wired in the next phase.
      </p>
    </div>
  );
}

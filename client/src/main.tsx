import React, { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

interface Note {
  id: number;
  body: string;
  created_at: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Database unavailable. Start PostgreSQL and run migrations.');
  return data;
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Connecting…');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([request('/api/health'), request<Note[]>('/api/notes')])
      .then(([, rows]) => { if (active) { setNotes(rows); setStatus('Connected'); } })
      .catch((error) => { if (active) { setError(errorMessage(error)); setStatus('Setup needed'); } });
    return () => { active = false; };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const note = await request<Note>('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
      setNotes((previous) => [note, ...previous].slice(0, 100));
      setBody('');
      setStatus('Connected');
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); }
  }
  return <main>
    <p className="eyebrow">CMPE 202 / PROJECT STARTER</p>
    <h1>A place to start.</h1>
    <p className="intro">React on the front. Node.js in the middle. PostgreSQL underneath.</p>
    <section aria-label="Database example">
      <div className="heading"><h2>Project notes</h2><span role="status">{status}</span></div>
      <p>Add a note to test the connection from your browser to the database.</p>
      <form onSubmit={save}>
        <label htmlFor="note">Your note</label>
        <textarea id="note" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} required placeholder="What are we building?" />
        <button disabled={saving || !body.trim()}>{saving ? 'Saving…' : 'Save note'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <ul>{notes.map((note) => <li key={note.id}><p>{note.body}</p><time dateTime={note.created_at}>{new Date(note.created_at).toLocaleString()}</time></li>)}</ul>
      {!notes.length && !error && <p>No notes yet. Add your first one above.</p>}
    </section>
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);

import axios from 'axios';
import type { Session } from '../hooks/useSession';

const client = axios.create({ baseURL: '/api' });

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChat(
  messages: Message[],
  session: Session
): Promise<string> {
  const { data } = await client.post<{ reply: string }>('/chat', {
    messages,
    provider: session.provider,
    apiKey: session.apiKey,
  });
  return data.reply;
}

export async function uploadFile(
  file: File,
  session: Session
): Promise<{ message: string; filename: string; size: number }> {
  const form = new FormData();
  form.append('file', file);
  form.append('provider', session.provider);
  form.append('apiKey', session.apiKey);

  const { data } = await client.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

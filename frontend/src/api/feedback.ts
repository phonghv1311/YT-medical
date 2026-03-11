import api from './axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const feedbackApi = {
  create: (data: { subject: string; body: string }) =>
    api.post('/feedback', data),

  chat: (data: { message: string; history?: ChatMessage[] }) =>
    api.post<{ reply: string }>('/feedback/chat', data),
};

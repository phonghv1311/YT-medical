import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { feedbackApi } from '../api/feedback';
import { useToast } from '../contexts/ToastContext';

const BOT_NAME = 'Support Bot';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  time: Date;
}

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

function resetAndClose(
  onClose: () => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  setMessages([]);
  onClose();
}

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: '0',
          role: 'bot',
          text: t('feedback.botGreeting'),
          time: new Date(),
        },
      ]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- t stable per locale

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: String(Date.now()), role: 'user', text, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    const history: { role: 'user' | 'assistant'; content: string }[] = messages
      .filter((m) => m.role === 'bot' || m.role === 'user')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));

    try {
      const { data } = await feedbackApi.chat({ message: text, history });
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'bot',
          text: data.reply,
          time: new Date(),
        },
      ]);
      feedbackApi.create({ subject: 'In-app feedback', body: text }).then(
        () => toast.success(t('feedback.sentToAdmin')),
        () => { },
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'bot',
          text: t('feedback.botError'),
          time: new Date(),
        },
      ]);
      toast.error(t('feedback.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleCloseModal = () => resetAndClose(onClose, setMessages);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{BOT_NAME}</p>
            <p className="text-xs text-gray-500">{t('feedback.automatedMessage')}</p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.map((m) =>
            m.role === 'bot' ? (
              <div key={m.id} className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /></svg>
                </div>
                <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-2 max-w-[85%]">
                  <p className="text-sm text-gray-800">{m.text}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-end">
                <div className="rounded-2xl rounded-tr-md bg-blue-600 px-4 py-2 max-w-[85%]">
                  <p className="text-sm text-white">{m.text}</p>
                  <p className="text-[10px] text-blue-200 mt-1">{m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )
          )}
        </div>

        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('feedback.typeMessage')}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-white text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {sending ? '…' : t('feedback.send')}
          </button>
        </div>
      </div>
    </div>
  );
}

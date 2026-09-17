import { useEffect, useRef, useState } from 'react';
import { type ChatMessage, WELCOME, findAnswer, uid, LVTS_KNOWLEDGE_SUMMARY } from './lvtsChat';

const WORKER_URL = 'https://lvts-loma.rexneel.workers.dev';
const LEARNED_KEY = 'lvts_loma_learned_v1';

function loadLearned(): Array<{ keywords: string[]; answer: string }> {
  try {
    return JSON.parse(localStorage.getItem(LEARNED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLearnedEntry(question: string, answer: string) {
  try {
    const existing = loadLearned();
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 6);
    if (keywords.length === 0) return;
    existing.push({ keywords, answer });
    localStorage.setItem(LEARNED_KEY, JSON.stringify(existing.slice(-100)));
  } catch {}
}

function buildKnowledgeSummary(): string {
  const learned = loadLearned().slice(-20);
  const learnedText = learned
    .map(e => `Q: ${e.keywords.join(', ')}\nA: ${e.answer}`)
    .join('\n\n');
  return LVTS_KNOWLEDGE_SUMMARY + (learnedText ? '\n\n' + learnedText : '');
}

async function askClaude(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledge: string
): Promise<string> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversationHistory, knowledge }),
  });
  if (!response.ok) throw new Error(`Worker error: ${response.status}`);
  const data = await response.json();
  const content = data?.content;
  if (Array.isArray(content)) {
    const textBlock = content.find((b: { type: string }) => b.type === 'text');
    if (textBlock?.text) return textBlock.text;
  }
  throw new Error('No text in response');
}

export function useLvtsChat(autoWelcome: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasWelcomed = useRef(false);
  const busy = isTyping || messages.some(m => m.streaming);
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  function streamMessage(fullText: string, initialDelay = 0) {
    const id = uid();
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = window.setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id, role: 'bot', text: '', streaming: true }]);
      let i = 0;
      interval = setInterval(() => {
        i += Math.random() < 0.3 ? 2 : 1;
        const chunk = fullText.slice(0, i);
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: chunk } : m)));
        if (i >= fullText.length) {
          if (interval) clearInterval(interval);
          setMessages(prev =>
            prev.map(m => (m.id === id ? { ...m, text: fullText, streaming: false } : m))
          );
        }
      }, 18);
    }, initialDelay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }

  useEffect(() => {
    if (!autoWelcome) return;
    if (hasWelcomed.current) return;
    hasWelcomed.current = true;
    return streamMessage(WELCOME, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoWelcome]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    historyRef.current.push({ role: 'user', content: trimmed });
    if (historyRef.current.length > 10) {
      historyRef.current = historyRef.current.slice(-10);
    }
    try {
      const knowledge = buildKnowledgeSummary();
      const answer = await askClaude(historyRef.current, knowledge);
      historyRef.current.push({ role: 'assistant', content: answer });
      saveLearnedEntry(trimmed, answer);
      streamMessage(answer, 0);
    } catch (err) {
      console.warn('Claude unavailable, falling back:', err);
      const fallback = findAnswer(trimmed);
      historyRef.current.push({ role: 'assistant', content: fallback });
      streamMessage(fallback, 0);
    }
  }

  function resetChat() {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    historyRef.current = [];
    streamMessage(WELCOME, 200);
  }

  return { messages, input, setInput, isTyping, busy, handleSend, resetChat, streamMessage, hasWelcomed };
}

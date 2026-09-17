import { useEffect, useRef, useState } from 'react';
import { type ChatMessage, WELCOME, NO_MATCH, findAnswer, uid } from './lvtsChat';
import { LVTS_KNOWLEDGE } from '../data/lvtsKnowledge';

// ── Cloudflare Worker URL ─────────────────────────────────────────────────────
const WORKER_URL = 'https://lvts-loma.rexneel.workers.dev';

// ── localStorage key for auto-saved Q&A pairs ────────────────────────────────
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
    // Extract simple keywords from the question
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 6);
    if (keywords.length === 0) return;
    existing.push({ keywords, answer });
    // Keep only the last 100 learned entries
    const trimmed = existing.slice(-100);
    localStorage.setItem(LEARNED_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable — silent fail
  }
}

// ── Build knowledge summary to send to Claude ────────────────────────────────
function buildKnowledgeSummary(): string {
  const lines: string[] = [];
  for (const entry of LVTS_KNOWLEDGE.slice(0, 30)) {
    lines.push(`Q: ${entry.keywords.join(', ')}\nA: ${entry.answer}`);
  }
  const learned = loadLearned().slice(-20);
  for (const entry of learned) {
    lines.push(`Q: ${entry.keywords.join(', ')}\nA: ${entry.answer}`);
  }
  return lines.join('\n\n');
}

// ── Call Claude via Cloudflare Worker ────────────────────────────────────────
async function askClaude(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledge: string
): Promise<string> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: conversationHistory,
      knowledge,
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from Claude's response
  const content = data?.content;
  if (Array.isArray(content)) {
    const textBlock = content.find((b: { type: string }) => b.type === 'text');
    if (textBlock?.text) return textBlock.text;
  }

  throw new Error('No text in response');
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useLvtsChat(autoWelcome: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasWelcomed = useRef(false);
  const busy = isTyping || messages.some(m => m.streaming);

  // Conversation history for Claude (user + assistant turns)
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

    // Add user message to UI
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    // Add to conversation history
    historyRef.current.push({ role: 'user', content: trimmed });

    // Keep history to last 10 turns to avoid token bloat
    if (historyRef.current.length > 10) {
      historyRef.current = historyRef.current.slice(-10);
    }

    try {
      // Try Claude first
      const knowledge = buildKnowledgeSummary();
      const answer = await askClaude(historyRef.current, knowledge);

      // Add Claude's answer to history
      historyRef.current.push({ role: 'assistant', content: answer });

      // Auto-save this Q&A to localStorage for future reference
      saveLearnedEntry(trimmed, answer);

      // Stream the answer
      streamMessage(answer, 0);

    } catch (err) {
      console.warn('Claude unavailable, falling back to knowledge base:', err);

      // Fallback to local knowledge base
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

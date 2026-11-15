import { useEffect, useRef, useState } from 'react';
import { type ChatMessage, WELCOME, findAnswer, uid, LVTS_KNOWLEDGE_SUMMARY } from './lvtsChat';
import { type ApiBlock, type ApiMessage, fitHistory, hasFiles, toTextOnly } from './chatPayload';
import type { Attachment } from './chatFiles';
import { WorkerError, isOldWorker, postChat } from './lomaApi';

const LEARNED_KEY = 'lvts_loma_learned_v1';

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://qcphrnyufiiqifsaqjij.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGhybnl1ZmlpcWlmc2FxamlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MDUzMjEsImV4cCI6MjEwNTk4MTMyMX0.xGp8BKnEuv8QkFv98DfNAq7zRukGZomyfqv1RhwWaRY';

async function saveToSupabase(question: string, answer: string, keywords: string[]) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/loma_conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ question, answer, keywords }),
    });
  } catch {
    // silent fail
  }
}

async function loadFromSupabase(currentQuestion: string): Promise<Array<{ question: string; answer: string }>> {
  try {
    // Extract keywords from the current question
    const keywords = currentQuestion
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 3);

    // Search for relevant rows matching keywords
    let relevantRows: Array<{ question: string; answer: string }> = [];
    if (keywords.length > 0) {
      const keywordFilter = keywords.map(k => `keywords.cs.{"${k}"}`).join(',');
      const relevantRes = await fetch(
        `${SUPABASE_URL}/rest/v1/loma_conversations?select=question,answer&or=(${keywordFilter})&order=helpful_count.desc&limit=15`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      if (relevantRes.ok) relevantRows = await relevantRes.json();
    }

    // Always load top 10 most helpful rows as general context
    const topRes = await fetch(
      `${SUPABASE_URL}/rest/v1/loma_conversations?select=question,answer&order=helpful_count.desc&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const topRows = topRes.ok ? await topRes.json() : [];

    // Merge — relevant rows first, then top rows, deduplicated
    const seen = new Set<string>();
    const merged: Array<{ question: string; answer: string }> = [];
    for (const row of [...relevantRows, ...topRows]) {
      if (!seen.has(row.question)) {
        seen.add(row.question);
        merged.push(row);
      }
    }
    return merged;
  } catch {
    return [];
  }
}

// ── localStorage ──────────────────────────────────────────────────────────────
function loadLearned(): Array<{ keywords: string[]; answer: string }> {
  try {
    return JSON.parse(localStorage.getItem(LEARNED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLearnedEntry(question: string, answer: string): string[] {
  try {
    const existing = loadLearned();
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 6);
    if (keywords.length === 0) return [];
    existing.push({ keywords, answer });
    localStorage.setItem(LEARNED_KEY, JSON.stringify(existing.slice(-100)));
    return keywords;
  } catch {
    return [];
  }
}

// ── Knowledge summary ─────────────────────────────────────────────────────────
async function buildKnowledgeSummary(currentQuestion: string = ''): Promise<string> {
  const local = loadLearned().slice(-10);
  const localText = local
    .map(e => `Q: ${e.keywords.join(', ')}\nA: ${e.answer}`)
    .join('\n\n');

  const shared = await loadFromSupabase(currentQuestion);
  const sharedText = shared
    .map(e => `Q: ${e.question}\nA: ${e.answer}`)
    .join('\n\n');

  return LVTS_KNOWLEDGE_SUMMARY +
    (sharedText ? '\n\n--- Shared conversations ---\n\n' + sharedText : '') +
    (localText ? '\n\n--- Local context ---\n\n' + localText : '');
}

// ── Claude via Worker ─────────────────────────────────────────────────────────
async function askClaude(history: ApiMessage[], knowledge: string): Promise<string> {
  const fitted = fitHistory(history);
  try {
    return await postChat(fitted, knowledge);
  } catch (err) {
    // The Worker before file support refuses anything but plain text ("No messages provided").
    // Send the same conversation as text: text files still work, images and PDFs get a note.
    if (isOldWorker(err) && hasFiles(fitted)) {
      return postChat(toTextOnly(fitted), knowledge);
    }
    throw err;
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useLvtsChat(autoWelcome: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasWelcomed = useRef(false);
  const busy = isTyping || messages.some(m => m.streaming);
  const historyRef = useRef<ApiMessage[]>([]);
  // Once a visitor shares a file, nothing from this conversation is saved to Loma's memory.
  const sharedFilesRef = useRef(false);

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

  async function handleSend(text: string, attachments: Attachment[] = []) {
    const trimmed = text.trim();
    const files = attachments.filter(a => a.status === 'ready' && a.block);
    if ((!trimmed && !files.length) || busy) return;
    const question = trimmed || (files.length > 1 ? 'Please look at these files.' : 'Please look at this file.');
    setMessages(prev => [...prev, {
      id: uid(), role: 'user', text: trimmed,
      files: files.length ? files.map(f => ({ name: f.name, kind: f.kind, previewUrl: f.previewUrl })) : undefined,
    }]);
    setInput('');
    setIsTyping(true);
    if (files.length) sharedFilesRef.current = true;
    const content: string | ApiBlock[] = files.length
      ? [...files.map(f => f.block as ApiBlock), { type: 'text', text: question }]
      : question;
    historyRef.current.push({ role: 'user', content });
    if (historyRef.current.length > 10) {
      historyRef.current = historyRef.current.slice(-10);
    }
    try {
      const knowledge = await buildKnowledgeSummary(question);
      const answer = await askClaude(historyRef.current, knowledge);
      historyRef.current.push({ role: 'assistant', content: answer });
      // Files can be private: conversations with them are never added to Loma's shared memory.
      if (!sharedFilesRef.current) {
        const keywords = saveLearnedEntry(question, answer);
        await saveToSupabase(question, answer, keywords);
      }
      streamMessage(answer, 0);
    } catch (err) {
      console.warn('Claude unavailable, falling back:', err);
      const reply = files.length
        ? (err instanceof WorkerError
            ? `Sorry, I couldn't read that: ${err.message}. You can also send it to LvTS on [WhatsApp](https://wa.me/6797466941).`
            : "Sorry, I couldn't read your file just now. Please try again in a moment, or send it to LvTS on [WhatsApp](https://wa.me/6797466941).")
        : findAnswer(question);
      historyRef.current.push({ role: 'assistant', content: reply });
      streamMessage(reply, 0);
    }
  }

  function resetChat() {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    historyRef.current = [];
    sharedFilesRef.current = false;
    streamMessage(WELCOME, 200);
  }

  return { messages, input, setInput, isTyping, busy, handleSend, resetChat, streamMessage, hasWelcomed };
}

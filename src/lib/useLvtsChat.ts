import { useEffect, useRef, useState } from 'react';
import { type ChatMessage, WELCOME, findAnswer, uid } from './lvtsChat';

export function useLvtsChat(autoWelcome: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasWelcomed = useRef(false);
  const busy = isTyping || messages.some(m => m.streaming);

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
          setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: fullText, streaming: false } : m)));
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

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    const answer = findAnswer(trimmed);
    streamMessage(answer, 500);
  }

  function resetChat() {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    streamMessage(WELCOME, 200);
  }

  return { messages, input, setInput, isTyping, busy, handleSend, resetChat, streamMessage, hasWelcomed };
}

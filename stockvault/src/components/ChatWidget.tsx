'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/types';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hey! I'm **StockVault AI** 👋\n\nI can help you with reservations, stock info, warehouse locations, or anything else about the platform. What's on your mind?",
};

function parseMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function Message({ msg, isStreaming }: { msg: ChatMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-bubble flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-blue-500/20">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M7 1V13M1 4.5L7 8L13 4.5" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600/80 text-white rounded-tr-sm'
            : 'bg-[#1A2540] border border-white/8 text-white/90 rounded-tl-sm'
        }`}>
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
              {parseMarkdownBold(line)}
            </p>
          ))}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 align-text-bottom animate-timer-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-bubble flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M7 1V13M1 4.5L7 8L13 4.5" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1A2540] border border-white/8 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-bounce-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter((m) => m.role !== 'assistant' || m !== INITIAL_MESSAGE).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) throw new Error('API error');

      setIsTyping(false);
      setIsStreaming(true);

      const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const json = JSON.parse(jsonStr);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again!' },
      ]);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([INITIAL_MESSAGE]);

  const QUICK_PROMPTS = ['How do reservations work?', 'Check stock availability', 'Warehouse locations'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
          bg-gradient-to-br from-blue-500 to-indigo-600
          hover:scale-105 active:scale-95
          ${open ? 'rotate-45 shadow-blue-500/40' : 'shadow-blue-500/30'}
          animate-pulse-glow`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4L16 16M16 4L4 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M19 11C19 15.4183 15.4183 19 11 19C9.5 19 8.1 18.6 6.9 17.9L3 19L4.1 15.1C3.4 13.9 3 12.5 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M8 11H8.01M11 11H11.01M14 11H14.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Unread badge */}
      {!open && (
        <span className="fixed bottom-[62px] right-[14px] z-50 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
          AI
        </span>
      )}

      {/* Chat panel */}
      <div className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] transition-all duration-300 origin-bottom-right
        ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/20 px-4 py-3.5 flex items-center justify-between border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7 1V13M1 4.5L7 8L13 4.5" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">StockVault AI</p>
                <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" style={{ animation: 'ping-dot 2s infinite' }} />
                  Online · Powered by Groq
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-[--text-secondary] hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/8 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <Message
                key={i}
                msg={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            {isTyping && !isStreaming && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts (only if just the welcome message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-[--text-secondary] hover:text-white hover:border-white/20 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-[#0D1425] rounded-xl border border-white/10 focus-within:border-blue-500/50 transition-colors px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[--text-secondary] outline-none"
                disabled={isTyping || isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping || isStreaming}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12 2L2 6.5L6 7.5M12 2L7.5 12L6 7.5M12 2L6 7.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-[--text-secondary] text-center mt-2 opacity-50">AI may make mistakes · Demo only</p>
          </div>
        </div>
      </div>
    </>
  );
}

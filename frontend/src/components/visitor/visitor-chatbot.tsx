'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';

// ─── Types ─────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  action: 'link' | 'sos' | 'call';
  value: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  intent?: string;
  quickActions?: QuickAction[];
}

const ML_API_BASE = 'http://localhost:8000/ml';

// ─── Quick Suggestion Chips ────────────────────────────────────────

const QUICK_SUGGESTIONS_EN = [
  { label: '📊 Crowd Status', message: 'How is the crowd density right now?' },
  { label: '🌤️ Weather', message: "What's the weather and temperature?" },
  { label: '🚌 Transport', message: 'Where can I park and get a shuttle bus?' },
  { label: '🚨 Emergency', message: 'I need emergency medical or police help' },
  { label: '🚻 Washroom', message: 'Where is the nearest toilet?' },
  { label: '🍽️ Food', message: 'Where can I find food and Annakshetra?' },
];

const QUICK_SUGGESTIONS_HI = [
  { label: '📊 भीड़ की स्थिति', message: 'संगम पर भीड़ की स्थिति क्या है?' },
  { label: '🌤️ मौसम', message: 'प्रयागराज का मौसम और तापमान कैसा है?' },
  { label: '🚌 परिवहन', message: 'पार्किंग और बस सेवा की जानकारी दें' },
  { label: '🚨 आपातकाल', message: 'आपातकालीन सहायता और एम्बुलेंस चाहिए' },
  { label: '🚻 शौचालय', message: 'निकटतम शौचालय कहाँ है?' },
  { label: '🍽️ भोजन', message: 'भोजन और अन्नक्षेत्र कहाँ मिलेगा?' },
];

// ─── Simple Markdown Renderer ──────────────────────────────────────

function renderSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Bold: **text**
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`b-${i}-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    // Bullet points
    if (line.startsWith('• ')) {
      result.push(
        <div key={`line-${i}`} className="flex gap-1.5 pl-1">
          <span className="shrink-0">•</span>
          <span>{parts.length > 0 ? parts : line.slice(2)}</span>
        </div>
      );
    } else if (line.trim() === '') {
      result.push(<div key={`line-${i}`} className="h-2" />);
    } else {
      result.push(
        <div key={`line-${i}`}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    }
  }

  return result;
}

// ─── Main Chatbot Component ────────────────────────────────────────

export default function VisitorChatbot() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHindi = language === 'hi';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'bot',
        content: isHindi
          ? '🙏 नमस्ते! मैं **SafeSight साथी** हूं, महा कुंभ मेला 2026 में आपका AI सुरक्षा सहायक।\n\nनीचे दिए गए विषयों में से चुनें या अपना प्रश्न टाइप करें!'
          : "🙏 Namaste! I'm **SafeSight Saathi**, your AI safety assistant at Maha Kumbh Mela 2026.\n\nPick a topic below or type your question!",
        timestamp: new Date(),
        intent: 'greeting',
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch(`${ML_API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText.trim(),
            language: language,
            session_id: sessionId,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const data = json?.data;

          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: data?.reply || (isHindi ? 'क्षमा करें, कोई त्रुटि हुई।' : 'Sorry, something went wrong.'),
            timestamp: new Date(),
            intent: data?.intent,
            quickActions: data?.quick_actions,
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          throw new Error('API error');
        }
      } catch {
        // Fallback offline response
        const fallbackMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: isHindi
            ? '⚠️ सर्वर से जुड़ने में असमर्थ। कृपया बाद में प्रयास करें।\n\n📞 तत्काल सहायता: **108** (एम्बुलेंस) | **112** (पुलिस)'
            : "⚠️ Unable to connect to the server. Please try again later.\n\n📞 Immediate help: **108** (Ambulance) | **112** (Police)",
          timestamp: new Date(),
          intent: 'error',
          quickActions: [
            { label: '📞 Call 108', action: 'call', value: '108' },
            { label: '📞 Call 112', action: 'call', value: '112' },
          ],
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, language, sessionId, isHindi]
  );

  const handleQuickAction = (action: QuickAction) => {
    if (action.action === 'link') {
      window.location.href = action.value;
    } else if (action.action === 'call') {
      window.location.href = `tel:${action.value}`;
    } else if (action.action === 'sos') {
      // Trigger the SOS button on the page
      const sosBtn = document.querySelector('[data-sos-trigger]') as HTMLButtonElement;
      if (sosBtn) {
        sosBtn.click();
      } else {
        window.location.href = 'tel:108';
      }
    }
  };

  const suggestions = isHindi ? QUICK_SUGGESTIONS_HI : QUICK_SUGGESTIONS_EN;

  return (
    <>
      {/* ─── Floating Action Button ─────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-[900] h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-2xl shadow-cyan-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
          aria-label="Open SafeSight Saathi Chatbot"
        >
          {/* Pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-cyan-500/30 animate-ping opacity-50 group-hover:opacity-0" />
          <span className="material-symbols-outlined text-2xl sm:text-3xl relative z-10">smart_toy</span>
        </button>
      )}

      {/* ─── Chat Window ────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[950] w-full sm:w-[400px] h-full sm:h-[600px] sm:max-h-[80vh] flex flex-col bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  SafeSight Saathi
                  <span className="text-[9px] font-normal bg-white/20 px-1.5 py-0.5 rounded-full">
                    {isHindi ? 'साथी' : 'AI'}
                  </span>
                </h3>
                <p className="text-[10px] text-cyan-100 font-medium">
                  {isHindi ? 'कुंभ मेला AI सुरक्षा सहायक' : 'Kumbh Mela AI Safety Assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close chatbot"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* ── Messages Area ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-md shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-xs'
                  }`}
                >
                  {msg.role === 'bot' ? (
                    <div className="space-y-1">
                      {renderSimpleMarkdown(msg.content)}
                    </div>
                  ) : (
                    msg.content
                  )}

                  {/* Quick Action Buttons */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                      {msg.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(action)}
                          className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                            action.action === 'sos'
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : action.action === 'call'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[9px] mt-1.5 ${
                      msg.role === 'user' ? 'text-cyan-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Suggestion Chips (Always available) ── */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 whitespace-nowrap">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s.message)}
                  disabled={isLoading}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200 hover:border-cyan-300 transition-all shadow-2xs disabled:opacity-50 shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Input Area ──────────────────────────────────────── */}
          <div className="px-3 py-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isHindi ? 'अपना प्रश्न यहाँ लिखें...' : 'Type your question here...'}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>

            <p className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">
              {isHindi
                ? 'SafeSight Saathi · AI-संचालित · हिंदी और English'
                : 'SafeSight Saathi · AI-Powered · Hindi & English'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

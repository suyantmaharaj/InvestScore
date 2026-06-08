'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { useSMEContext } from '@/context/SMEDataContext';
import { SDG_LIST } from '@/lib/sdg';

interface Message {
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
}

const QUICK_CHIPS = [
  { label: 'How do I improve my lowest score?',     icon: '📈' },
  { label: 'Explain my overall SDG score',          icon: '💡' },
  { label: 'What does B-BBEE level affect?',        icon: '📊' },
  { label: 'How do I reduce my carbon emissions?',  icon: '🌱' },
  { label: 'Tips for hiring more youth employees',  icon: '👥' },
  { label: 'How to increase local supplier spend?', icon: '🤝' },
];

function scoreColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <li
            key={i}
            className="ml-4 list-disc text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bolded.replace(/^[-•]\s/, '') }}
          />
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return (
        <p
          key={i}
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bolded }}
        />
      );
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: isUser ? '#015376' : '#00B5ED' }}
      >
        {isUser
          ? <User size={14} className="text-white" />
          : <Bot  size={14} className="text-white" />}
      </div>

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-tr-sm'
            : 'rounded-tl-sm border border-[#DDE3EC]'
        }`}
        style={{
          background: isUser ? '#015376' : 'white',
          color:      isUser ? 'white'   : '#015376',
        }}
      >
        <div className="space-y-1">
          {isUser
            ? <p className="text-sm leading-relaxed">{msg.content}</p>
            : formatText(msg.content)
          }
        </div>
        <p
          className="text-[10px] mt-2"
          style={{
            color:     isUser ? 'rgba(255,255,255,0.5)' : 'rgba(74,85,104,0.5)',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#00B5ED] flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-[#DDE3EC] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#00B5ED] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const sdgParam     = searchParams.get('sdg');

  const { company, scorecard } = useSMEContext();

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!company || !scorecard) return;
    if (messages.length > 0) return;

    let greeting = '';

    if (sdgParam) {
      const sdg      = SDG_LIST.find(s => s.id === parseInt(sdgParam));
      const sdgScore = scorecard.sdgScores.find(s => s.sdgId === parseInt(sdgParam));
      if (sdg && sdgScore) {
        const statusLine =
          sdgScore.classification === 'Low'
            ? 'This is one of your goals that needs attention. Let me walk you through what drives this score and what you can do to improve it. What would you like to know first?'
            : sdgScore.classification === 'High'
            ? 'Great news — you are performing well on this goal! Would you like to understand what is driving this strong performance, or explore how to maintain it?'
            : 'You are performing at a medium level on this goal. There is room to reach the top tier. Would you like practical steps to get there?';

        greeting = `Hi! I can see you want to discuss your performance on **${sdg.name} (SDG ${sdg.id})**.\n\nYour current score for this goal is **${sdgScore.score.toFixed(1)}** — ${sdgScore.classification} Impact, compared to a sector average of ${sdgScore.sectorAvg.toFixed(1)}.\n\n${statusLine}`;
      }
    }

    if (!greeting) {
      const lowSDGs  = scorecard.sdgScores.filter(s => s.classification === 'Low');
      const highSDGs = scorecard.sdgScores.filter(s => s.classification === 'High');

      const focusSentence = lowSDGs.length > 0
        ? `You have **${lowSDGs.length} goal${lowSDGs.length > 1 ? 's' : ''}** that could use some attention: ${lowSDGs.map(s => `SDG ${s.sdgId}`).join(', ')}. I can help you build a practical plan to improve these.\n\n`
        : highSDGs.length > 3
        ? `You are performing strongly — **${highSDGs.length} goals** are at High Impact. Let us talk about maintaining that and pushing your remaining goals higher.\n\n`
        : '';

      greeting = `Hello! I am your INvestScore AI Coach.\n\nI have reviewed your latest scorecard for **${company.name}**. Your overall SDG score is **${scorecard.overallScore.toFixed(1)} / 3.0** — ${scorecard.classification} Impact.\n\n${focusSentence}What would you like to work on today?`;
    }

    setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
  }, [company, scorecard, sdgParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading || !company) return;

    const userMsg: Message      = { role: 'user', content, timestamp: new Date() };
    const updatedMessages       = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/coach`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyId: company.id,
          sdgFocus:  sdgParam ? parseInt(sdgParam) : null,
          messages:  updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();
      if (json.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.message, timestamp: new Date() }]);
      } else {
        throw new Error('No message');
      }
    } catch {
      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   'I am having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role:      'assistant',
      content:   'Chat cleared. How can I help you with your SDG performance today?',
      timestamp: new Date(),
    }]);
  };

  if (!company || !scorecard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00B5ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lowSDGs  = scorecard.sdgScores.filter(s => s.classification === 'Low');
  const highSDGs = scorecard.sdgScores.filter(s => s.classification === 'High');

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex gap-5">

      {/* LEFT — Context panel (desktop only) */}
      <div className="w-72 flex-shrink-0 flex-col gap-4 overflow-y-auto pb-4 hidden lg:flex">

        {/* Score summary */}
        <div className="bg-white rounded-xl border border-[#DDE3EC] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#00B5ED]" />
            <p className="text-[#015376] font-semibold text-sm">Your SDG Summary</p>
          </div>

          <div className="text-center py-3 mb-4 bg-[#F4F6F8] rounded-xl">
            <p className="font-bold text-3xl" style={{ color: scoreColor(scorecard.overallScore) }}>
              {scorecard.overallScore.toFixed(1)}
            </p>
            <p className="text-[#4A5568] text-xs mt-0.5">Overall Score</p>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { label: 'High Impact', count: highSDGs.length, color: '#00A651', bg: '#DCFCE7' },
              { label: 'Needs Work',  count: lowSDGs.length,  color: '#D0021B', bg: '#FEE2E2' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[#4A5568] text-xs">{label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                  {count} SDGs
                </span>
              </div>
            ))}
          </div>

          {lowSDGs.length > 0 && (
            <div>
              <p className="text-[#4A5568] text-[10px] uppercase tracking-wider mb-2">Focus areas</p>
              <div className="flex flex-wrap gap-1">
                {lowSDGs.slice(0, 6).map(s => {
                  const sdg = SDG_LIST.find(d => d.id === s.sdgId);
                  return (
                    <button
                      key={s.sdgId}
                      onClick={() => router.push(`/coach?sdg=${s.sdgId}`)}
                      className="text-[10px] font-medium px-2 py-1 rounded-lg border hover:opacity-80 transition"
                      style={{
                        background:  `${sdg?.color}15`,
                        borderColor: `${sdg?.color}40`,
                        color:        sdg?.color,
                      }}
                    >
                      SDG {s.sdgId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="bg-white rounded-xl border border-[#DDE3EC] p-5">
          <p className="text-[#015376] font-semibold text-sm mb-3">Ask about</p>
          <div className="flex flex-col gap-2">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.label)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-[#015376] border border-[#DDE3EC] hover:bg-[#F0FBFF] hover:border-[#00B5ED] transition disabled:opacity-50"
              >
                <span>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Related links */}
        <div className="bg-white rounded-xl border border-[#DDE3EC] p-4">
          <p className="text-[#4A5568] text-[10px] uppercase tracking-wider mb-3">Related pages</p>
          <div className="space-y-2">
            {[
              { label: 'View My Scorecard', href: '/scorecard'    },
              { label: 'Submit New Data',   href: '/submit'       },
              { label: 'See Benchmarking',  href: '/benchmarking' },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="block w-full text-left text-xs text-[#00B5ED] hover:underline"
              >
                → {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Chat window */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#DDE3EC] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DDE3EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00B5ED] flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[#015376] font-semibold text-sm">INvestScore AI Coach</p>
              <p className="text-[#4A5568] text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] inline-block" />
                Powered by Claude · Context-aware
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-[#4A5568] text-xs hover:text-[#015376] transition px-3 py-1.5 rounded-lg hover:bg-[#F4F6F8]"
          >
            <RefreshCw size={13} />
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* SDG focus strip */}
        {sdgParam && (() => {
          const sdg = SDG_LIST.find(s => s.id === parseInt(sdgParam));
          return sdg ? (
            <div
              className="mx-5 mb-3 flex items-center justify-between px-3 py-2 rounded-lg text-xs"
              style={{
                background:  `${sdg.color}12`,
                border:      `1px solid ${sdg.color}30`,
                color:        sdg.color,
              }}
            >
              <span className="font-medium">Focused on: SDG {sdg.id} — {sdg.shortName}</span>
              <button
                onClick={() => router.replace('/coach')}
                className="hover:opacity-70 text-[10px] underline"
              >
                Clear focus
              </button>
            </div>
          ) : null;
        })()}

        {/* Input */}
        <div className="px-5 py-4 border-t border-[#DDE3EC]">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI Coach anything about your SDG performance…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#DDE3EC] bg-[#F4F6F8] px-4 py-3 text-sm text-[#015376] placeholder:text-[#4A5568]/50 focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition max-h-32"
              style={{ minHeight: '44px' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl bg-[#00B5ED] text-white flex items-center justify-center hover:bg-[#0099CC] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>
          <p className="text-[#4A5568]/50 text-[10px] mt-2 text-center">
            AI responses are advisory only. SDG scores are always calculated by Sanlam's proprietary methodology.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00B5ED] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CoachInner />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Send, Paperclip, X, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSMEData } from '@/hooks/useSMEData';
import ChaseAvatar from '@/components/sme/ChaseAvatar';
import ChaseHistorySidebar from '@/components/sme/ChaseHistorySidebar';
import { readFileAsText, getFileIcon, formatFileSize } from '@/lib/document-reader';
import {
  ConversationMeta, Message,
  generateConvId, generateTitle,
  getIndex, upsertConversation,
  deleteConversation, deleteAllConversations,
  getMessages, saveMessages,
} from '@/lib/chase-conversations';

interface ExtractedKPIs {
  [kpiId: string]: number;
}

const SUGGESTED_PROMPTS = [
  'Why is my overall score where it is?',
  'What should I focus on this quarter?',
  'Explain my lowest SDG score',
  'How do I improve my B-BBEE level?',
  'What does my score mean for my Sanlam investment?',
  'How do I calculate my Scope 2 emissions?',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in animate-message-in">
      <ChaseAvatar size={32} className="flex-shrink-0" />
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-typing-dot"
            style={{
              background:     'var(--text-muted)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderMessageContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span style={{ color: 'var(--sanlam-teal)', flexShrink: 0, marginTop: '3px' }}>•</span>
          <span>{line.replace(/^[•\-] /, '')}</span>
        </div>
      );
    }
    if (line === '') return <div key={i} className="h-2" />;
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} className="leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    );
  });
}

function MessageBubble({
  message, onCopy, onRegenerate, isLast,
}: {
  message:      Message;
  onCopy:       (text: string) => void;
  onRegenerate: () => void;
  isLast:       boolean;
}) {
  const isUser              = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse animate-message-in-right' : 'flex-row animate-message-in'} group`}
    >
      {/* Avatar */}
      {isUser ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1"
          style={{ background: 'var(--sanlam-navy, #015376)' }}
        >
          You
        </div>
      ) : (
        <ChaseAvatar size={32} className="flex-shrink-0 mb-1" />
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>

        {/* Sender label */}
        <p className="text-[10px] font-medium mb-1 px-1" style={{ color: 'var(--text-muted)' }}>
          {isUser ? 'You' : 'Chase'}
        </p>

        {/* File attachment chip */}
        {message.file && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 animate-attachment-in"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <span>{getFileIcon(message.file.name)}</span>
            <div>
              <p className="text-xs font-medium truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
                {message.file.name}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {formatFileSize(message.file.size)}
              </p>
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background:              isUser ? 'var(--sanlam-navy, #015376)' : 'var(--surface)',
            color:                   isUser ? 'white' : 'var(--text-primary)',
            borderBottomRightRadius: isUser ? '4px' : '16px',
            borderBottomLeftRadius:  isUser ? '16px' : '4px',
            border:                  isUser ? 'none' : '1px solid var(--border)',
          }}
        >
          {isUser
            ? <p>{message.content}</p>
            : renderMessageContent(message.content)
          }
        </div>

        {/* Timestamp + actions */}
        <div
          className={`flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {new Date(message.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <button
            onClick={handleCopy}
            className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}
          >
            <Copy size={10} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!isUser && isLast && (
            <button
              onClick={onRegenerate}
              className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}
            >
              <RefreshCw size={10} />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChaseInner() {
  const router               = useRouter();
  const params               = useSearchParams();
  const { user }             = useAuth();
  const { company, scorecard } = useSMEData();

  const companyId = user?.companyId || '';

  // ── Sidebar / conversation state ────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations,    setConversations]    = useState<ConversationMeta[]>([]);
  const [activeConvId,     setActiveConvId]     = useState<string>(generateConvId);

  // ── Chat state ───────────────────────────────────────────────────────────────
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [listening,       setListening]       = useState(false);
  const [attachment,      setAttachment]      = useState<{ file: File; text: string } | null>(null);
  const [readingFile,     setReadingFile]     = useState(false);
  const [extracted,       setExtracted]       = useState<ExtractedKPIs | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sendPulse,       setSendPulse]       = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Init: load index and restore latest conversation ────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const index = getIndex(companyId);
    setConversations(index);
    if (index.length > 0) {
      const recent = index[0];
      const msgs   = getMessages(companyId, recent.id);
      setActiveConvId(recent.id);
      setMessages(msgs);
      setShowSuggestions(msgs.length === 0);
    }
  }, [companyId]);

  // ── Auto-save messages whenever they change ──────────────────────────────────
  useEffect(() => {
    if (!companyId || !activeConvId || messages.length === 0) return;
    saveMessages(companyId, activeConvId, messages);
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title        = firstUserMsg ? generateTitle(firstUserMsg.content) : 'New conversation';
    const lastMsg      = messages[messages.length - 1];
    upsertConversation(companyId, {
      id:           activeConvId,
      title,
      preview:      lastMsg.content.slice(0, 80),
      createdAt:    messages[0].timestamp,
      updatedAt:    lastMsg.timestamp,
      messageCount: messages.length,
    });
    setConversations(getIndex(companyId));
  }, [messages, activeConvId, companyId]);

  // ── URL prompt pre-fill ──────────────────────────────────────────────────────
  useEffect(() => {
    const prompt = params.get('prompt');
    if (prompt && messages.length === 0) {
      setInput(decodeURIComponent(prompt));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Conversation management ──────────────────────────────────────────────────

  const startNewChat = useCallback(() => {
    setActiveConvId(generateConvId());
    setMessages([]);
    setShowSuggestions(true);
    setAttachment(null);
    setExtracted(null);
    setInput('');
  }, []);

  const loadConversation = useCallback((id: string) => {
    if (!companyId) return;
    const msgs = getMessages(companyId, id);
    setActiveConvId(id);
    setMessages(msgs);
    setShowSuggestions(msgs.length === 0);
    setAttachment(null);
    setExtracted(null);
    setInput('');
  }, [companyId]);

  const handleDeleteConv = useCallback((id: string) => {
    if (!companyId) return;
    deleteConversation(companyId, id);
    const updated = getIndex(companyId);
    setConversations(updated);
    if (id === activeConvId) {
      if (updated.length > 0) {
        const msgs = getMessages(companyId, updated[0].id);
        setActiveConvId(updated[0].id);
        setMessages(msgs);
        setShowSuggestions(msgs.length === 0);
      } else {
        startNewChat();
      }
    }
  }, [companyId, activeConvId, startNewChat]);

  const handleDeleteAll = useCallback(() => {
    if (!companyId) return;
    deleteAllConversations(companyId);
    setConversations([]);
    startNewChat();
  }, [companyId, startNewChat]);

  // ── Send message ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string, fileAttach?: typeof attachment) => {
    const content = (text || input).trim();
    if (!content && !fileAttach) return;
    if (!companyId) return;

    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 600);

    const userMsg: Message = {
      id:        `msg_${Date.now()}`,
      role:      'user',
      content,
      timestamp: new Date().toISOString(),
      file:      fileAttach
        ? { name: fileAttach.file.name, size: fileAttach.file.size, text: fileAttach.text }
        : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setLoading(true);
    setShowSuggestions(false);

    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();

      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/coach`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          messages:     allMessages,
          companyId,
          documentText: fileAttach?.text || null,
        }),
      });

      const json = await res.json();
      setMessages(prev => [...prev, {
        id:        `msg_${Date.now()}_a`,
        role:      'assistant',
        content:   json.message || 'Chase is having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString(),
      }]);

      if (fileAttach) tryExtractKPIs(fileAttach.text);

    } catch {
      setMessages(prev => [...prev, {
        id:        `msg_${Date.now()}_err`,
        role:      'assistant',
        content:   'Chase is unavailable right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tryExtractKPIs = async (text: string) => {
    if (!companyId) return;
    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/extract-kpis`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ documentText: text, companyId }),
      });
      const json = await res.json();
      if (json.count > 0) setExtracted(json.extracted);
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReadingFile(true);
    try {
      const text = await readFileAsText(file);
      setAttachment({ file, text });
      setInput(prev => prev || `I've uploaded ${file.name}. What can you tell me about it?`);
    } catch {
      setAttachment(null);
    } finally {
      setReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    const recognition          = new SpeechRecognition();
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.lang           = 'en-ZA';
    recognition.onstart        = () => setListening(true);
    recognition.onend          = () => setListening(false);
    recognition.onerror        = () => setListening(false);
    recognition.onresult       = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
      if (e.results[0].isFinal) setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages(prev => prev.slice(0, -1));
    sendMessage(lastUser.content);
  };

  const prefillAndNavigate = () => {
    if (!extracted || !companyId) return;
    try {
      const key      = `investscore_submission_draft_${companyId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      const updated  = { ...existing, data: { ...(existing.data || {}), ...extracted } };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    setExtracted(null);
    router.push('/submit');
  };

  const scoreColor = scorecard
    ? scorecard.overallScore >= 2.4 ? '#00A651' : scorecard.overallScore >= 1.6 ? '#E8A020' : '#D0021B'
    : 'var(--text-muted)';

  const canSend = (input.trim() || attachment) && !loading;

  return (
    <div
      className="flex animate-page-in"
      style={{ flex: 1, overflow: 'hidden' }}
    >
      {/* ── Conversation sidebar ── */}
      <ChaseHistorySidebar
        companyId={companyId}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={loadConversation}
        onNewChat={startNewChat}
        onDeleteConv={handleDeleteConv}
        onDeleteAll={handleDeleteAll}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ overflowX: 'hidden' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 animate-fade-in">
              <div className="animate-chase-entrance mb-4">
                <ChaseAvatar size={72} />
              </div>
              <h2 className="font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                Hi, I'm Chase
              </h2>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                Your SDG coach from Sanlam Investments
              </p>
              {company && scorecard && (
                <p className="text-xs mb-6 max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  I can see {company.name}'s scores. Your overall is{' '}
                  <span style={{ color: scoreColor, fontWeight: 600 }}>
                    {scorecard.overallScore.toFixed(1)} ({scorecard.classification} Impact)
                  </span>.
                  Ask me anything.
                </p>
              )}
            </div>
          )}

          {/* Suggested prompts */}
          {showSuggestions && messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all animate-card-in"
                  style={{
                    background:     'var(--surface)',
                    border:         '1px solid var(--border)',
                    color:          'var(--text-primary)',
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--sanlam-teal, #00B5ED)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Message history */}
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
              isLast={idx === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          {/* KPI extraction offer */}
          {extracted && Object.keys(extracted).length > 0 && (
            <div
              className="rounded-2xl p-4 animate-fade-in"
              style={{ background: 'rgba(0,181,237,0.06)', border: '1px solid rgba(0,181,237,0.2)' }}
            >
              <div className="flex items-start gap-3">
                <ChaseAvatar size={28} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    I found {Object.keys(extracted).length} KPI value{Object.keys(extracted).length !== 1 ? 's' : ''} in that document
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Object.entries(extracted).slice(0, 8).map(([kpiId, val]) => (
                      <span
                        key={kpiId}
                        className="text-[11px] px-2 py-1 rounded-lg"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        {kpiId.replace(/_/g, ' ')}: <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prefillAndNavigate}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition"
                      style={{ background: 'var(--sanlam-teal, #00B5ED)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0099CC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--sanlam-teal, #00B5ED)')}
                    >
                      Pre-fill submission form →
                    </button>
                    <button
                      onClick={() => setExtracted(null)}
                      className="text-xs hover:underline"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-4 pb-4"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}
        >
          {/* File attachment preview */}
          {attachment && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl animate-attachment-in"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span>{getFileIcon(attachment.file.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {attachment.file.name}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {formatFileSize(attachment.file.size)} · Ready to send
                </p>
              </div>
              <button onClick={() => setAttachment(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Listening indicator */}
          {listening && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl animate-fade-in"
              style={{ background: 'rgba(208,2,27,0.06)', border: '1px solid rgba(208,2,27,0.2)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#D0021B' }} />
              <p className="text-xs font-medium" style={{ color: '#D0021B' }}>
                Listening… speak now
              </p>
            </div>
          )}

          {/* Input row */}
          <div
            className="chase-input-container flex items-end gap-2 rounded-2xl px-3 py-2 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* File upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={readingFile}
              className="p-2 rounded-xl flex-shrink-0 transition mb-0.5"
              style={{ color: readingFile ? 'var(--sanlam-teal, #00B5ED)' : 'var(--text-muted)' }}
              title="Upload a document"
            >
              {readingFile
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Paperclip size={18} />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening…' : 'Ask Chase anything… (Shift+Enter for new line)'}
              rows={1}
              className="flex-1 resize-none text-sm focus:outline-none"
              style={{
                background: 'transparent',
                color:      'var(--text-primary)',
                maxHeight:  '120px',
                minHeight:  '24px',
                lineHeight: '1.5',
              }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />

            {/* Voice */}
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className="p-2 rounded-xl flex-shrink-0 transition mb-0.5"
              style={{
                color:      listening ? '#D0021B' : 'var(--text-muted)',
                background: listening ? 'rgba(208,2,27,0.1)' : 'transparent',
              }}
              title={listening ? 'Stop listening' : 'Voice input'}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send */}
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!canSend}
              className={`p-2 rounded-xl flex-shrink-0 transition mb-0.5 ${sendPulse ? 'animate-send-pulse' : ''}`}
              style={{
                background: canSend ? 'var(--sanlam-teal, #00B5ED)' : 'var(--border)',
                color:      canSend ? 'white' : 'var(--text-muted)',
              }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>

          <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            Chase · Powered by Sanlam InvestScore · Advisory only · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChasePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00B5ED] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChaseInner />
    </Suspense>
  );
}

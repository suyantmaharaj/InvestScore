'use client';

import { useState } from 'react';
import {
  Plus, Trash2, MessageSquare,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { ConversationMeta, groupByDate } from '@/lib/chase-conversations';
import ChaseAvatar from '@/components/sme/ChaseAvatar';

interface Props {
  companyId:        string;
  conversations:    ConversationMeta[];
  activeConvId:     string | null;
  onSelectConv:     (id: string) => void;
  onNewChat:        () => void;
  onDeleteConv:     (id: string) => void;
  onDeleteAll:      () => void;
  collapsed:        boolean;
  onToggleCollapse: () => void;
}

export default function ChaseHistorySidebar({
  conversations, activeConvId,
  onSelectConv, onNewChat, onDeleteConv, onDeleteAll,
  collapsed, onToggleCollapse,
}: Props) {
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [hoveredId,        setHoveredId]        = useState<string | null>(null);

  const grouped = groupByDate(conversations);

  if (collapsed) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center py-4 gap-3"
        style={{
          width:       '52px',
          background:  'var(--chase-sidebar-bg)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          transition:  'width 300ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>

        <button
          onClick={onNewChat}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="New chat"
        >
          <Plus size={16} />
        </button>

        <div className="flex flex-col gap-1.5 mt-2">
          {conversations.slice(0, 8).map(c => (
            <button
              key={c.id}
              onClick={() => onSelectConv(c.id)}
              className="w-2 h-2 rounded-full transition"
              style={{
                background: c.id === activeConvId
                  ? 'var(--sanlam-teal, #00B5ED)'
                  : 'rgba(255,255,255,0.2)',
              }}
              title={c.title}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width:       '260px',
        background:  'var(--chase-sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        transition:  'width 300ms cubic-bezier(0.16,1,0.3,1)',
        overflow:    'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <ChaseAvatar size={24} />
          <span className="text-sm font-semibold" style={{ color: 'white' }}>Chase</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(0,181,237,0.15)',
            color:      'var(--sanlam-teal, #00B5ED)',
            border:     '1px solid rgba(0,181,237,0.25)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,181,237,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,181,237,0.15)')}
        >
          <Plus size={15} />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare size={24} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No conversations yet. Start chatting with Chase.
            </p>
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label} className="mb-3">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </p>
              {items.map((conv, i) => (
                <div
                  key={conv.id}
                  className="relative animate-sidebar-item"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {confirmDeleteId === conv.id ? (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-0.5"
                      style={{
                        background: 'rgba(208,2,27,0.15)',
                        border:     '1px solid rgba(208,2,27,0.3)',
                      }}
                    >
                      <AlertTriangle size={12} style={{ color: '#FC8181', flexShrink: 0 }} />
                      <p className="text-[11px] flex-1" style={{ color: '#FC8181' }}>
                        Delete this chat?
                      </p>
                      <button
                        onClick={() => { onDeleteConv(conv.id); setConfirmDeleteId(null); }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(208,2,27,0.3)', color: '#FC8181' }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px]"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectConv(conv.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150"
                      style={{
                        background: conv.id === activeConvId
                          ? 'rgba(255,255,255,0.12)'
                          : hoveredId === conv.id
                            ? 'rgba(255,255,255,0.06)'
                            : 'transparent',
                        borderLeft: conv.id === activeConvId
                          ? '2px solid var(--sanlam-teal, #00B5ED)'
                          : '2px solid transparent',
                      }}
                    >
                      <p
                        className="text-xs font-medium truncate pr-6"
                        style={{
                          color: conv.id === activeConvId ? 'white' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {conv.title}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {conv.preview}
                      </p>
                    </button>
                  )}

                  {/* Trash on hover */}
                  {hoveredId === conv.id && confirmDeleteId !== conv.id && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(conv.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition"
                      style={{ background: 'rgba(208,2,27,0.15)', color: '#FC8181' }}
                      title="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer — clear all */}
      {conversations.length > 0 && (
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {confirmDeleteAll ? (
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(208,2,27,0.12)', border: '1px solid rgba(208,2,27,0.25)' }}
            >
              <p className="text-xs text-center mb-2" style={{ color: '#FC8181' }}>
                Delete all {conversations.length} conversations?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onDeleteAll(); setConfirmDeleteAll(false); }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(208,2,27,0.3)', color: '#FC8181' }}
                >
                  Delete all
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FC8181')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              <Trash2 size={12} />
              Clear all conversations
            </button>
          )}
        </div>
      )}
    </div>
  );
}

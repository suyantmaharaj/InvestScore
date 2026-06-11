export interface ConversationMeta {
  id:           string;
  title:        string;
  preview:      string;
  createdAt:    string;
  updatedAt:    string;
  messageCount: number;
}

export interface Message {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: string;
  file?:     { name: string; size: number; text: string };
}

function indexKey(companyId: string) {
  return `chase_conversations_index_${companyId}`;
}

function convKey(companyId: string, convId: string) {
  return `chase_conversation_${companyId}_${convId}`;
}

export function generateConvId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ── INDEX OPERATIONS ──────────────────────────────────────────────────────────

export function getIndex(companyId: string): ConversationMeta[] {
  try {
    const raw = localStorage.getItem(indexKey(companyId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveIndex(companyId: string, index: ConversationMeta[]): void {
  try {
    localStorage.setItem(indexKey(companyId), JSON.stringify(index));
  } catch {}
}

export function upsertConversation(companyId: string, conv: ConversationMeta): void {
  const index    = getIndex(companyId);
  const existing = index.findIndex(c => c.id === conv.id);
  if (existing >= 0) {
    index[existing] = conv;
  } else {
    index.unshift(conv);
  }
  saveIndex(companyId, index.slice(0, 100));
}

export function deleteConversation(companyId: string, convId: string): void {
  try {
    const index = getIndex(companyId).filter(c => c.id !== convId);
    saveIndex(companyId, index);
    localStorage.removeItem(convKey(companyId, convId));
  } catch {}
}

export function deleteAllConversations(companyId: string): void {
  try {
    const index = getIndex(companyId);
    index.forEach(c => localStorage.removeItem(convKey(companyId, c.id)));
    localStorage.removeItem(indexKey(companyId));
  } catch {}
}

// ── MESSAGE OPERATIONS ────────────────────────────────────────────────────────

export function getMessages(companyId: string, convId: string): Message[] {
  try {
    const raw = localStorage.getItem(convKey(companyId, convId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveMessages(companyId: string, convId: string, messages: Message[]): void {
  try {
    localStorage.setItem(convKey(companyId, convId), JSON.stringify(messages));
  } catch {}
}

// ── DATE GROUPING ─────────────────────────────────────────────────────────────

export function groupByDate(conversations: ConversationMeta[]): {
  label: string;
  items: ConversationMeta[];
}[] {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo   = new Date(today.getTime() - 7 * 86400000);
  const monthAgo  = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, ConversationMeta[]> = {
    'Today':              [],
    'Yesterday':          [],
    'Previous 7 days':    [],
    'Previous 30 days':   [],
    'Older':              [],
  };

  conversations.forEach(c => {
    const d = new Date(c.updatedAt);
    if      (d >= today)     groups['Today'].push(c);
    else if (d >= yesterday) groups['Yesterday'].push(c);
    else if (d >= weekAgo)   groups['Previous 7 days'].push(c);
    else if (d >= monthAgo)  groups['Previous 30 days'].push(c);
    else                     groups['Older'].push(c);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

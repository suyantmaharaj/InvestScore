const MEMORY: Map<string, { data: unknown; ts: number }> = new Map();
const TTL = 15 * 60 * 1000; // 15 minutes
const NS  = 'is_cache_';    // sessionStorage namespace prefix

function persist(key: string, data: unknown, ts: number): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(NS + key, JSON.stringify({ data, ts }));
  } catch { /* storage full or SSR */ }
}

function forget(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try { sessionStorage.removeItem(NS + key); } catch { /* noop */ }
}

export function getCached<T>(key: string): T | null {
  const now = Date.now();

  // Memory first — fastest path, no parse overhead
  const m = MEMORY.get(key);
  if (m) {
    if (now - m.ts <= TTL) return m.data as T;
    MEMORY.delete(key);
    forget(key);
    return null;
  }

  // sessionStorage fallback — survives page refresh within the same tab session
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(NS + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (now - ts > TTL) { forget(key); return null; }
    MEMORY.set(key, { data, ts }); // warm the memory layer for next access
    return data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  const ts = Date.now();
  MEMORY.set(key, { data, ts });
  persist(key, data, ts);
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    MEMORY.clear();
    if (typeof sessionStorage !== 'undefined') {
      try {
        Object.keys(sessionStorage)
          .filter(k => k.startsWith(NS))
          .forEach(k => sessionStorage.removeItem(k));
      } catch { /* noop */ }
    }
    return;
  }

  for (const k of [...MEMORY.keys()]) {
    if (k.startsWith(prefix)) MEMORY.delete(k);
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(NS + prefix))
        .forEach(k => sessionStorage.removeItem(k));
    } catch { /* noop */ }
  }
}

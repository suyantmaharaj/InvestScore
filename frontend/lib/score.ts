// Raw scores stored in DB are 1.0–3.0. Display scale is 0–100.
// Formula: Math.round(((raw - 1) / 2) * 100)

export function toDisplay(raw: number): number {
  return Math.round(((raw - 1) / 2) * 100);
}

export function toDisplayDiff(rawDiff: number): number {
  return Math.round((rawDiff / 2) * 100);
}

export function scoreColor(raw: number): string {
  if (raw >= 2.4) return '#00A651';
  if (raw >= 1.6) return '#E8A020';
  return '#D0021B';
}

export function scoreColorFromDisplay(d: number): string {
  if (d >= 65) return '#00A651';
  if (d >= 25) return '#E8A020';
  return '#D0021B';
}

export function scoreLabel(raw: number): 'High' | 'Medium' | 'Low' {
  if (raw >= 2.4) return 'High';
  if (raw >= 1.6) return 'Medium';
  return 'Low';
}

export function formatScore(raw: number): string {
  return String(toDisplay(raw));
}

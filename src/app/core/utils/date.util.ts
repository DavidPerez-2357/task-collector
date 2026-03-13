export const DAY_MS = 86400000;

export function getStartOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysBetween(fromMs: number, toMs: number) {
  return Math.floor((toMs - fromMs) / 86400000);
}

export function weeksBetween(fromMs: number, toMs: number) {
  return Math.floor(daysBetween(fromMs, toMs) / 7);
}

export function monthsBetween(fromMs: number, toMs: number) {
  const f = new Date(fromMs);
  const t = new Date(toMs);
  return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
}

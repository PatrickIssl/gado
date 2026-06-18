export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('pt-BR');
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonths(dateStr: string, months: number): string {
  const date = parseDate(dateStr);
  date.setMonth(date.getMonth() + months);
  return toISODate(date);
}

export function daysBetween(from: string, to: string): number {
  const start = parseDate(from);
  const end = parseDate(to);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function daysFromToday(dateStr: string): number {
  return daysBetween(todayISO(), dateStr);
}

export function daysSince(dateStr: string): number {
  return daysBetween(dateStr, todayISO());
}

/**
 * Regras de acesso da assinatura (funções puras, usadas no servidor e na tela).
 * Datas de vencimento no formato YYYY-MM-DD, consideradas até 23:59 de Brasília.
 */

export const GRACE_DAYS = 3;

export type BillingMode = "manual" | "asaas";

export type BillingInfo = {
  mode: BillingMode;
  plan: string;
  trial_ends_at: string | null;
  paid_until: string | null;
  canceled_at: string | null;
};

export type BillingState =
  | { kind: "manual"; ok: true }
  | { kind: "trial"; ok: true; until: string; daysLeft: number }
  | { kind: "active"; ok: true; until: string; daysLeft: number }
  | { kind: "grace"; ok: true; until: string; lockOn: string }
  | { kind: "locked"; ok: false; until: string | null };

export function endOfDay(ymd: string): number {
  return new Date(`${ymd}T23:59:59-03:00`).getTime();
}

/** Data de hoje (YYYY-MM-DD) no horário de Brasília. */
export function todayYmd(now = new Date()): string {
  return new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Soma meses mantendo o dia (31/01 + 1 mês = 28 ou 29/02). */
export function addMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function maxYmd(...dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d));
  return valid.length ? valid.sort().at(-1)! : null;
}

export function formatYmd(ymd: string | null): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function billingState(b: BillingInfo, now = new Date()): BillingState {
  if (b.mode === "manual") return { kind: "manual", ok: true };
  const until = maxYmd(b.trial_ends_at, b.paid_until);
  if (!until) return { kind: "locked", ok: false, until: null };
  const t = now.getTime();
  // dias de calendário até o fim do período (0 = termina hoje)
  const daysLeft = Math.max(0, Math.round((Date.parse(`${until}T12:00:00Z`) - Date.parse(`${todayYmd(now)}T12:00:00Z`)) / 86400_000));
  if (t <= endOfDay(until)) {
    const paid = !!b.paid_until && b.paid_until >= until;
    return paid ? { kind: "active", ok: true, until, daysLeft } : { kind: "trial", ok: true, until, daysLeft };
  }
  const lockOn = addDays(until, GRACE_DAYS);
  if (t <= endOfDay(lockOn)) return { kind: "grace", ok: true, until, lockOn };
  return { kind: "locked", ok: false, until };
}

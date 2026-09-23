import type { DayHours, OpenMode } from "./types";

export const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function defaultHours(): DayHours[] {
  return DAY_NAMES.map((_, day) => ({ day, open: "18:00", close: "23:00", closed: false }));
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Dia da semana e minutos do dia no fuso do estabelecimento. */
function nowIn(timeZone: string, now = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  return { day, minutes: hour * 60 + Number(get("minute")) };
}

export function isOpenNow(hours: DayHours[], mode: OpenMode, timeZone: string, now = new Date()): boolean {
  if (mode === "open") return true;
  if (mode === "closed") return false;
  const { day, minutes } = nowIn(timeZone, now);
  const today = hours.find((h) => h.day === day);
  const yesterday = hours.find((h) => h.day === (day + 6) % 7);
  if (today && !today.closed) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (c > o ? minutes >= o && minutes < c : minutes >= o) return true;
  }
  // horário de ontem que atravessa a meia-noite
  if (yesterday && !yesterday.closed) {
    const o = toMinutes(yesterday.open);
    const c = toMinutes(yesterday.close);
    if (c <= o && minutes < c) return true;
  }
  return false;
}

export function todayHoursLabel(hours: DayHours[], timeZone: string, now = new Date()): string {
  const { day } = nowIn(timeZone, now);
  const h = hours.find((x) => x.day === day);
  if (!h || h.closed) return "Fechado hoje";
  return `Hoje: ${h.open} às ${h.close}`;
}

/** Instante (ISO/UTC) da meia-noite de hoje no fuso da loja. */
export function startOfTodayIso(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(g("year"), g("month") - 1, g("day")) - offset).toISOString();
}

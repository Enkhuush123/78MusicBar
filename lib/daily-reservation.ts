export const DAILY_RESERVATION_PREFIX = "daily-reservation:";
const DAILY_RESERVATION_TITLE_PREFIX = "Table Reservation";
export const DAILY_RESERVATION_START_HOUR = 18;
export const DAILY_RESERVATION_END_HOUR = 22;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDayKey(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isTodayReservationDay(value: Date, now = new Date()) {
  return isSameLocalDay(value, now);
}

export function isWithinDailyReservationWindow(value: Date) {
  const minutes = value.getHours() * 60 + value.getMinutes();
  const start = DAILY_RESERVATION_START_HOUR * 60;
  const end = DAILY_RESERVATION_END_HOUR * 60;
  return minutes >= start && minutes <= end;
}

export function getTodayReservationDateInput(now = new Date()) {
  return formatDayKey(now);
}

export function buildDailyTimeOptions(stepMinutes = 30) {
  const out: string[] = [];
  const start = DAILY_RESERVATION_START_HOUR * 60;
  const end = DAILY_RESERVATION_END_HOUR * 60;
  for (let minutes = start; minutes <= end; minutes += stepMinutes) {
    const hh = pad(Math.floor(minutes / 60));
    const mm = pad(minutes % 60);
    out.push(`${hh}:${mm}`);
  }
  return out;
}

export function parseDayInput(value: string) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day, 12, 0, 0, 0);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getDailyReservationEventId(value: Date) {
  return `${DAILY_RESERVATION_PREFIX}${formatDayKey(value)}`;
}

export function isDailyReservationEventId(value?: string | null) {
  return String(value || "").startsWith(DAILY_RESERVATION_PREFIX);
}

export function isDailyReservationTitle(value?: string | null) {
  return String(value || "").startsWith(DAILY_RESERVATION_TITLE_PREFIX);
}

export function buildDailyReservationTitle(value: Date) {
  return `${DAILY_RESERVATION_TITLE_PREFIX} • ${formatDayKey(value)}`;
}

export function publicReservationTitle(event?: { id?: string | null; title?: string | null } | null) {
  if (!event) return null;
  if (isDailyReservationEventId(event.id) || isDailyReservationTitle(event.title)) {
    return "Table Reservation";
  }
  return event.title ?? null;
}

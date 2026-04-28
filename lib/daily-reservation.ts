export const DAILY_RESERVATION_PREFIX = "daily-reservation:";
const DAILY_RESERVATION_TITLE_PREFIX = "Table Reservation";

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isDailyReservationEventId(value?: string | null) {
  return String(value || "").startsWith(DAILY_RESERVATION_PREFIX);
}

export function isDailyReservationTitle(value?: string | null) {
  return String(value || "").startsWith(DAILY_RESERVATION_TITLE_PREFIX);
}

export function publicReservationTitle(event?: { id?: string | null; title?: string | null } | null) {
  if (!event) return null;
  if (isDailyReservationEventId(event.id) || isDailyReservationTitle(event.title)) {
    return "Table Reservation";
  }
  return event.title ?? null;
}

const EVENT_TIME_ZONE = "Asia/Ulaanbaatar";

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatEventDateTime(
  value: Date | string,
  locale: "en" | "mn" = "mn",
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat(locale === "mn" ? "en-CA" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}.${map.month}.${map.day} • ${map.hour}:${map.minute}`;
}

export function formatEventDate(
  value: Date | string,
  locale: "en" | "mn" = "mn",
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat(locale === "mn" ? "en-CA" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}.${map.month}.${map.day}`;
}

export function formatEventTime(value: Date | string) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.hour}:${map.minute}`;
}

export function getEventDayBadge(value: Date | string) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "" };

  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    day: "2-digit",
  }).format(date);
  const month = new Intl.DateTimeFormat("en", {
    timeZone: EVENT_TIME_ZONE,
    month: "short",
  }).format(date);

  return { day, month };
}

import type { Locale } from "@/lib/i18n";

type WeekItem = {
  id: string;
  startsAt: Date;
};

export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 7);
  return d;
}

export function getCurrentWeekWindow(now = new Date()) {
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  return { start, end };
}

export function weekKey(date: Date) {
  const start = startOfWeek(date);
  return start.toISOString().slice(0, 10);
}

function formatShortDate(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatWeekRange(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

export function weekLabel(locale: Locale, start: Date, currentStart: Date) {
  const weekOffset = Math.round(
    (start.getTime() - currentStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  if (weekOffset === 0) return locale === "mn" ? "Энэ 7 хоног" : "This week";
  if (weekOffset === 1) {
    return locale === "mn" ? "Дараагийн 7 хоног" : "Next week";
  }
  return locale === "mn"
    ? `${weekOffset + 1} дахь 7 хоног`
    : `Week ${weekOffset + 1}`;
}

export function groupByWeek<T extends WeekItem>(items: T[], now = new Date()) {
  const currentStart = startOfWeek(now);
  const map = new Map<string, { start: Date; items: T[] }>();
  for (const item of items) {
    const start = startOfWeek(item.startsAt);
    const key = weekKey(start);
    const existing = map.get(key);
    if (existing) existing.items.push(item);
    else map.set(key, { start, items: [item] });
  }
  return [...map.values()].sort((a, b) => a.start.getTime() - b.start.getTime()).map((group) => ({
    ...group,
    currentStart,
  }));
}

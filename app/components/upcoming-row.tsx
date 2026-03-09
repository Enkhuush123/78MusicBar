/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

type RowEvent = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  venue: string;
  startsAt: string;
};

function fmt(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} • ${hh}:${min}`;
}

export default function UpcomingRow({
  locale,
  events,
}: {
  locale: Locale;
  events: RowEvent[];
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || events.length === 0) return;

    const timer = setInterval(() => {
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 0) return;
      const firstCard = row.children.item(0) as HTMLElement | null;
      const step = (firstCard?.clientWidth ?? 300) + 16;
      const next = row.scrollLeft + step;
      if (next >= max - 8) {
        row.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        row.scrollTo({ left: next, behavior: "smooth" });
      }
    }, 2600);

    return () => clearInterval(timer);
  }, [events.length]);

  if (events.length === 0) {
    return (
      <p className="text-sm text-[#5a412d]">
        {tr(locale, "No upcoming events.", "Удахгүй эвент алга.")}
      </p>
    );
  }

  return (
    <div ref={rowRef} className="flex gap-4 overflow-x-auto pb-2">
      {events.map((e) => (
        <div
          key={e.id}
          className="jazz-panel w-[88%] shrink-0 overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 sm:w-[48%] xl:w-[32%]"
        >
          <img
            src={e.imageUrl || "/galaxy.jpg"}
            alt={e.title}
            className="h-52 w-full object-cover"
          />
          <div className="p-3">
            <h3 className="jazz-heading text-2xl text-amber-100">{e.title}</h3>
            <p className="mt-2 text-sm text-amber-50/70">{fmt(e.startsAt)}</p>
            <p className="text-sm text-amber-50/70">
              {tr(locale, "Price", "Үнэ")}:{" "}
              <span className="font-semibold text-amber-200">
                {e.price.toLocaleString()} {e.currency}
              </span>
            </p>
            <p className="text-sm text-amber-50/70">{e.venue}</p>
            <Link
              href={`/events/${e.id}/reserve`}
              className="ger-btn-secondary mt-4 inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold"
            >
              {tr(locale, "Reserve table", "Ширээ захиалах")}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

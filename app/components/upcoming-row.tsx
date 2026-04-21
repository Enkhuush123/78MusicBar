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

function dayBadge(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return { day: "--", month: "" };
  return {
    day: String(dt.getUTCDate()).padStart(2, "0"),
    month: dt.toLocaleString("en", { month: "short", timeZone: "UTC" }),
  };
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
    if (window.innerWidth < 640) return;

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
        {tr(locale, "No events this week.", "Энэ 7 хоногт эвент алга.")}
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={rowRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-4"
      >
        {events.map((e) => {
          const badge = dayBadge(e.startsAt);
          return (
            <article
              key={e.id}
              className="group relative w-[82vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#3e2b1c]/20 bg-[#21160f] shadow-[0_14px_26px_rgba(52,32,18,0.18)] transition duration-300 hover:-translate-y-1 sm:w-[360px]"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={e.imageUrl || "/galaxy.jpg"}
                  alt={e.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b120c] via-[#1b120c]/25 to-transparent" />
                <div className="absolute left-3 top-3 rounded-xl border border-white/25 bg-black/45 px-3 py-2 text-center backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100/80">
                    {badge.month}
                  </p>
                  <p className="text-2xl font-extrabold leading-none text-amber-50">
                    {badge.day}
                  </p>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="jazz-heading line-clamp-2 text-[1.65rem] leading-none text-amber-50">
                    {e.title}
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                <div className="grid gap-1 text-sm text-amber-50/78">
                  <p>{fmt(e.startsAt)}</p>
                  <p className="line-clamp-1">{e.venue}</p>
                  <p>
                    {tr(locale, "Price", "Үнэ")}:{" "}
                    <span className="font-semibold text-amber-200">
                      {e.price.toLocaleString()} {e.currency}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/events/${e.id}/reserve`}
                  className="ger-btn-secondary inline-flex h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold"
                >
                  {tr(locale, "Reserve table", "Ширээ захиалах")}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-14 bg-gradient-to-l from-[#efe2d1] to-transparent sm:block" />
    </div>
  );
}

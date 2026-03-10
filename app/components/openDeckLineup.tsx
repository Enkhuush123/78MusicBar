"use client";

import { Locale, tr } from "@/lib/i18n";
import { Instagram } from "lucide-react";

type Row = {
  id: string;
  djName: string;
  socialUrl: string | null;
  genre: string;
  slot: {
    startsAt: string;
    endsAt: string;
    day: { eventDate: string };
  } | null;
};

function fmtDate(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function extractType(value: string) {
  const raw = String(value || "").trim();
  const parts = raw.split(/\s\|\s/).map((x) => x.trim()).filter(Boolean);
  return parts[0] || raw;
}

function typeTone(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("band")) {
    return "border-sky-300/55 bg-sky-100 text-sky-900";
  }
  if (lower.includes("artist") || lower.includes("vocal") || lower.includes("singer")) {
    return "border-rose-300/55 bg-rose-100 text-rose-900";
  }
  if (lower.includes("dj")) {
    return "border-amber-300/55 bg-amber-100 text-amber-900";
  }
  return "border-[#d6bea2] bg-[#fff4e6] text-[#6a503a]";
}

export default function OpenDeckLineup({
  locale,
  rows,
}: {
  locale: Locale;
  rows: Row[];
}) {
  const grouped = rows.reduce<Record<string, Row[]>>((acc, row) => {
    const key = row.slot
      ? fmtDate(row.slot.day.eventDate)
      : tr(locale, "No Date", "Огноогүй");
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const orderedDays = Object.keys(grouped).sort((a, b) => {
    const ta = Date.parse(a.replace(/\./g, "-"));
    const tb = Date.parse(b.replace(/\./g, "-"));
    if (Number.isNaN(ta) || Number.isNaN(tb)) return a.localeCompare(b);
    return ta - tb;
  });

  return (
    <section className="ger-surface rounded-3xl p-4 sm:p-5">
      <div className="mb-3">
        <p className="ger-kicker">Open Deck</p>
        <h2 className="jazz-heading text-3xl text-[#2f2116] sm:text-4xl">
          {tr(locale, " DJ Lineup", "DJ жагсаалт")}
        </h2>
      </div>

      <div className="grid gap-3">
        {orderedDays.map((day) => (
          <div
            key={day}
            className="rounded-2xl border border-[#ddcab2] bg-[linear-gradient(160deg,#fff9f1_0%,#fff1e1_100%)] p-3"
          >
            <p className="jazz-heading text-xs tracking-[0.14em] text-[#7a5d42]">
              {day}
            </p>
            <div className="mt-2 grid gap-2">
              {grouped[day].map((row, i) => {
                const djType = extractType(row.genre) || tr(locale, "Type", "Төрөл");
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[#e4d2be] bg-[linear-gradient(170deg,#ffffff_0%,#fff8ef_100%)] p-3 shadow-[0_8px_18px_rgba(86,55,31,0.06)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#2f2116]">
                        #{i + 1} {row.djName}
                      </p>
                      <span className="rounded-full border border-[#e6d3bc] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                        {tr(locale, "Type", "Төрөл")}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${typeTone(djType)}`}
                      >
                        {djType}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-[#6a503a]">
                      {row.slot
                        ? `${fmtTime(row.slot.startsAt)} - ${fmtTime(row.slot.endsAt)}`
                        : "-"}
                    </p>
                    {row.socialUrl ? (
                      <a
                        href={row.socialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#6a503a] underline underline-offset-4 hover:text-[#3f2d1e]"
                      >
                        <Instagram className="h-3.5 w-3.5" />
                        {tr(locale, "Instagram", "Instagram")}
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className="text-sm text-[#6a503a]">
            {tr(locale, "No Open Deck DJs yet.", "Одоогоор  DJ алга.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

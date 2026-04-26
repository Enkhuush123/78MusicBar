import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { DAILY_RESERVATION_PREFIX } from "@/lib/daily-reservation";

export default async function AdminEventsPage() {
  const locale = await getServerLocale();
  const events = await prisma.event.findMany({
    where: { NOT: { id: { startsWith: DAILY_RESERVATION_PREFIX } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <section className="mx-auto max-w-6xl px-1 py-2">
      <div className="jazz-panel rounded-2xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="jazz-heading text-amber-200">
              {tr(locale, "Management", "Удирдлага")}
            </p>
            <h1 className="jazz-heading text-4xl text-amber-50">
              {tr(locale, "Events", "Эвентүүд")}
            </h1>
            <p className="mt-1 text-sm text-amber-100/80">
              {tr(
                locale,
                "Create, edit, publish and manage event pages.",
                "Эвент үүсгэх, засах, нийтлэх болон удирдах.",
              )}
            </p>
          </div>

          <Link
            href="/admin/events/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-semibold text-neutral-900 hover:bg-amber-200 transition"
          >
            {tr(locale, "+ New Event", "+ Шинэ эвент")}
          </Link>
        </div>

        <div className="mt-8 grid gap-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-amber-300/25 bg-black/20 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-amber-50">{e.title}</p>
                  {e.isPublished ? (
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                      {tr(locale, "Published", "Нийтэлсэн")}
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-xs text-amber-100/70">
                      {tr(locale, "Draft", "Ноорог")}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-amber-100/75">
                  {tr(locale, "Starts", "Эхлэх")}: {e.startsAt.toLocaleString()}
                  {e.endsAt ? ` • ${tr(locale, "Ends", "Дуусах")}: ${e.endsAt.toLocaleString()}` : ""}
                </p>

                <p className="mt-1 text-sm text-amber-100/75">
                  {tr(locale, "Price", "Үнэ")}: {e.price.toLocaleString()} {e.currency} • {tr(locale, "Venue", "Байршил")}:{" "}
                  {e.venue}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/events/${e.id}/edit`}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-300/40 px-3 text-sm text-amber-50 hover:bg-amber-300/15 transition"
                >
                  {tr(locale, "Edit", "Засах")}
                </Link>

                <Link
                  href={`/events/${e.id}/reserve`}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-300/40 px-3 text-sm text-amber-50 hover:bg-amber-300/15 transition"
                >
                  {tr(locale, "Reserve page", "Захиалгын хуудас")}
                </Link>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-10 text-center">
              <p className="font-semibold text-amber-50">
                {tr(locale, "No events yet.", "Одоогоор эвент алга байна.")}
              </p>
              <p className="mt-2 text-sm text-amber-100/70">
                {tr(locale, "Click “New Event” to create one.", "“Шинэ эвент” дарж үүсгээрэй.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

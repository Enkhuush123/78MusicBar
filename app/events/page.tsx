import { prisma } from "@/lib/prisma";
import { EventCard } from "../components/eventCard";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { DAILY_RESERVATION_PREFIX } from "@/lib/daily-reservation";
import {
  formatWeekRange,
  getCurrentWeekWindow,
  groupByWeek,
  weekKey,
  weekLabel,
} from "@/lib/event-weeks";

export default async function EventsPage() {
  const locale = await getServerLocale();
  const now = new Date();
  const { start: weekStart } = getCurrentWeekWindow(now);
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      startsAt: { gte: weekStart },
      NOT: { id: { startsWith: DAILY_RESERVATION_PREFIX } },
    },
    orderBy: { startsAt: "asc" },
  });
  const weekGroups = groupByWeek(events, now);

  return (
    <main className="pt-22 sm:pt-24">
      <section className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="ger-surface rounded-3xl p-5 sm:p-8 md:p-10">
          <p className="ger-kicker">
            {tr(locale, "Calendar", "Хуваарь")}
          </p>
          <h1 className="jazz-heading text-[2.5rem] text-[#2f2116] md:text-7xl">
            {tr(locale, "Events", "Эвентүүд")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#5a412d] sm:text-xl">
            {tr(
              locale,
              "Upcoming live performances and special events at 78MusicBar.",
              "Удахгүй болох амьд хөгжмийн тоглолтууд ба Эвентүүд.",
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
        {events.length === 0 ? (
          <div className="ger-surface rounded-2xl p-10 text-center text-[#5a412d]">
            {tr(
              locale,
              "No upcoming events yet.",
              "Одоогоор эвент алга байна.",
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {weekGroups.map((group) => {
              return (
                <section key={weekKey(group.start)}>
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="ger-kicker">
                        {weekLabel(locale, group.start, group.currentStart)}
                      </p>
                      <h2 className="jazz-heading text-3xl text-[#2f2116] sm:text-4xl">
                        {formatWeekRange(group.start)}
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((e) => (
                      <EventCard
                        key={e.id}
                        id={e.id}
                        title={e.title}
                        imageUrl={e.imageUrl}
                        price={String(e.price)}
                        currency={e.currency}
                        venue={e.venue}
                        djName={e.djName}
                        djType={e.djType}
                        startsAt={e.startsAt}
                        description={e.description}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

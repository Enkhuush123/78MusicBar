import { prisma } from "@/lib/prisma";
import { EventCard } from "../components/eventCard";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function EventsPage() {
  const locale = await getServerLocale();
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main className="pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="jazz-shell rounded-3xl p-8 md:p-10">
          <p className="jazz-heading text-amber-200">
            {tr(locale, "Calendar", "Хуваарь")}
          </p>
          <h1 className="jazz-heading text-5xl text-amber-50 md:text-7xl">
            {tr(locale, "Events", "Эвентүүд")}
          </h1>
          <p className="mt-3 max-w-2xl text-xl text-amber-100/85">
            {tr(
              locale,
              "Upcoming live performances and special events at 78 Music Bar.",
              "Удахгүй болох амьд хөгжмийн тоглолтууд ба Эвентүүд.",
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {events.length === 0 ? (
          <div className="jazz-panel rounded-2xl p-10 text-center text-amber-100/80">
            {tr(
              locale,
              "No upcoming events yet.",
              "Одоогоор эвент алга байна.",
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard
                key={e.id}
                id={e.id}
                title={e.title}
                imageUrl={e.imageUrl}
                price={String(e.price)}
                currency={e.currency}
                venue={e.venue}
                startsAt={e.startsAt}
                description={e.description}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

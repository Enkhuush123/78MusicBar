/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/app/components/eventCard";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import ReviewsSection from "@/app/components/reviewsSection";

function formatDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function HomePage() {
  const locale = await getServerLocale();
  const now = new Date();

  const hero = await prisma.homeHero.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  const manualFeatured = await prisma.homeFeaturedEvent.findMany({
    where: {
      isActive: true,
      event: { isPublished: true, startsAt: { gte: now } },
    },
    orderBy: [{ sort: "asc" }, { updatedAt: "desc" }],
    include: { event: true },
    take: 8,
  });

  const manualSpecial = manualFeatured.find((x) => x.sort === 0)?.event;
  const manualUpcoming = manualFeatured
    .filter((x) => x.sort > 0)
    .map((x) => x.event)
    .slice(0, 6);

  const featured =
    manualSpecial ??
    (await prisma.event.findFirst({
      where: { isPublished: true, isFeatured: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    })) ??
    (await prisma.event.findFirst({
      where: { isPublished: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }));

  const selectedUpcoming = manualUpcoming.filter((x) => x.id !== featured?.id);

  const upcoming = await prisma.event.findMany({
    where: {
      isPublished: true,
      startsAt: { gte: now },
      ...(featured ? { NOT: { id: featured.id } } : {}),
      ...(selectedUpcoming.length
        ? { NOT: { id: { in: selectedUpcoming.map((e) => e.id) } } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 6,
  });

  const reviews = await prisma.review
    .findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, displayName: true, comment: true, rating: true },
    })
    .catch(() => []);

  const heroImg = hero?.imageUrl || "/galaxy.jpg";

  return (
    <main className="pt-20">
      <section className="mx-auto max-w-6xl px-4">
        <div className="jazz-shell relative overflow-hidden rounded-3xl">
          <div className="h-[64vh] min-h-[520px]">
            <img
              src={heroImg}
              alt="hero"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-2xl p-8 md:p-12">
              <h1 className="jazz-heading mt-3 text-5xl text-amber-50 md:text-7xl">
                {hero?.headline ||
                  tr(locale, "Late Night Rhythm", "Шөнийн Хэмнэл")}
              </h1>
              <p className="mt-4 text-xl text-amber-100/85">
                {hero?.subheadline ||
                  tr(
                    locale,
                    "Reserve your table for live sets and signature drinks.",
                    "Амьд хөгжмийн үдэшлэгт ширээгээ урьдчилж захиалаарай.",
                  )}
              </p>
              <div className="mt-7 flex gap-3">
                <Link
                  href={hero?.ctaHref || "/events"}
                  className="rounded-xl bg-amber-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-amber-200"
                >
                  {hero?.ctaText || tr(locale, "View Events", "Эвентүүд")}
                </Link>
                <Link
                  href="/menu/drinks"
                  className="rounded-xl border border-amber-300/60 px-6 py-3 text-sm font-semibold text-amber-50 hover:bg-amber-300/15"
                >
                  {tr(locale, "Drinks Menu", "Уух зүйлсийн меню")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-8 px-4">
        <div className="jazz-panel rounded-3xl p-6">
          <p className="jazz-heading text-amber-200">
            {tr(locale, "Featured Show", "Онцлох Эвент")}
          </p>
          {featured ? (
            <div className="mt-4">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={featured.imageUrl || "/galaxy.jpg"}
                  alt={featured.title}
                  className="h-64 w-full object-cover"
                />
              </div>
              <h2 className="jazz-heading mt-5 text-4xl text-amber-100">
                {featured.title}
              </h2>
              <p className="mt-2 text-amber-50/80">
                {formatDateTime(featured.startsAt)}
              </p>
              <p className="text-amber-50/80">
                {featured.price.toLocaleString()} {featured.currency} •{" "}
                {featured.venue}
              </p>
              <Link
                href={`/events/${featured.id}/reserve`}
                className="mt-5 inline-block rounded-xl bg-amber-300 px-5 py-3 font-semibold text-neutral-900 hover:bg-amber-200"
              >
                {tr(locale, "Reserve Table", "Ширээ захиалах")}
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-amber-50/70">
              {tr(
                locale,
                "No upcoming featured event yet.",
                "Одоогоор онцлох эвент алга.",
              )}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="jazz-heading text-amber-200">
              {tr(locale, "Upcoming", "Удахгүй")}
            </p>
            <h2 className="jazz-heading text-4xl text-amber-50">
              {tr(locale, "Live Schedule", "Хуваарь")}
            </h2>
          </div>
          <Link
            href="/events"
            className="text-sm text-amber-100 underline underline-offset-4"
          >
            {tr(locale, "All events", "Бүх эвент")}
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...selectedUpcoming, ...upcoming].slice(0, 6).map((e) => (
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
      </section>

      <ReviewsSection locale={locale} initialReviews={reviews} />
    </main>
  );
}

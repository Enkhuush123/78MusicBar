/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import ReviewsSection from "@/app/components/reviewsSection";
import CollectionsShowcase from "@/app/components/collections-showcase";
import UpcomingRow from "@/app/components/upcoming-row";
import OpenDeckLineup from "@/app/components/openDeckLineup";
import HomeHeroCarousel from "@/app/components/home-hero-carousel";
import HomeGalleryCarousel from "@/app/components/home-gallery-carousel";
import InstagramShowcase from "@/app/components/instagram-showcase";
import { HOME_GALLERY_SLUG, parseHomeGallery } from "@/lib/home-gallery";
import {
  HOME_INSTAGRAM_POSTS_SLUG,
  parseHomeInstagramPosts,
} from "@/lib/home-instagram-posts";
import { getCurrentWeekWindow } from "@/lib/event-weeks";
import { getReservationSettings } from "@/lib/reservation-settings";

const FIXED_TYPES = [
  { key: "dj", nameEn: "DJ", nameMn: "DJ" },
  { key: "artist", nameEn: "Artist", nameMn: "Artist" },
  { key: "band", nameEn: "Band", nameMn: "Band" },
] as const;

function normalizeTypeKey(nameEn: string, nameMn: string) {
  const raw = `${nameEn} ${nameMn}`.toLowerCase();
  if (raw.includes("dj")) return "dj";
  if (raw.includes("band") || raw.includes("хамтлаг")) return "band";
  if (raw.includes("artist") || raw.includes("уран")) return "artist";
  return null;
}

function formatDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toSafeImageUrl(value?: string | null) {
  const url = String(value ?? "").trim();
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  ) {
    return url;
  }
  return null;
}

function uniqueUrls(values: Array<string | null | undefined>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const safe = toSafeImageUrl(raw);
    if (!safe || seen.has(safe)) continue;
    seen.add(safe);
    out.push(safe);
  }
  return out;
}

async function safeDb<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[HomePage] ${label} failed`, error);
    return fallback;
  }
}

export default async function HomePage() {
  const locale = await getServerLocale();
  const now = new Date();
  const nextSevenDays = new Date(now);
  nextSevenDays.setDate(nextSevenDays.getDate() + 7);
  const { start: weekStart, end: weekEnd } = getCurrentWeekWindow(now);
  const reservationSettings = await safeDb(
    "reservationSettings",
    () => getReservationSettings(),
    { paymentRequired: true, allowCustomDate: false },
  );

  const hero = await safeDb(
    "homeHero.findFirst",
    () =>
      prisma.homeHero.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
    null,
  );
  const heroSlides = await safeDb(
    "homeImage.findMany",
    () =>
      prisma.homeImage.findMany({
        orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
        take: 40,
      }),
    [],
  );
  const homeGalleryPage = await safeDb(
    "sitePage.findUnique(homeGallery)",
    () =>
      prisma.sitePage.findUnique({
        where: { slug: HOME_GALLERY_SLUG },
      }),
    null,
  );
  const homeInstagramPage = await safeDb(
    "sitePage.findUnique(homeInstagram)",
    () =>
      prisma.sitePage.findUnique({
        where: { slug: HOME_INSTAGRAM_POSTS_SLUG },
      }),
    null,
  );

  const manualFeatured = await safeDb(
    "homeFeaturedEvent.findMany",
    () =>
      prisma.homeFeaturedEvent.findMany({
        where: {
          isActive: true,
          event: {
            isPublished: true,
            startsAt: { gte: now, lt: nextSevenDays },
          },
        },
        orderBy: [{ sort: "asc" }, { updatedAt: "desc" }],
        include: { event: true },
        take: 8,
      }),
    [],
  );

  const manualSpecial = manualFeatured.find((x) => x.sort === 0)?.event;
  const featured = manualSpecial ?? null;

  const weekEvents = await safeDb(
    "event.findMany(weekEvents)",
    () =>
      prisma.event.findMany({
        where: {
          isPublished: true,
          startsAt: { gte: now, lt: nextSevenDays },
        },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
    [],
  );

  const reviews = await safeDb(
    "review.findMany",
    () =>
      prisma.review.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, displayName: true, comment: true, rating: true },
      }),
    [],
  );

  const collectionsDelegate = (
    prisma as unknown as {
      collectionCategory?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            nameEn: string;
            nameMn: string;
            sort: number;
            isActive: boolean;
            items: Array<{
              id: string;
              nameEn: string;
              nameMn: string;
              infoEn: string;
              infoMn: string;
              imageUrl: string | null;
              isActive: boolean;
              sort: number;
            }>;
          }>
        >;
      };
    }
  ).collectionCategory;

  const categories = collectionsDelegate
    ? await safeDb(
        "collectionCategory.findMany",
        () =>
          collectionsDelegate.findMany({
            where: { isActive: true },
            orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
            include: {
              items: {
                where: { isActive: true },
                orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
              },
            },
          }),
        [],
      )
    : [];

  const openDeckDelegate = (
    prisma as unknown as {
      openDeckReservation?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            djName: string;
            genre: string;
            socialUrl: string | null;
            slot: {
              startsAt: Date;
              endsAt: Date;
              day: { eventDate: Date };
            } | null;
          }>
        >;
      };
    }
  ).openDeckReservation;

  const approvedOpenDeck = openDeckDelegate
    ? await safeDb(
        "openDeckReservation.findMany",
        () =>
          openDeckDelegate.findMany({
            where: {
              status: "approved",
              slot: { startsAt: { gte: weekStart, lt: weekEnd } },
            },
            orderBy: [{ slot: { startsAt: "asc" } }, { approvedAt: "desc" }],
            take: 12,
            select: {
              id: true,
              djName: true,
              genre: true,
              socialUrl: true,
              slot: {
                select: {
                  startsAt: true,
                  endsAt: true,
                  day: { select: { eventDate: true } },
                },
              },
            },
          }),
        [],
      )
    : [];

  const categoryByType = new Map<
    "dj" | "artist" | "band",
    (typeof categories)[number]
  >();
  for (const cat of categories) {
    const key = normalizeTypeKey(cat.nameEn, cat.nameMn);
    if (key && !categoryByType.has(key)) categoryByType.set(key, cat);
  }
  const performerGroups = FIXED_TYPES.map((type) => {
    const cat = categoryByType.get(type.key);
    return {
      key: type.key,
      label: locale === "mn" ? type.nameMn : type.nameEn,
      subtitle: tr(locale, "Performer Type", "Уран бүтээлчийн төрөл"),
      items: (cat?.items ?? []).map((row) => ({
        id: row.id,
        name: locale === "mn" ? row.nameMn : row.nameEn,
        info: locale === "mn" ? row.infoMn : row.infoEn,
        imageUrl: row.imageUrl,
      })),
    };
  }).filter((group) => group.items.length > 0);
  const performerCount = performerGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  const activeSliderImages = heroSlides
    .filter((row) => row.isActive)
    .map((row) => row.imageUrl);
  const anySliderImages = heroSlides.map((row) => row.imageUrl);
  const heroImages = uniqueUrls([
    ...(activeSliderImages.length ? activeSliderImages : anySliderImages),
    hero?.imageUrl,
  ]);
  const galleryRows = parseHomeGallery(homeGalleryPage?.body);
  const activeGalleryImages = galleryRows
    .filter((row) => row.isActive)
    .map((row) => row.imageUrl);
  const anyGalleryImages = galleryRows.map((row) => row.imageUrl);
  const galleryImages = uniqueUrls(
    activeGalleryImages.length ? activeGalleryImages : anyGalleryImages,
  ).slice(0, 18);
  const instagramRows = parseHomeInstagramPosts(homeInstagramPage?.body);
  const instagramPosts = instagramRows.filter((row) => row.isActive).length
    ? instagramRows.filter((row) => row.isActive)
    : instagramRows;

  return (
    <main className="pt-16 sm:pt-20">
      <section className="mx-auto max-w-7xl px-3 sm:px-4">
        <HomeHeroCarousel
          locale={locale}
          slides={heroImages}
          headline={
            hero?.headline || tr(locale, "Late Night Rhythm", "Шөнийн Хэмнэл")
          }
          subheadline={
            hero?.subheadline ||
            tr(
              locale,
              "Reserve your table for live sets and signature drinks.",
              "Амьд хөгжмийн үдэшлэгт ширээгээ урьдчилж захиалаарай.",
            )
          }
          ctaHref={hero?.ctaHref || "/events"}
          ctaText={hero?.ctaText || tr(locale, "View Events", "Эвентүүд")}
        />
      </section>

      {galleryImages.length > 0 && (
        <section className="mx-auto mt-7 max-w-7xl px-3 sm:px-4">
          <div className="jazz-panel rounded-3xl p-4 sm:p-5 md:p-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="ger-kicker text-amber-200">
                  {tr(locale, "Gallery", "Галерей")}
                </p>
                <h2 className="jazz-heading text-2xl text-amber-50 sm:text-3xl md:text-4xl">
                  {tr(locale, " 78MusicBar", "78MusicBar ")}
                </h2>
              </div>
            </div>

            <div className="mt-4 sm:mt-5">
              <HomeGalleryCarousel locale={locale} images={galleryImages} />
            </div>
          </div>
        </section>
      )}

      {instagramPosts.length > 0 && (
        <InstagramShowcase
          locale={locale}
          posts={instagramPosts}
          profileUrl="https://instagram.com/78musicbar/"
          handle="78musicbar"
        />
      )}

      <section className="mx-auto mt-7 max-w-7xl px-3 pb-10 sm:mt-8 sm:px-4 sm:pb-12">
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0 space-y-4 sm:space-y-6">
            <div className="jazz-panel min-w-0 rounded-3xl p-4 sm:p-6">
              <p className="ger-kicker text-amber-200">
                {tr(locale, "Featured Show", "Онцлох Эвент")}
              </p>
              {featured ? (
                <div className="mt-4">
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src={featured.imageUrl || "/galaxy.jpg"}
                      alt={featured.title}
                      className="h-52 w-full object-cover sm:h-64"
                    />
                  </div>
                  <h2 className="jazz-heading mt-4 text-[1.9rem] text-amber-100 sm:mt-5 sm:text-4xl">
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
                    className="ger-btn-secondary mt-5 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold sm:w-auto"
                  >
                    {tr(locale, "Reserve Table", "Ширээ захиалах")}
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-amber-50/70">
                  {tr(
                    locale,
                    "No featured event this week.",
                    "Энэ 7 хоногт онцлох эвент алга.",
                  )}
                </p>
              )}
            </div>

            <div className="ger-surface min-w-0 rounded-3xl px-3 py-4 sm:px-4 sm:py-6">
              <div className="mb-5 flex flex-col items-start gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="ger-kicker">
                    {tr(locale, "Week Calendar", "7 хоногийн хуваарь")}
                  </p>
                  <h2 className="jazz-heading text-[1.9rem] text-[#2f2116] sm:text-4xl">
                    {tr(locale, "This Week", "Энэ 7 хоног")}
                  </h2>
                </div>
                <Link
                  href="/events"
                  className="text-sm font-medium text-[#5a412d] underline underline-offset-4"
                >
                  {tr(locale, "All events", "Бүх эвент")}
                </Link>
              </div>
              <UpcomingRow
                locale={locale}
                events={weekEvents.map((e) => ({
                  id: e.id,
                  title: e.title,
                  imageUrl: e.imageUrl ?? null,
                  price: e.price,
                  currency: e.currency,
                  venue: e.venue,
                  startsAt: e.startsAt.toISOString(),
                }))}
              />
            </div>

            {reservationSettings.allowCustomDate ? (
              <div className="ger-surface min-w-0 overflow-hidden rounded-3xl border border-[#d7bc93] p-0">
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="px-4 py-5 sm:px-6 sm:py-6">
                      <p className="ger-kicker">
                        {tr(locale, "Today", "Өнөөдөр")}
                      </p>
                      <h2 className="jazz-heading text-[1.9rem] text-[#2f2116] sm:text-4xl">
                        {tr(locale, "Reserve Table Today", "Өнөөдөр ширээ захиалах")}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-[#5a412d] sm:text-base">
                        {tr(
                          locale,
                          "Open today-only reservations between 18:00 and 22:00.",
                          "Өнөөдрийн 18:00-22:00 цагийн хооронд ширээгээ шууд захиалаарай.",
                        )}
                      </p>
                      <Link
                        href="/reserve"
                        className="ger-btn-primary mt-4 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold"
                      >
                        {tr(locale, "Reserve Table Today", "Өнөөдөр ширээ захиалах")}
                      </Link>
                    </div>
                  </div>
                  <div className="relative min-h-[220px] bg-[radial-gradient(circle_at_top,rgba(255,246,226,0.95),rgba(244,233,216,0.82)_38%,rgba(215,188,147,0.42)_100%)]">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.38)_0%,rgba(255,255,255,0)_45%)]" />
                    <div className="relative flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                      <img
                        src="/78MusicBar.png"
                        alt="78MusicBar"
                        className="h-20 w-auto object-contain sm:h-24"
                      />
                      <p className="text-xs uppercase tracking-[0.28em] text-[#7a573b]">
                        18:00 - 22:00
                      </p>
                      <p className="max-w-xs text-sm text-[#6a4930]">
                        {tr(
                          locale,
                          "Choose your time and table for today's service.",
                          "Өнөөдрийн үйлчилгээний цагаас сонгоод ширээгээ аваарай.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <OpenDeckLineup
              locale={locale}
              rows={approvedOpenDeck.map((x) => ({
                id: x.id,
                djName: x.djName,
                genre: x.genre,
                socialUrl: x.socialUrl,
                slot: x.slot
                  ? {
                      startsAt: x.slot.startsAt.toISOString(),
                      endsAt: x.slot.endsAt.toISOString(),
                      day: { eventDate: x.slot.day.eventDate.toISOString() },
                    }
                  : null,
              }))}
            />

            <ReviewsSection locale={locale} initialReviews={reviews} embedded />
          </div>

          <div className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="jazz-panel min-w-0 rounded-3xl p-4 sm:p-5">
              <p className="ger-kicker text-amber-200">
                {tr(locale, "Artist Spotlight", "Artist Spotlight")}
              </p>
              <h3 className="jazz-heading mt-2 text-2xl text-amber-50 sm:text-3xl">
                {tr(locale, "Resident Performers", "Манай уран бүтээлчид")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
                {tr(
                  locale,
                  "Meet the DJs, artists, and bands who play at 78MusicBar.",
                  "78MusicBar дээр тоглодог DJ, artist, band-уудтай танилцаарай.",
                )}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-200/80">
                  {tr(locale, "Profiles", "Профайл")}
                </p>
                <p className="text-xl font-extrabold text-amber-50">
                  {performerCount}
                </p>
              </div>
              <Link
                href="/collections"
                className="ger-btn-secondary mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold sm:w-auto"
              >
                {tr(locale, "Open Full Lineup", "Бүх lineup үзэх")}
              </Link>
            </div>

            <div className="ger-surface min-w-0 rounded-3xl p-2.5 sm:p-3">
              <CollectionsShowcase groups={performerGroups} compact />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

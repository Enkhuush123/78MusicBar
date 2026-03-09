/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { parseAboutContent, pickLocaleText } from "@/lib/about-content";

export default async function AboutPage() {
  const locale = await getServerLocale();
  const about = await prisma.sitePage.findUnique({ where: { slug: "about" } });
  const content = parseAboutContent(about?.body);
  const gallery = content.gallery.filter(
    (item) => item.imageUrl.trim().length > 0,
  );
  const intro = pickLocaleText(content.intro, locale);
  const storyHeading = pickLocaleText(content.storyHeading, locale);
  const storyBody = pickLocaleText(content.storyBody, locale);
  const vibeHeading = pickLocaleText(content.vibeHeading, locale);
  const vibeBody = pickLocaleText(content.vibeBody, locale);
  const quote = pickLocaleText(content.quote, locale);
  const detailsHeading = pickLocaleText(content.detailsHeading, locale);
  const detailsBody = pickLocaleText(content.detailsBody, locale);
  const address = pickLocaleText(content.address, locale);
  const hours = pickLocaleText(content.hours, locale);
  const contact = pickLocaleText(content.contact, locale);
  const heroImage =
    about?.imageUrl?.trim() || gallery[0]?.imageUrl || "/galaxy.jpg";

  const visitRows = [
    { label: tr(locale, "Address", "Хаяг"), value: address },
    { label: tr(locale, "Hours", "Цагийн хуваарь"), value: hours },
    { label: tr(locale, "Contact", "Холбоо барих"), value: contact },
  ];

  return (
    <main className="relative overflow-hidden pt-24 pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(229,169,95,0.24),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(122,84,48,0.22),transparent_42%)]" />

      <section className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-[linear-gradient(132deg,#27180f_0%,#1d130d_35%,#392314_100%)] shadow-[0_24px_65px_rgba(14,9,5,0.36)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <article className="relative p-6 md:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_14%,rgba(255,208,149,0.17),transparent_44%)]" />
              <div className="relative">
                <h1 className="jazz-heading max-w-3xl text-5xl text-amber-50 md:text-7xl">
                  {about?.title || "78MusicBar"}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-amber-50/90 md:text-xl">
                  {intro}
                </p>
              </div>
            </article>

            <aside className="relative min-h-[380px] overflow-hidden border-t border-amber-200/20 lg:min-h-[520px] lg:border-t-0 lg:border-l">
              <img
                src={heroImage}
                alt={about?.title ?? "About"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/25" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,210,152,0.18),transparent_40%)]" />
              {quote.trim() ? (
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="max-w-xl text-lg italic text-amber-100/95">
                    “{quote}”
                  </p>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-3xl border border-amber-200/20 bg-[linear-gradient(165deg,rgba(38,25,17,0.97)_0%,rgba(23,16,12,0.98)_100%)] p-6 md:p-8">
            <h2 className="jazz-heading text-4xl text-amber-100">
              {storyHeading}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-amber-100/84">
              {storyBody}
            </p>
          </article>

          <aside className="grid gap-4">
            <article className="rounded-3xl border border-amber-200/20 bg-[linear-gradient(150deg,rgba(64,41,28,0.95)_0%,rgba(30,20,15,0.95)_100%)] p-6">
              <h3 className="jazz-heading text-3xl text-amber-100">
                {vibeHeading}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-amber-100/83">
                {vibeBody}
              </p>
            </article>

            <article className="rounded-3xl border border-amber-200/20 bg-[linear-gradient(150deg,rgba(53,35,23,0.96)_0%,rgba(28,19,14,0.96)_100%)] p-6">
              <h3 className="jazz-heading text-3xl text-amber-100">
                {detailsHeading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-amber-100/82">
                {detailsBody}
              </p>
              <div className="mt-5 space-y-3">
                {visitRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-xl border border-amber-200/15 bg-black/25 px-3 py-2.5"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-amber-200/85">
                      {row.label}
                    </p>
                    <p className="text-sm text-amber-50/92">{row.value}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 pb-4">
        <div className="rounded-3xl border border-amber-200/20 bg-[linear-gradient(155deg,rgba(36,23,16,0.98)_0%,rgba(19,14,11,0.98)_100%)] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ger-kicker text-amber-200">
                {tr(locale, "Gallery", "Галерей")}
              </p>
              <h2 className="jazz-heading text-4xl text-amber-50">
                {tr(locale, "Inside 78MusicBar", "78MusicBar дотор")}
              </h2>
            </div>
          </div>

          {gallery.length > 0 ? (
            <div className="mt-5 grid auto-rows-[145px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.map((item, i) => (
                <a
                  key={`${item.imageUrl}-${i}`}
                  href={item.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    "group relative overflow-hidden rounded-2xl border border-amber-200/20 bg-black/30 shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
                    i % 7 === 0 ? "sm:col-span-2 sm:row-span-2" : "",
                    i % 5 === 0 ? "lg:row-span-2" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <img
                    src={item.imageUrl}
                    alt={`about-gallery-${i + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 transition group-hover:opacity-100" />
                  {pickLocaleText(item.text, locale).trim() && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                      <p className="text-sm text-amber-50/95">
                        {pickLocaleText(item.text, locale)}
                      </p>
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-amber-300/30 bg-black/20 p-5 text-sm text-amber-100/75">
              {tr(
                locale,
                "Gallery images will appear here after upload from admin.",
                "Админаас зураг оруулсны дараа энд гарч ирнэ.",
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

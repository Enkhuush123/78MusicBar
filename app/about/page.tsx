/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { parseAboutContent, pickLocaleText } from "@/lib/about-content";

export default async function AboutPage() {
  const locale = await getServerLocale();
  const about = await prisma.sitePage.findUnique({ where: { slug: "about" } });
  const content = parseAboutContent(about?.body);

  return (
    <main className="pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="jazz-shell overflow-hidden rounded-3xl">
          <div className="relative h-72 md:h-96">
            <img
              src={about?.imageUrl || "/galaxy.jpg"}
              alt={about?.title ?? "About"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex items-end p-8 md:p-12">
              <div className="max-w-2xl">
                <p className="jazz-heading text-amber-200">
                  {tr(locale, "About", "Бидний тухай")}
                </p>
                <h1 className="jazz-heading text-5xl text-amber-50 md:text-7xl">
                  {about?.title || "78 Music Bar"}
                </h1>
                <p className="mt-3 text-xl text-amber-100/85">
                  {pickLocaleText(content.intro, locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="jazz-panel rounded-3xl p-6 md:p-8">
          <h2 className="jazz-heading text-3xl text-amber-100">
            {pickLocaleText(content.storyHeading, locale)}
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-amber-100/85">
            {pickLocaleText(content.storyBody, locale)}
          </p>

          <h3 className="jazz-heading mt-8 text-2xl text-amber-100">
            {pickLocaleText(content.vibeHeading, locale)}
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-amber-100/85">
            {pickLocaleText(content.vibeBody, locale)}
          </p>
        </div>

        <div className="grid gap-6">
          <div className="jazz-panel rounded-3xl p-6">
            <p className="text-xl italic text-amber-200">
              “{pickLocaleText(content.quote, locale)}”
            </p>
          </div>

          <div className="jazz-panel rounded-3xl p-6">
            <h3 className="jazz-heading text-2xl text-amber-100">
              {pickLocaleText(content.detailsHeading, locale)}
            </h3>
            <p className="mt-3 text-amber-100/85">
              {pickLocaleText(content.detailsBody, locale)}
            </p>
            <div className="mt-5 space-y-2 text-sm text-amber-100/80">
              <p>{pickLocaleText(content.address, locale)}</p>
              <p>{pickLocaleText(content.hours, locale)}</p>
              <p>{pickLocaleText(content.contact, locale)}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { DRINKS_SPECIALS_SLUG, parseDrinkSpecials } from "@/lib/drink-specials";

export default async function DrinksMenuPage() {
  const locale = await getServerLocale();
  const [items, specialsPage] = await Promise.all([
    prisma.menuImage.findMany({
      where: { category: "drinks", isActive: true },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    }),
    prisma.sitePage.findUnique({ where: { slug: DRINKS_SPECIALS_SLUG } }),
  ]);
  const specials = parseDrinkSpecials(specialsPage?.body)
    .filter((x) => x.isActive)
    .sort((a, b) => a.sort - b.sort);

  return (
    <main className="pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="ger-surface rounded-3xl p-8 md:p-10">
          <p className="ger-kicker">{tr(locale, "Menu", "Меню")}</p>
          <h1 className="jazz-heading text-5xl text-[#2f2116] md:text-7xl">
            {tr(locale, "Drinks", "Уух зүйлс")}
          </h1>
        </div>
      </section>

      {specials.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl px-4">
          <div className="jazz-panel rounded-3xl p-6 md:p-8">
            <p className="jazz-heading text-amber-200">
              {tr(locale, "Special Cocktails", "Онцлох коктейль")}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specials.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/20"
                >
                  <div className="h-52 bg-black/30">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h2 className="jazz-heading text-2xl text-amber-50">{item.name}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-100/85">
                      {item.ingredients}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((it) => (
            <div key={it.id} className="jazz-panel mb-5 break-inside-avoid overflow-hidden rounded-2xl">
              <img src={it.imageUrl} alt="drink" className="w-full object-cover" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

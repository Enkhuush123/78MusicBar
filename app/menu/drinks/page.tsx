/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function DrinksMenuPage() {
  const locale = await getServerLocale();
  const items = await prisma.menuImage.findMany({
    where: { category: "drinks", isActive: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="jazz-shell rounded-3xl p-8 md:p-10">
          <p className="jazz-heading text-amber-200">{tr(locale, "Menu", "Меню")}</p>
          <h1 className="jazz-heading text-5xl text-amber-50 md:text-7xl">
            {tr(locale, "Drinks", "Уух зүйлс")}
          </h1>
        </div>
      </section>
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

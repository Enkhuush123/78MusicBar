/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function MenuPage() {
  const locale = await getServerLocale();
  const items = await prisma.menuImage.findMany({
    where: { isActive: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="ger-surface rounded-3xl p-8 md:p-10">
          <p className="ger-kicker">{tr(locale, "Menu", "Меню")}</p>
          <h1 className="jazz-heading text-5xl text-[#2f2116] md:text-7xl">
            {tr(locale, "Menu", "Меню")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#5a412d] sm:text-xl">
            {tr(
              locale,
              "Food and drinks together in one menu.",
              "Хоол, уух зүйлсийн нэгдсэн меню.",
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="jazz-panel mb-5 break-inside-avoid overflow-hidden rounded-2xl"
            >
              <img src={it.imageUrl} alt="menu" className="w-full object-cover" />
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 ger-surface rounded-2xl p-10 text-center text-[#5a412d]">
            {tr(locale, "Menu is not available yet.", "Меню одоогоор алга байна.")}
          </div>
        ) : null}
      </section>
    </main>
  );
}

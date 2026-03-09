import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import CollectionsShowcase from "@/app/components/collections-showcase";

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

export default async function CollectionsPage() {
  const locale = await getServerLocale();

  const delegate = (
    prisma as unknown as {
      collectionCategory?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            nameEn: string;
            nameMn: string;
            items: Array<{
              id: string;
              nameEn: string;
              nameMn: string;
              infoEn: string;
              infoMn: string;
              imageUrl: string | null;
            }>;
          }>
        >;
      };
    }
  ).collectionCategory;

  const categories = delegate
    ? await delegate
        .findMany({
          where: { isActive: true },
          orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
          include: {
            items: {
              where: { isActive: true },
              orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
            },
          },
        })
        .catch(() => [])
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
  const totalItems = performerGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <main className="relative overflow-hidden pt-24 pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-8 h-[420px] bg-[radial-gradient(circle_at_10%_20%,rgba(234,184,112,0.24),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(133,93,58,0.18),transparent_40%)]" />

      <section className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#d7bea1] bg-[linear-gradient(155deg,#f7ecde_0%,#efdfcc_52%,#e7d4bd_100%)] p-6 shadow-[0_18px_44px_rgba(66,42,23,0.14)] md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.36),transparent_38%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="jazz-heading text-xs uppercase tracking-[0.2em] text-[#7a5d42]">
                Collections
              </p>
              <h1 className="jazz-heading mt-2 text-5xl text-[#2f2116]">
                {tr(
                  locale,
                  "Our DJs, Artists & Bands",
                  "Манай DJ, Artist, Band-ууд",
                )}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5c4330] md:text-base">
                {tr(
                  locale,
                  "Profiles of the performers who play at 78MusicBar.",
                  "78MusicBar дээр тоглодог уран бүтээлчдийн профайл мэдээлэл.",
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:w-[280px]">
              <div className="rounded-2xl border border-[#d9c2a7] bg-[#fff8ef]/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                  {tr(locale, "Performers", "Уран бүтээлч")}
                </p>
                <p className="text-2xl font-extrabold text-[#2f2116]">
                  {totalItems}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d9c2a7] bg-[#fff8ef]/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                  {tr(locale, "Venue", "Тайз")}
                </p>
                <p className="text-xl font-semibold text-[#2f2116]">
                  78MusicBar
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-[#d9c2a7] bg-[linear-gradient(180deg,#f5ebde_0%,#efe2d1_100%)] p-3">
          <CollectionsShowcase groups={performerGroups} stacked />
        </div>
      </section>
    </main>
  );
}

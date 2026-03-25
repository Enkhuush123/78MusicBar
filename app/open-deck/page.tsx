import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import OpenDeckSection from "@/app/components/openDeckSection";

export default async function OpenDeckPage() {
  const locale = await getServerLocale();

  const approved = await prisma.openDeckReservation
    .findMany({
      where: { status: "approved" },
      orderBy: [{ slot: { startsAt: "asc" } }, { approvedAt: "desc" }],
      take: 24,
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
    })
    .catch(() => []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = await prisma.openDeckDay
    .findMany({
      where: { isActive: true, eventDate: { gte: today } },
      orderBy: { eventDate: "asc" },
      take: 14,
      include: {
        slots: {
          orderBy: { startsAt: "asc" },
          include: {
            reservation: {
              select: { id: true, djName: true, status: true },
            },
          },
        },
      },
    })
    .catch(() => []);

  return (
    <main className="pt-22 sm:pt-24">
      <section className="mx-auto max-w-7xl px-3 pb-10 sm:px-4 sm:pb-12">
        <div className="mb-5">
          <p className="jazz-heading text-[#7a5d42]">Open Deck</p>
          <h1 className="jazz-heading text-[2.5rem] text-[#2f2116] sm:text-5xl">
            {tr(locale, "DJ Open Deck", "DJ Open Deck")}
          </h1>
        </div>
        <OpenDeckSection
          locale={locale}
          days={days.map((d) => ({
            id: d.id,
            eventDate: d.eventDate.toISOString(),
            slots: d.slots.map((s) => ({
              id: s.id,
              startsAt: s.startsAt.toISOString(),
              endsAt: s.endsAt.toISOString(),
              isOpen: s.isOpen,
              reservation: s.reservation,
            })),
          }))}
          approved={approved.map((x) => ({
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
      </section>
    </main>
  );
}

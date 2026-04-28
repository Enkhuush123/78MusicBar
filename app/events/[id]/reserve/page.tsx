import { prisma } from "@/lib/prisma";
import ReservationClient from "@/app/components/reservation/ReservationClient";
import { getReservationSettings } from "@/lib/reservation-settings";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return (
      <main className="pt-24 text-center">
        <p className="text-sm text-muted-foreground">Invalid event id</p>
      </main>
    );
  }

  const e = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      djName: true,
      djType: true,
      imageUrl: true,
      venue: true,
      price: true,
      currency: true,
      startsAt: true,
      endsAt: true,
      isPublished: true,
    },
  });

  if (!e || !e.isPublished) {
    return (
      <main className="pt-24 text-center">
        <p className="text-sm text-muted-foreground">Event not available</p>
      </main>
    );
  }

  const settings = await getReservationSettings();

  return (
    <ReservationClient
      eventId={e.id}
      eventTitle={e.title}
      eventPrice={e.price}
      eventCurrency={e.currency}
      djName={e.djName ?? null}
      djType={e.djType ?? null}
      startsAt={e.startsAt.toISOString()}
      endsAt={e.endsAt ? e.endsAt.toISOString() : null}
      eventDescription={e.description ?? null}
      eventImageUrl={e.imageUrl ?? null}
      venue={e.venue ?? null}
      paymentRequired={settings.paymentRequired}
    />
  );
}

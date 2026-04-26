import { prisma } from "@/lib/prisma";
import {
  buildDailyReservationTitle,
  DAILY_RESERVATION_END_HOUR,
  DAILY_RESERVATION_START_HOUR,
  getDailyReservationEventId,
} from "@/lib/daily-reservation";

export async function getOrCreateDailyReservationEvent(value: Date) {
  const id = getDailyReservationEventId(value);
  const existing = await prisma.event.findUnique({ where: { id } });
  if (existing) return existing;

  const startsAt = new Date(value);
  startsAt.setHours(DAILY_RESERVATION_START_HOUR, 0, 0, 0);
  const endsAt = new Date(value);
  endsAt.setHours(DAILY_RESERVATION_END_HOUR, 0, 0, 0);

  return prisma.event.create({
    data: {
      id,
      title: buildDailyReservationTitle(value),
      description: "Internal daily reservation record",
      imageUrl: null,
      price: 0,
      currency: "MNT",
      venue: "78MusicBar",
      startsAt,
      endsAt,
      isPublished: false,
      isFeatured: false,
    },
  });
}

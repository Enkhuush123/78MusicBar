import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { isDailyReservationEventId } from "@/lib/daily-reservation";

export async function GET() {
  await requireAdmin();

  const [pendingCount, latest] = await Promise.all([
    prisma.reservation.count({
      where: { status: "pending_payment" },
    }),
    prisma.reservation.findFirst({
      where: { status: { notIn: ["cancelled", "rejected"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tableNo: true,
        guests: true,
        reservedFor: true,
        status: true,
        createdAt: true,
        event: { select: { id: true, title: true } },
      },
    }),
  ]);

  return Response.json({
    pendingCount,
    latest: latest
      ? {
          id: latest.id,
          tableNo: latest.tableNo,
          guests: latest.guests,
          reservedFor: latest.reservedFor.toISOString(),
          status: latest.status,
          createdAt: latest.createdAt.toISOString(),
          eventTitle:
            latest.event && !isDailyReservationEventId(latest.event.id)
              ? latest.event.title
              : null,
        }
      : null,
  });
}

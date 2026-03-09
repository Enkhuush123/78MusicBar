import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function GET() {
  await requireAdmin();

  const days = await prisma.openDeckDay.findMany({
    orderBy: { eventDate: "asc" },
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
    take: 50,
  });

  return Response.json(days);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const dateInput = String(body?.eventDate ?? "").trim();
  const startHour = Number(body?.startHour ?? 20);
  const endHour = Number(body?.endHour ?? 2);
  const slotMinutes = Number(body?.slotMinutes ?? 90);

  const base = dateInput ? new Date(dateInput) : null;
  if (!base || Number.isNaN(base.getTime())) {
    return Response.json({ message: "eventDate required" }, { status: 400 });
  }

  if (!Number.isFinite(startHour) || startHour < 0 || startHour > 23) {
    return Response.json({ message: "invalid startHour" }, { status: 400 });
  }
  if (!Number.isFinite(slotMinutes) || slotMinutes < 30 || slotMinutes > 240) {
    return Response.json({ message: "invalid slotMinutes" }, { status: 400 });
  }
  if (!Number.isFinite(endHour) || endHour < 0 || endHour > 23) {
    return Response.json({ message: "invalid endHour" }, { status: 400 });
  }

  const eventDate = startOfDay(base);
  const startAt = new Date(eventDate);
  startAt.setHours(startHour, 0, 0, 0);

  const endAt = new Date(eventDate);
  endAt.setHours(endHour, 0, 0, 0);
  if (endHour <= startHour) endAt.setDate(endAt.getDate() + 1);

  const slots = [];
  let cursor = new Date(startAt);
  let sort = 0;
  while (true) {
    const slotEnd = new Date(cursor);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
    if (slotEnd > endAt) break;
    slots.push({
      sort,
      startsAt: new Date(cursor),
      endsAt: slotEnd,
      isOpen: true,
    });
    sort += 1;
    cursor = slotEnd;
    if (sort > 24) break;
  }

  if (slots.length === 0) {
    return Response.json({ message: "no slots generated" }, { status: 400 });
  }

  try {
    const created = await prisma.openDeckDay.create({
      data: {
        eventDate,
        isActive: true,
        slots: {
          create: slots,
        },
      },
      include: { slots: true },
    });

    return Response.json(created, { status: 201 });
  } catch {
    return Response.json({ message: "This date already exists" }, { status: 409 });
  }
}

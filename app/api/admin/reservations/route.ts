/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { getReservationSurcharge } from "@/lib/reservation-pricing";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);

  const eventId = searchParams.get("eventId") || undefined;
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "all";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (status !== "all") where.status = status;

  if (from || to) {
    where.reservedFor = {};
    if (from) where.reservedFor.gte = new Date(from);
    if (to) where.reservedFor.lte = new Date(to);
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { userEmail: { contains: q, mode: "insensitive" } },
      { userPhone: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.reservation.findMany({
    where,
    orderBy: { reservedFor: "desc" },
    take: 200,
    select: {
      id: true,
      eventId: true,
      tableNo: true,
      guests: true,
      reservedFor: true,
      surchargeAmount: true,
      note: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,

      name: true,
      phone: true,
      userEmail: true,
      userPhone: true,

      event: {
        select: {
          title: true,
          startsAt: true,
          venue: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  return Response.json(rows);
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = await req.json().catch(() => null);

  const eventId = String(body?.eventId ?? "");
  const guests = Number(body?.guests ?? 2);
  const tableNo = Number(body?.tableNo);
  const note = body?.note ? String(body.note).trim() : null;

  if (!eventId)
    return Response.json({ message: "eventId required" }, { status: 400 });
  if (Number.isNaN(tableNo) || tableNo < 1 || tableNo > 22)
    return Response.json({ message: "invalid tableNo" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, isPublished: true, startsAt: true, endsAt: true },
  });

  if (!event || !event.isPublished) {
    return Response.json({ message: "Event not available" }, { status: 404 });
  }

  const reservedFor = body?.reservedFor
    ? new Date(body.reservedFor)
    : event.startsAt;

  if (Number.isNaN(reservedFor.getTime())) {
    return Response.json({ message: "invalid reservedFor" }, { status: 400 });
  }

  if (!isSameLocalDay(reservedFor, event.startsAt)) {
    return Response.json(
      { message: "Reservation must be on the same event day" },
      { status: 400 },
    );
  }

  const user = getSupabaseUserFromRequest(req);

  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();

  if (!user && (!name || !phone)) {
    return Response.json(
      { message: "name/phone required for guests" },
      { status: 400 },
    );
  }

  try {
    const activeReservations = await prisma.reservation.count({
      where: {
        eventId,
        reservedFor,
        status: { notIn: ["cancelled", "rejected"] },
      },
    });
    const surchargeAmount = getReservationSurcharge(
      reservedFor,
      activeReservations,
    );

    const reservation = await prisma.reservation.create({
      data: {
        eventId,
        guests,
        tableNo,
        reservedFor,
        surchargeAmount,
        note: note || null,
        status: "confirmed",

        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        userPhone: (user as any)?.phone ?? null,

        name: user ? null : name,
        phone: user ? null : phone,
      },
    });

    return Response.json(reservation, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return Response.json({ message: "Already reserved" }, { status: 409 });
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getReservationSurcharge } from "@/lib/reservation-pricing";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const reservedForParam = searchParams.get("reservedFor");

  if (!eventId) {
    return Response.json({ message: "eventId required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, isPublished: true, startsAt: true },
  });

  if (!event || !event.isPublished) {
    return Response.json({ message: "Event not available" }, { status: 404 });
  }

  const reservedFor = reservedForParam
    ? new Date(reservedForParam)
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

  const rows = await prisma.reservation.findMany({
    where: {
      eventId,
      reservedFor,
      status: { notIn: ["cancelled", "rejected"] },
    },
    select: { tableNo: true },
  });

  return Response.json({ reserved: rows.map((r) => r.tableNo) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const eventId = String(body?.eventId ?? "");
  const guests = Number(body?.guests ?? 2);
  const tableNo = Number(body?.tableNo);
  const note = body?.note ? String(body.note).trim() : null;
  const acceptedPolicy = Boolean(body?.acceptedPolicy);

  if (!eventId)
    return Response.json({ message: "eventId required" }, { status: 400 });
  if (Number.isNaN(tableNo) || tableNo < 1 || tableNo > 22)
    return Response.json({ message: "invalid tableNo" }, { status: 400 });
  if (!acceptedPolicy) {
    return Response.json(
      {
        message:
          "Please accept reservation policy (30-minute late arrival = cancelled, non-refundable).",
      },
      { status: 400 },
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      isPublished: true,
      startsAt: true,
      endsAt: true,
      price: true,
      currency: true,
    },
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

  let user = getSupabaseUserFromRequest(req);

  if (!user?.id || !user?.email) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );
    const { data } = await supabase.auth.getUser();
    if (data.user?.id && data.user?.email) {
      user = {
        id: data.user.id,
        email: data.user.email,
        phone:
          (data.user.user_metadata?.phone as string | undefined) ||
          (data.user.phone as string | undefined),
      };
    }
  }

  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();

  if (!user?.id && (!name || !phone)) {
    return Response.json(
      { message: "name/phone required for guests" },
      { status: 400 },
    );
  }

  if (user?.id || user?.email) {
    const existing = await prisma.reservation.findFirst({
      where: {
        eventId,
        status: { notIn: ["cancelled", "rejected"] },
        OR: [
          ...(user?.id ? [{ userId: user.id }] : []),
          ...(user?.email ? [{ userEmail: user.email }] : []),
        ],
      },
      select: { id: true, tableNo: true, status: true },
    });

    if (existing) {
      return Response.json(
        {
          message:
            "This account already has a reservation for this event. One account can reserve only one table per event.",
        },
        { status: 409 },
      );
    }
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
        status: "pending_payment",

        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        userPhone: (user as any)?.phone ?? null,

        name: user ? null : name,
        phone: user ? null : phone,
      },
    });

    const paymentRef = `RSV-T${reservation.tableNo}-${reservation.id.slice(0, 8).toUpperCase()}`;
    return Response.json(
      {
        reservation,
        payment: {
          status: "pending_payment",
          reference: paymentRef,
          surchargeAmount,
          totalAmount: event.price * guests + surchargeAmount,
        },
      },
      { status: 201 },
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return Response.json({ message: "Already reserved" }, { status: 409 });
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getReservationSurcharge } from "@/lib/reservation-pricing";
import { getReservationSettings } from "@/lib/reservation-settings";
import { getOrCreateDailyReservationEvent } from "@/lib/daily-reservation-server";
import {
  isTodayReservationDay,
  isWithinDailyReservationWindow,
  isSameLocalDay,
  parseDayInput,
} from "@/lib/daily-reservation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const reservationDate = searchParams.get("reservationDate");
  const reservedForParam = searchParams.get("reservedFor");

  let event:
    | { id: string; isPublished: boolean; startsAt: Date }
    | null = null;

  if (eventId) {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isPublished: true, startsAt: true },
    });

    if (!event || !event.isPublished) {
      return Response.json({ message: "Event not available" }, { status: 404 });
    }
  } else {
    const day = parseDayInput(
      reservationDate || String(reservedForParam || "").slice(0, 10),
    );
    if (!day) {
      return Response.json(
        { message: "eventId or reservationDate required" },
        { status: 400 },
      );
    }
    const dailyEvent = await getOrCreateDailyReservationEvent(day);
    event = {
      id: dailyEvent.id,
      isPublished: true,
      startsAt: day,
    };
  }

  const reservedFor = reservedForParam
    ? new Date(reservedForParam)
    : event.startsAt;
  if (Number.isNaN(reservedFor.getTime())) {
    return Response.json({ message: "invalid reservedFor" }, { status: 400 });
  }

  if (eventId) {
    if (!isSameLocalDay(reservedFor, event.startsAt)) {
      return Response.json(
        { message: "Reservation must be on the same event day" },
        { status: 400 },
      );
    }
  } else {
    if (!isTodayReservationDay(event.startsAt)) {
      return Response.json(
        { message: "Today reservations are available only for today." },
        { status: 400 },
      );
    }
    if (!isSameLocalDay(reservedFor, event.startsAt)) {
      return Response.json(
        { message: "Reservation time must be on today's date." },
        { status: 400 },
      );
    }
    if (!isWithinDailyReservationWindow(reservedFor)) {
      return Response.json(
        { message: "Today reservations are available from 18:00 to 22:00." },
        { status: 400 },
      );
    }
  }

  const rows = await prisma.reservation.findMany({
    where: {
      eventId: event.id,
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
  const reservationDate = String(body?.reservationDate ?? "").trim();
  const guests = Number(body?.guests ?? 2);
  const tableNo = Number(body?.tableNo);
  const note = body?.note ? String(body.note).trim() : null;
  const acceptedPolicy = Boolean(body?.acceptedPolicy);

  if (Number.isNaN(tableNo) || tableNo < 1 || tableNo > 22)
    return Response.json({ message: "invalid tableNo" }, { status: 400 });
  if (!acceptedPolicy) {
    return Response.json(
      {
        message: "Please accept the reservation policy.",
      },
      { status: 400 },
    );
  }

  let event:
    | {
        id: string;
        isPublished: boolean;
        startsAt: Date;
        endsAt: Date | null;
        price: number;
        currency: string;
      }
    | null = null;

  if (eventId) {
    event = await prisma.event.findUnique({
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
  } else {
    const day = parseDayInput(
      reservationDate || String(body?.reservedFor || "").slice(0, 10),
    );
    if (!day) {
      return Response.json(
        { message: "eventId or reservationDate required" },
        { status: 400 },
      );
    }
    const dailyEvent = await getOrCreateDailyReservationEvent(day);
    event = {
      id: dailyEvent.id,
      isPublished: true,
      startsAt: day,
      endsAt: dailyEvent.endsAt,
      price: dailyEvent.price,
      currency: dailyEvent.currency,
    };
  }

  const reservedFor = body?.reservedFor
    ? new Date(body.reservedFor)
    : event.startsAt;
  const settings = await getReservationSettings();

  if (Number.isNaN(reservedFor.getTime())) {
    return Response.json({ message: "invalid reservedFor" }, { status: 400 });
  }

  if (eventId) {
    if (!isSameLocalDay(reservedFor, event.startsAt)) {
      return Response.json(
        { message: "Reservation must be on the same event day" },
        { status: 400 },
      );
    }
  } else {
    if (!isTodayReservationDay(event.startsAt)) {
      return Response.json(
        { message: "Today reservations are available only for today." },
        { status: 400 },
      );
    }
    if (!isSameLocalDay(reservedFor, event.startsAt)) {
      return Response.json(
        { message: "Reservation time must be on today's date." },
        { status: 400 },
      );
    }
    if (!isWithinDailyReservationWindow(reservedFor)) {
      return Response.json(
        { message: "Today reservations are available from 18:00 to 22:00." },
        { status: 400 },
      );
    }
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
        eventId: event.id,
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
            eventId
              ? "This account already has a reservation for this event. One account can reserve only one table per event."
              : "This account already has a reservation for this day. One account can reserve only one table per day.",
        },
        { status: 409 },
      );
    }
  }

  try {
    const activeReservations = await prisma.reservation.count({
      where: {
        eventId: event.id,
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
        eventId: event.id,
        guests,
        tableNo,
        reservedFor,
        surchargeAmount,
        note: note || null,
        status: settings.paymentRequired ? "pending_payment" : "confirmed",

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
          required: settings.paymentRequired,
          status: reservation.status,
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

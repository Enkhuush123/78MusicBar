import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function GET() {
  const today = startOfDay(new Date());

  const days = await prisma.openDeckDay.findMany({
    where: { isActive: true, eventDate: { gte: today } },
    orderBy: { eventDate: "asc" },
    take: 12,
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
  });

  const approved = await prisma.openDeckReservation.findMany({
    where: {
      status: "approved",
      slot: {
        startsAt: { gte: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3) },
      },
    },
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
  });

  return Response.json({ days, approved });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const slotId = String(body?.slotId ?? "").trim();
  const requesterName = String(body?.requesterName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const djName = String(body?.djName ?? "").trim();
  const performerType = String(body?.type ?? body?.genre ?? "").trim();
  const socialUrl = String(body?.socialUrl ?? "").trim() || null;

  if (!slotId || !requesterName || !phone || !djName || !performerType) {
    return Response.json({ message: "required fields missing" }, { status: 400 });
  }

  const slot = await prisma.openDeckSlot.findUnique({
    where: { id: slotId },
    include: { reservation: true, day: true },
  });

  if (!slot || !slot.day.isActive || !slot.isOpen) {
    return Response.json({ message: "Slot unavailable" }, { status: 404 });
  }

  if (slot.startsAt < new Date()) {
    return Response.json({ message: "Slot is in the past" }, { status: 400 });
  }

  if (slot.reservation && ["pending", "approved"].includes(slot.reservation.status)) {
    return Response.json({ message: "This slot is already booked" }, { status: 409 });
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

  const duration = Math.max(30, Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / (1000 * 60)));
  const hh = String(slot.startsAt.getHours()).padStart(2, "0");
  const mm = String(slot.startsAt.getMinutes()).padStart(2, "0");

  const payload = {
    slotId,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    requesterName,
    phone,
    djName,
    genre: performerType,
    setDuration: duration,
    preferredDate: slot.startsAt,
    preferredTime: `${hh}:${mm}`,
    socialUrl,
    note: null,
    status: "pending" as const,
    approvedAt: null,
    adminNote: null,
  };

  let created;
  if (slot.reservation) {
    created = await prisma.openDeckReservation.update({
      where: { id: slot.reservation.id },
      data: payload,
    });
  } else {
    try {
      created = await prisma.openDeckReservation.create({ data: payload });
    } catch (e) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "P2002"
      ) {
        const existing = await prisma.openDeckReservation.findFirst({
          where: { slotId },
          select: { id: true },
        });
        if (!existing?.id) throw e;
        created = await prisma.openDeckReservation.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        throw e;
      }
    }
  }

  return Response.json({ id: created.id, message: "Submitted" }, { status: 201 });
}

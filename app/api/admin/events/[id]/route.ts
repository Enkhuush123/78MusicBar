/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { isDailyReservationEventId } from "@/lib/daily-reservation";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;

  if (!id) {
    return Response.json({ message: "id required" }, { status: 400 });
  }
  if (isDailyReservationEventId(id)) {
    return Response.json({ message: "not found" }, { status: 404 });
  }

  const e = await prisma.event.findUnique({ where: { id } });
  if (!e) return Response.json({ message: "not found" }, { status: 404 });

  return Response.json(e);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!id) return Response.json({ message: "id required" }, { status: 400 });
  if (isDailyReservationEventId(id)) {
    return Response.json({ message: "not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);

  try {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: body?.title?.trim(),
        description: body?.description ?? null,
        imageUrl: body?.imageUrl ?? null,
        price: Number(body?.price ?? 0),
        currency: body?.currency ?? "MNT",
        venue: typeof body?.venue === "string" ? body.venue : undefined,
        startsAt: body?.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body?.endsAt ? new Date(body.endsAt) : null,
        isPublished: !!body?.isPublished,
      },
    });

    return Response.json(updated);
  } catch (e: any) {
    return Response.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!id) return Response.json({ message: "id required" }, { status: 400 });
  if (isDailyReservationEventId(id)) {
    return Response.json({ message: "not found" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });
  return Response.json({ ok: true });
}

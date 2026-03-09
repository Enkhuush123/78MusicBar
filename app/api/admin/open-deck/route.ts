/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "all").trim();
  const q = (searchParams.get("q") || "").trim();

  const where: any = {};
  if (status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { requesterName: { contains: q, mode: "insensitive" } },
      { djName: { contains: q, mode: "insensitive" } },
      { genre: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { userEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.openDeckReservation.findMany({
    where,
    orderBy: [{ preferredDate: "asc" }, { createdAt: "desc" }],
    include: {
      slot: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          isOpen: true,
          day: { select: { id: true, eventDate: true } },
        },
      },
    },
    take: 300,
  });

  return Response.json(rows);
}

export async function DELETE(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.map((x: unknown) => String(x || "").trim()).filter(Boolean)
    : [];

  if (!ids.length) {
    return Response.json({ message: "ids required" }, { status: 400 });
  }

  const result = await prisma.openDeckReservation.deleteMany({
    where: { id: { in: ids } },
  });

  return Response.json({ ok: true, count: result.count });
}

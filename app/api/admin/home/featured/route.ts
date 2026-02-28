/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  const rows = await prisma.homeFeaturedEvent.findMany({
    where: { isActive: true },
    orderBy: [{ sort: "asc" }, { updatedAt: "desc" }],
    include: {
      event: true,
    },
  });

  return Response.json(rows);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const eventId = String(body?.eventId ?? "");
  const sort = Number(body?.sort ?? 0);

  if (!eventId) {
    return Response.json({ message: "eventId required" }, { status: 400 });
  }

  const row = await prisma.homeFeaturedEvent.upsert({
    where: { eventId },
    update: { isActive: true, sort },
    create: { eventId, sort },
  });

  return Response.json(row);
}

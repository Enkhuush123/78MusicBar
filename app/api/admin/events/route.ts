import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
  });
  return Response.json({ events });
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const description = body?.description ? String(body.description) : null;
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;

  const price = Number(body?.price ?? 0);
  const currency = String(body?.currency ?? "MNT");

  const startsAt = body?.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body?.endsAt ? new Date(body.endsAt) : null;

  const isPublished = Boolean(body?.isPublished ?? true);

  if (!title)
    return Response.json({ message: "title required" }, { status: 400 });
  if (!startsAt || Number.isNaN(startsAt.getTime()))
    return Response.json({ message: "startsAt required" }, { status: 400 });

  if (endsAt && Number.isNaN(endsAt.getTime()))
    return Response.json({ message: "invalid endsAt" }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      title,
      description,
      imageUrl,
      price: Number.isNaN(price) ? 0 : price,
      currency,
      startsAt,
      endsAt,
      isPublished,
    },
  });

  return Response.json(event, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  const rows = await prisma.homeImage.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return Response.json(rows);
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = await req.json().catch(() => null);
  const imageUrl = String(body?.imageUrl ?? "").trim();
  const sort = Number(body?.sort ?? 0);

  if (!imageUrl)
    return Response.json({ message: "imageUrl required" }, { status: 400 });

  const created = await prisma.homeImage.create({
    data: { imageUrl, sort: Number.isFinite(sort) ? sort : 0, isActive: true },
  });

  return Response.json(created, { status: 201 });
}

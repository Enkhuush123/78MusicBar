import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();
  const rows = await prisma.collectionCategory.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(rows);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const nameEn = String(body?.nameEn ?? "").trim();
  const nameMn = String(body?.nameMn ?? "").trim();

  if (!nameEn || !nameMn) {
    return Response.json({ message: "name required" }, { status: 400 });
  }

  const last = await prisma.collectionCategory.findFirst({
    orderBy: { sort: "desc" },
    select: { sort: true },
  });

  const created = await prisma.collectionCategory.create({
    data: {
      nameEn,
      nameMn,
      sort: (last?.sort ?? -1) + 1,
      isActive: true,
    },
  });

  return Response.json(created, { status: 201 });
}

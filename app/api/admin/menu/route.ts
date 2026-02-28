import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "drinks") as
    | "drinks"
    | "food";

  const items = await prisma.menuImage.findMany({
    where: { category, isActive: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(items);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const category = String(body?.category || "") as "drinks" | "food";
  const imageUrl = String(body?.imageUrl || "").trim();
  const sort = Number(body?.sort ?? 0);

  if (!["drinks", "food"].includes(category)) {
    return Response.json({ message: "invalid category" }, { status: 400 });
  }
  if (!imageUrl)
    return Response.json({ message: "imageUrl required" }, { status: 400 });

  const created = await prisma.menuImage.create({
    data: { category, imageUrl, sort },
  });
  return Response.json(created, { status: 201 });
}

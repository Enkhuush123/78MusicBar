import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  try {
    const categoriesWithItems = await prisma.collectionCategory.findMany({
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    const categories = categoriesWithItems.map(({ items: _items, ...cat }) => cat);
    const items = categoriesWithItems.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: {
          id: cat.id,
          nameEn: cat.nameEn,
          nameMn: cat.nameMn,
          isActive: cat.isActive,
          sort: cat.sort,
        },
      })),
    );

    return Response.json({ categories, items });
  } catch {
    return Response.json(
      { message: "Database timeout. Please try again." },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  // Create category
  if (body?.kind === "category") {
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
        isActive: true,
        sort: (last?.sort ?? -1) + 1,
      },
    });

    return Response.json(created, { status: 201 });
  }

  // Create item
  const categoryId = String(body?.categoryId ?? "").trim();
  const nameEn = String(body?.nameEn ?? "").trim();
  const nameMn = String(body?.nameMn ?? "").trim();
  const infoEn = String(body?.infoEn ?? "").trim();
  const infoMn = String(body?.infoMn ?? "").trim();
  const imageUrl = String(body?.imageUrl ?? "").trim() || null;
  const isActive = Boolean(body?.isActive ?? true);

  if (!categoryId) {
    return Response.json({ message: "category required" }, { status: 400 });
  }
  if (!nameEn || !nameMn) {
    return Response.json({ message: "name required" }, { status: 400 });
  }
  if (!infoEn || !infoMn) {
    return Response.json({ message: "info required" }, { status: 400 });
  }

  const category = await prisma.collectionCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    return Response.json({ message: "invalid category" }, { status: 400 });
  }

  const last = await prisma.collectionItem.findFirst({
    where: { categoryId },
    orderBy: { sort: "desc" },
    select: { sort: true },
  });

  const created = await prisma.collectionItem.create({
    data: {
      categoryId,
      nameEn,
      nameMn,
      infoEn,
      infoMn,
      imageUrl,
      isActive,
      sort: (last?.sort ?? -1) + 1,
    },
    include: {
      category: {
        select: {
          id: true,
          nameEn: true,
          nameMn: true,
          isActive: true,
          sort: true,
        },
      },
    },
  });

  return Response.json(created, { status: 201 });
}

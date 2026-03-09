/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!id) return Response.json({ message: "id required" }, { status: 400 });

  const body = await req.json().catch(() => null);

  const data: any = {};

  if (typeof body?.categoryId === "string") {
    const categoryId = body.categoryId.trim();
    if (!categoryId) {
      return Response.json({ message: "invalid category" }, { status: 400 });
    }
    const exists = await prisma.collectionCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!exists) {
      return Response.json({ message: "invalid category" }, { status: 400 });
    }
    data.categoryId = categoryId;
  }

  if (typeof body?.nameEn === "string") data.nameEn = body.nameEn.trim();
  if (typeof body?.nameMn === "string") data.nameMn = body.nameMn.trim();
  if (typeof body?.infoEn === "string") data.infoEn = body.infoEn.trim();
  if (typeof body?.infoMn === "string") data.infoMn = body.infoMn.trim();
  if (typeof body?.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;
  if (typeof body?.sort === "number") data.sort = body.sort;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;

  try {
    const updated = await prisma.collectionItem.update({
      where: { id },
      data,
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
    return Response.json(updated);
  } catch {
    return Response.json({ message: "update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!id) return Response.json({ message: "id required" }, { status: 400 });

  await prisma.collectionItem.delete({ where: { id } });
  return Response.json({ ok: true });
}

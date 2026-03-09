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

  if (typeof body?.nameEn === "string") data.nameEn = body.nameEn.trim();
  if (typeof body?.nameMn === "string") data.nameMn = body.nameMn.trim();
  if (typeof body?.sort === "number") data.sort = body.sort;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.collectionCategory.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!id) return Response.json({ message: "id required" }, { status: 400 });

  await prisma.collectionCategory.delete({ where: { id } });
  return Response.json({ ok: true });
}

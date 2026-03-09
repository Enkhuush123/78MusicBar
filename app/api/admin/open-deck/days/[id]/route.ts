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
  const isActive = Boolean(body?.isActive ?? true);

  const updated = await prisma.openDeckDay.update({
    where: { id },
    data: { isActive },
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

  await prisma.openDeckDay.delete({ where: { id } });
  return Response.json({ ok: true });
}

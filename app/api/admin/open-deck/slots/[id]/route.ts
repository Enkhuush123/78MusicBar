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
  const isOpen = Boolean(body?.isOpen ?? true);

  const updated = await prisma.openDeckSlot.update({
    where: { id },
    data: { isOpen },
  });
  return Response.json(updated);
}

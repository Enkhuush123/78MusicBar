/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const body = await req.json().catch(() => null);

  const data: any = {};
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  if (body?.sort !== undefined) data.sort = Number(body.sort);

  const updated = await prisma.homeFeaturedEvent.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  await prisma.homeFeaturedEvent.delete({ where: { id } });
  return Response.json({ ok: true });
}

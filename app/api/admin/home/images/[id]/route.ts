import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const body = await req.json().catch(() => null);

  const updated = await prisma.homeImage.update({
    where: { id },
    data: {
      sort: body?.sort !== undefined ? Number(body.sort) : undefined,
      isActive:
        body?.isActive !== undefined ? Boolean(body.isActive) : undefined,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  await prisma.homeImage.delete({ where: { id } });
  return Response.json({ ok: true });
}

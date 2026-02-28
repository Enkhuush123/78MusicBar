import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const updated = await prisma.review.update({
    where: { id },
    data: {
      isApproved:
        body?.isApproved !== undefined ? Boolean(body.isApproved) : undefined,
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
  await prisma.review.delete({ where: { id } });
  return Response.json({ ok: true });
}

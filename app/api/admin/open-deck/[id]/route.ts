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

  if (typeof body?.status === "string") {
    data.status = body.status;
    if (body.status === "approved") {
      data.approvedAt = new Date();
    }
  }
  if (typeof body?.adminNote === "string") data.adminNote = body.adminNote;

  const updated = await prisma.openDeckReservation.update({
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

  await prisma.openDeckReservation.delete({ where: { id } });
  return Response.json({ ok: true });
}

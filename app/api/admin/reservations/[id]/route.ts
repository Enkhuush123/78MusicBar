/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();

  const { id } = await ctx.params; //
  if (!id) {
    return Response.json({ message: "id required" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  let status = String(body?.status ?? "").trim();

  if (!status) {
    return Response.json({ message: "status required" }, { status: 400 });
  }

  if (status === "new") status = "confirmed";

  const allowed = new Set([
    "pending_payment",
    "confirmed",
    "cancelled",
    "rejected",
  ]);
  if (!allowed.has(status)) {
    return Response.json({ message: "invalid status" }, { status: 400 });
  }

  try {
    const updated = await prisma.reservation.update({
      where: { id }, //
      data: { status },
    });

    return Response.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return Response.json(
        { message: "Reservation not found" },
        { status: 404 },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ message: "id required" }, { status: 400 });
  }

  try {
    const deleted = await prisma.reservation.delete({
      where: { id },
    });

    return Response.json(deleted);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return Response.json(
        { message: "Reservation not found" },
        { status: 404 },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

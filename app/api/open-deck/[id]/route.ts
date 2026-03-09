import { prisma } from "@/lib/prisma";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await prisma.openDeckReservation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      approvedAt: true,
      slot: {
        select: {
          startsAt: true,
          endsAt: true,
          day: { select: { eventDate: true } },
        },
      },
    },
  });

  if (!row) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  return Response.json(row);
}


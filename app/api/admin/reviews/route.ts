import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  const rows = await prisma.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  return Response.json(rows);
}

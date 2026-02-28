import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  const hero = await prisma.homeHero.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!hero) {
    const created = await prisma.homeHero.create({
      data: {
        imageUrl: "",
        headline: "Эвентүүд, тав тухтай орчин",
        subheadline: "Ширээгээ урьдчилж захиалаарай.",
        ctaText: "Эвентүүд үзэх",
        ctaHref: "/events",
        isActive: true,
      },
    });
    return Response.json(created);
  }

  return Response.json(hero);
}

export async function PATCH(req: Request) {
  await requireAdmin();

  const body = await req.json().catch(() => null);

  const id = String(body?.id ?? "");
  if (!id) return Response.json({ message: "id required" }, { status: 400 });

  const updated = await prisma.homeHero.update({
    where: { id },
    data: {
      imageUrl: String(body?.imageUrl ?? "").trim(),
      headline:
        String(body?.headline ?? "").trim() || "Эвентүүд, тав тухтай орчин",
      subheadline:
        String(body?.subheadline ?? "").trim() ||
        "Ширээгээ урьдчилж захиалаарай.",
      ctaText: String(body?.ctaText ?? "").trim() || "Эвентүүд үзэх",
      ctaHref: String(body?.ctaHref ?? "").trim() || "/events",
      isActive: Boolean(body?.isActive ?? true),
    },
  });

  return Response.json(updated);
}

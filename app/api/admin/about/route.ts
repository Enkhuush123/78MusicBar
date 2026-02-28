/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();

  const page =
    (await prisma.sitePage.findUnique({ where: { slug: "about" } })) ??
    (await prisma.sitePage.create({
      data: {
        slug: "about",
        title: "Бидний тухай",
        body: "",
        imageUrl: null,
      } as any,
    }));

  return Response.json(page);
}

export async function PATCH(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const updated = await prisma.sitePage.update({
    where: { slug: "about" },
    data: {
      title: String(body?.title ?? "Бидний тухай").trim(),
      body: body?.body !== undefined ? String(body.body ?? "") : undefined,
      imageUrl:
        body?.imageUrl !== undefined
          ? body.imageUrl
            ? String(body.imageUrl).trim()
            : null
          : undefined,
    } as any,
  });

  return Response.json(updated);
}

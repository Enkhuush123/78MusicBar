import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  DRINKS_SPECIALS_SLUG,
  parseDrinkSpecials,
  stringifyDrinkSpecials,
} from "@/lib/drink-specials";

async function loadSpecials() {
  const page = await prisma.sitePage.findUnique({
    where: { slug: DRINKS_SPECIALS_SLUG },
  });
  if (!page) return null;
  return { page, items: parseDrinkSpecials(page.body) };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const loaded = await loadSpecials();
  if (!loaded)
    return Response.json({ message: "special not found" }, { status: 404 });

  const idx = loaded.items.findIndex((item) => item.id === id);
  if (idx < 0) return Response.json({ message: "special not found" }, { status: 404 });

  const next = [...loaded.items];
  const row = next[idx];
  const imageUrl =
    body?.imageUrl !== undefined ? String(body.imageUrl ?? "").trim() : row.imageUrl;
  const name = body?.name !== undefined ? String(body.name ?? "").trim() : row.name;
  const ingredients =
    body?.ingredients !== undefined
      ? String(body.ingredients ?? "").trim()
      : row.ingredients;

  next[idx] = {
    ...row,
    imageUrl,
    name,
    ingredients,
    sort: body?.sort !== undefined ? Number(body.sort) : row.sort,
    isActive: body?.isActive !== undefined ? Boolean(body.isActive) : row.isActive,
  };

  await prisma.sitePage.update({
    where: { id: loaded.page.id },
    data: { body: stringifyDrinkSpecials(next) },
  });

  return Response.json(next[idx]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const loaded = await loadSpecials();
  if (!loaded) return Response.json({ ok: true });

  const next = loaded.items.filter((item) => item.id !== id);

  await prisma.sitePage.update({
    where: { id: loaded.page.id },
    data: { body: stringifyDrinkSpecials(next) },
  });

  return Response.json({ ok: true });
}

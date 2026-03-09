import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  DRINKS_SPECIALS_SLUG,
  parseDrinkSpecials,
  stringifyDrinkSpecials,
} from "@/lib/drink-specials";

async function getOrCreateSpecialsPage() {
  const existing = await prisma.sitePage.findUnique({
    where: { slug: DRINKS_SPECIALS_SLUG },
  });

  if (existing) return existing;

  return prisma.sitePage.create({
    data: {
      slug: DRINKS_SPECIALS_SLUG,
      title: "Drinks Specials",
      body: "",
      imageUrl: null,
    },
  });
}

export async function GET() {
  await requireAdmin();
  const page = await getOrCreateSpecialsPage();
  const items = parseDrinkSpecials(page.body).sort((a, b) => a.sort - b.sort);
  return Response.json(items);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const ingredients = String(body?.ingredients ?? "").trim();
  const imageUrl = String(body?.imageUrl ?? "").trim();
  const sortNum = Number(body?.sort ?? 0);

  if (!name) return Response.json({ message: "name required" }, { status: 400 });
  if (!ingredients)
    return Response.json({ message: "ingredients required" }, { status: 400 });
  if (!imageUrl)
    return Response.json({ message: "imageUrl required" }, { status: 400 });

  const page = await getOrCreateSpecialsPage();
  const current = parseDrinkSpecials(page.body);
  const nextSort = Number.isFinite(sortNum) ? sortNum : current.length;

  const created = {
    id: crypto.randomUUID(),
    name,
    ingredients,
    imageUrl,
    sort: nextSort,
    isActive: true,
  };

  const updated = [...current, created];

  await prisma.sitePage.update({
    where: { id: page.id },
    data: {
      body: stringifyDrinkSpecials(updated),
    },
  });

  return Response.json(created, { status: 201 });
}

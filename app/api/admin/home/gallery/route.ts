import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  HOME_GALLERY_SLUG,
  parseHomeGallery,
  stringifyHomeGallery,
} from "@/lib/home-gallery";

async function getOrCreatePage() {
  return prisma.sitePage.upsert({
    where: { slug: HOME_GALLERY_SLUG },
    update: {},
    create: {
      slug: HOME_GALLERY_SLUG,
      title: "Homepage Gallery",
      body: "",
      imageUrl: null,
    },
  });
}

export async function GET() {
  await requireAdmin();
  const page = await getOrCreatePage();
  return Response.json(parseHomeGallery(page.body));
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const imageUrl = String(body?.imageUrl ?? "").trim();
  const sortNum = Number(body?.sort ?? 0);
  if (!imageUrl) {
    return Response.json({ message: "imageUrl required" }, { status: 400 });
  }

  const page = await getOrCreatePage();
  const current = parseHomeGallery(page.body);
  const created = {
    id: crypto.randomUUID(),
    imageUrl,
    sort: Number.isFinite(sortNum) ? sortNum : current.length,
    isActive: true,
  };
  const next = [...current, created];

  await prisma.sitePage.update({
    where: { id: page.id },
    data: { body: stringifyHomeGallery(next) },
  });

  return Response.json(created, { status: 201 });
}

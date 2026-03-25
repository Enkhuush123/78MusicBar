import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  HOME_INSTAGRAM_POSTS_SLUG,
  parseHomeInstagramPosts,
  stringifyHomeInstagramPosts,
} from "@/lib/home-instagram-posts";

async function getOrCreatePage() {
  return prisma.sitePage.upsert({
    where: { slug: HOME_INSTAGRAM_POSTS_SLUG },
    update: {},
    create: {
      slug: HOME_INSTAGRAM_POSTS_SLUG,
      title: "Homepage Instagram Posts",
      body: "",
      imageUrl: null,
    },
  });
}

export async function GET() {
  await requireAdmin();
  const page = await getOrCreatePage();
  return Response.json(parseHomeInstagramPosts(page.body));
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  const imageUrl = String(body?.imageUrl ?? "").trim();
  const caption = String(body?.caption ?? "").trim();
  const postUrl = String(body?.postUrl ?? "").trim();
  const sortNum = Number(body?.sort ?? 0);

  if (!imageUrl) {
    return Response.json({ message: "imageUrl required" }, { status: 400 });
  }

  const page = await getOrCreatePage();
  const current = parseHomeInstagramPosts(page.body);
  const created = {
    id: crypto.randomUUID(),
    imageUrl,
    caption,
    postUrl,
    sort: Number.isFinite(sortNum) ? sortNum : current.length,
    isActive: true,
  };

  await prisma.sitePage.update({
    where: { id: page.id },
    data: { body: stringifyHomeInstagramPosts([...current, created]) },
  });

  return Response.json(created, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  HOME_GALLERY_SLUG,
  parseHomeGallery,
  stringifyHomeGallery,
} from "@/lib/home-gallery";

async function loadGallery() {
  const page = await prisma.sitePage.findUnique({
    where: { slug: HOME_GALLERY_SLUG },
  });
  if (!page) return null;
  return { page, rows: parseHomeGallery(page.body) };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const loaded = await loadGallery();
  if (!loaded) return Response.json({ message: "row not found" }, { status: 404 });
  const idx = loaded.rows.findIndex((row) => row.id === id);
  if (idx < 0) return Response.json({ message: "row not found" }, { status: 404 });

  const next = [...loaded.rows];
  const row = next[idx];
  const nextImageUrl =
    body?.imageUrl !== undefined ? String(body.imageUrl ?? "").trim() : row.imageUrl;
  const nextSortRaw = body?.sort !== undefined ? Number(body.sort) : row.sort;
  next[idx] = {
    ...row,
    imageUrl: nextImageUrl || row.imageUrl,
    sort: Number.isFinite(nextSortRaw) ? nextSortRaw : row.sort,
    isActive: body?.isActive !== undefined ? Boolean(body.isActive) : row.isActive,
  };

  await prisma.sitePage.update({
    where: { id: loaded.page.id },
    data: { body: stringifyHomeGallery(next) },
  });

  return Response.json(next[idx]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const loaded = await loadGallery();
  if (!loaded) return Response.json({ ok: true });
  const next = loaded.rows.filter((row) => row.id !== id);

  await prisma.sitePage.update({
    where: { id: loaded.page.id },
    data: { body: stringifyHomeGallery(next) },
  });

  return Response.json({ ok: true });
}

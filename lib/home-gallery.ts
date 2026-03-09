export const HOME_GALLERY_SLUG = "home-gallery";

export type HomeGalleryImage = {
  id: string;
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

function toItem(raw: unknown, index: number): HomeGalleryImage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<HomeGalleryImage>;
  const imageUrl = String(r.imageUrl ?? "").trim();
  if (!imageUrl) return null;
  const sortNum = Number(r.sort ?? index);
  return {
    id: String(r.id ?? "").trim() || `home-gallery-${index}`,
    imageUrl,
    sort: Number.isFinite(sortNum) ? sortNum : index,
    isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
  };
}

export function parseHomeGallery(raw?: string | null): HomeGalleryImage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { items?: unknown[] } | unknown[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];
    return list
      .map((row, index) => toItem(row, index))
      .filter((row): row is HomeGalleryImage => !!row)
      .sort((a, b) => a.sort - b.sort);
  } catch {
    return [];
  }
}

export function stringifyHomeGallery(items: HomeGalleryImage[]) {
  return JSON.stringify({
    items: items.map((item, index) => ({
      id: item.id,
      imageUrl: String(item.imageUrl).trim(),
      sort: Number.isFinite(item.sort) ? item.sort : index,
      isActive: Boolean(item.isActive),
    })),
  });
}

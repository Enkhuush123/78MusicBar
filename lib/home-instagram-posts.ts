export const HOME_INSTAGRAM_POSTS_SLUG = "home-instagram-posts";

export type HomeInstagramPost = {
  id: string;
  imageUrl: string;
  caption: string;
  postUrl: string;
  sort: number;
  isActive: boolean;
};

function toItem(raw: unknown, index: number): HomeInstagramPost | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<HomeInstagramPost>;
  const imageUrl = String(row.imageUrl ?? "").trim();
  if (!imageUrl) return null;
  const sortNum = Number(row.sort ?? index);
  return {
    id: String(row.id ?? "").trim() || `home-instagram-post-${index}`,
    imageUrl,
    caption: String(row.caption ?? "").trim(),
    postUrl: String(row.postUrl ?? "").trim(),
    sort: Number.isFinite(sortNum) ? sortNum : index,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
  };
}

export function parseHomeInstagramPosts(raw?: string | null) {
  if (!raw) return [] as HomeInstagramPost[];
  try {
    const parsed = JSON.parse(raw) as { items?: unknown[] } | unknown[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

    return list
      .map((item, index) => toItem(item, index))
      .filter((item): item is HomeInstagramPost => !!item)
      .sort((a, b) => a.sort - b.sort);
  } catch {
    return [];
  }
}

export function stringifyHomeInstagramPosts(items: HomeInstagramPost[]) {
  return JSON.stringify({
    items: items.map((item, index) => ({
      id: item.id,
      imageUrl: String(item.imageUrl).trim(),
      caption: String(item.caption ?? "").trim(),
      postUrl: String(item.postUrl ?? "").trim(),
      sort: Number.isFinite(item.sort) ? item.sort : index,
      isActive: Boolean(item.isActive),
    })),
  });
}

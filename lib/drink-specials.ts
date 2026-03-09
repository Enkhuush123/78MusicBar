export const DRINKS_SPECIALS_SLUG = "menu-drinks-specials";

export type DrinkSpecial = {
  id: string;
  name: string;
  ingredients: string;
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

type RawSpecial = Partial<DrinkSpecial> & {
  title?: string;
  desc?: string;
};

function toSpecial(raw: unknown, index: number): DrinkSpecial | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as RawSpecial;

  const id = String(v.id ?? "").trim() || `legacy-${index}`;
  const name = String(v.name ?? v.title ?? "").trim();
  const ingredients = String(v.ingredients ?? v.desc ?? "").trim();
  const imageUrl = String(v.imageUrl ?? "").trim();
  const sortNum = Number(v.sort ?? index);
  const isActive = v.isActive !== undefined ? Boolean(v.isActive) : true;

  if (!name || !imageUrl) return null;

  return {
    id,
    name,
    ingredients,
    imageUrl,
    sort: Number.isFinite(sortNum) ? sortNum : index,
    isActive,
  };
}

export function parseDrinkSpecials(raw?: string | null): DrinkSpecial[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { items?: unknown } | unknown[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

    return list
      .map((item, index) => toSpecial(item, index))
      .filter((item): item is DrinkSpecial => !!item)
      .sort((a, b) => a.sort - b.sort);
  } catch {
    return [];
  }
}

export function stringifyDrinkSpecials(items: DrinkSpecial[]) {
  return JSON.stringify({
    items: items.map((item, index) => ({
      id: item.id,
      name: item.name.trim(),
      ingredients: item.ingredients.trim(),
      imageUrl: item.imageUrl.trim(),
      sort: Number.isFinite(item.sort) ? item.sort : index,
      isActive: item.isActive,
    })),
  });
}

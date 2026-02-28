import { cookies } from "next/headers";
import { Locale, normalizeLocale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get("locale")?.value);
}

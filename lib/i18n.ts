export type Locale = "en" | "mn";

export function normalizeLocale(value?: string | null): Locale {
  return value === "mn" ? "mn" : "en";
}

export function tr(locale: Locale, en: string, mn: string) {
  return locale === "mn" ? mn : en;
}

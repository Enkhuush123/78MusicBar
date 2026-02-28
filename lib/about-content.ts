import { Locale } from "@/lib/i18n";

export type Bilingual = {
  en: string;
  mn: string;
};

export type AboutContent = {
  intro: Bilingual;
  storyHeading: Bilingual;
  storyBody: Bilingual;
  vibeHeading: Bilingual;
  vibeBody: Bilingual;
  quote: Bilingual;
  detailsHeading: Bilingual;
  detailsBody: Bilingual;
  address: Bilingual;
  hours: Bilingual;
  contact: Bilingual;
};

export const defaultAboutContent: AboutContent = {
  intro: {
    en: "Fat Cat Jazz Club is an intimate underground room in Ulaanbaatar for live jazz, craft cocktails, and late-night conversation.",
    mn: "Fat Cat Jazz Club бол Улаанбаатарын амьд жазз хөгжим, тусгай коктейль, оройн уур амьсгалтай дотно орон зай юм.",
  },
  storyHeading: { en: "Our Story", mn: "Бидний түүх" },
  storyBody: {
    en: "We started with a simple idea: build a room where musicians and listeners are close enough to share the same pulse.",
    mn: "Бид нэг энгийн санаагаар эхэлсэн: хөгжимчин, сонсогч хоёр нэг хэмнэлд ойр байх орон зай бий болгох.",
  },
  vibeHeading: { en: "The Vibe", mn: "Уур амьсгал" },
  vibeBody: {
    en: "Expect a dark, cozy room, vinyl-era atmosphere, and a cocktail list made for long sets.",
    mn: "Харанхуй дотно орчин, винил үеийн уур амьсгал, урт сетэнд тохирсон коктейлийн цэс таныг хүлээж байна.",
  },
  quote: {
    en: "Jazz builds community through freedom, listening, and joy.",
    mn: "Жазз бол эрх чөлөө, сонсгол, баяр баяслаар хамт олныг бүтээдэг.",
  },
  detailsHeading: { en: "Visit Us", mn: "Манайд ирэх" },
  detailsBody: {
    en: "Drop in for live performances, themed nights, and special collaborations.",
    mn: "Амьд тоглолт, сэдэвт үдэш, тусгай хөтөлбөрүүдэд манайхыг зориорой.",
  },
  address: { en: "Ulaanbaatar, Mongolia", mn: "Улаанбаатар, Монгол" },
  hours: { en: "Mon–Sun • 18:00 – Late", mn: "Даваа–Ням • 18:00 – Оройн цагаар" },
  contact: { en: "info@78musicbar.com", mn: "info@78musicbar.com" },
};

function toBilingual(
  value: unknown,
  fallback: Bilingual,
  legacyFallback?: string,
): Bilingual {
  if (value && typeof value === "object") {
    const raw = value as Partial<Bilingual>;
    return {
      en: String(raw.en ?? legacyFallback ?? fallback.en),
      mn: String(raw.mn ?? legacyFallback ?? fallback.mn),
    };
  }
  if (typeof value === "string") {
    return { en: value, mn: value };
  }
  return fallback;
}

export function parseAboutContent(raw?: string | null): AboutContent {
  if (!raw) return defaultAboutContent;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      intro: toBilingual(parsed.intro, defaultAboutContent.intro),
      storyHeading: toBilingual(parsed.storyHeading, defaultAboutContent.storyHeading),
      storyBody: toBilingual(parsed.storyBody, defaultAboutContent.storyBody, raw),
      vibeHeading: toBilingual(parsed.vibeHeading, defaultAboutContent.vibeHeading),
      vibeBody: toBilingual(parsed.vibeBody, defaultAboutContent.vibeBody),
      quote: toBilingual(parsed.quote, defaultAboutContent.quote),
      detailsHeading: toBilingual(parsed.detailsHeading, defaultAboutContent.detailsHeading),
      detailsBody: toBilingual(parsed.detailsBody, defaultAboutContent.detailsBody),
      address: toBilingual(parsed.address, defaultAboutContent.address),
      hours: toBilingual(parsed.hours, defaultAboutContent.hours),
      contact: toBilingual(parsed.contact, defaultAboutContent.contact),
    };
  } catch {
    return {
      ...defaultAboutContent,
      storyBody: { en: raw, mn: raw },
    };
  }
}

export function pickLocaleText(v: Bilingual, locale: Locale) {
  return locale === "mn" ? v.mn : v.en;
}

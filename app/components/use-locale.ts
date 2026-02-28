"use client";

import { useCallback, useEffect, useState } from "react";
import { Locale, normalizeLocale } from "@/lib/i18n";

function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return normalizeLocale(match?.[1]);
}

export function useLocale(initialLocale: Locale = "en") {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const cookieLocale = readLocaleFromCookie();
    if (cookieLocale !== locale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(cookieLocale);
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === "en" ? "mn" : "en";
    setLocale(next);
    window.location.reload();
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale };
}

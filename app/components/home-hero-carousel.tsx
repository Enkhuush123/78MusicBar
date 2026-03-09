/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

type Props = {
  locale: Locale;
  slides: string[];
  headline: string;
  subheadline: string;
  ctaHref: string;
  ctaText: string;
};

const AUTO_MS = 4200;

export default function HomeHeroCarousel({
  locale,
  slides,
  headline,
  subheadline,
  ctaHref,
  ctaText,
}: Props) {
  const [index, setIndex] = useState(0);
  const safeSlides = useMemo(
    () => (slides.length ? slides : ["/galaxy.jpg"]),
    [slides],
  );
  const activeIndex = safeSlides.length ? index % safeSlides.length : 0;

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  return (
    <div className="jazz-shell relative overflow-hidden rounded-3xl">
      <div className="h-[64vh] min-h-[520px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {safeSlides.map((src, i) => (
            <div key={`${src}-${i}`} className="h-full min-w-full">
              <img src={src} alt={`hero-${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/30" />

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-2xl p-8 md:p-12">
          <h1 className="jazz-heading mt-3 text-5xl text-amber-50 md:text-7xl">{headline}</h1>
          <p className="mt-4 text-xl text-amber-100/85">{subheadline}</p>
          <div className="mt-7 flex gap-3">
            <Link href={ctaHref} className="ger-btn-secondary rounded-xl px-6 py-3 text-sm font-semibold">
              {ctaText}
            </Link>
            <Link
              href="/menu/drinks"
              className="rounded-xl border border-amber-200/80 px-6 py-3 text-sm font-semibold text-amber-50 hover:bg-white/10"
            >
              {tr(locale, "Drinks Menu", "Уух зүйлсийн меню")}
            </Link>
          </div>
        </div>
      </div>

      {safeSlides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200/30 bg-black/35 px-3 py-2 backdrop-blur">
          {safeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                "h-2.5 rounded-full transition-all",
                i === activeIndex ? "w-6 bg-amber-200" : "w-2.5 bg-amber-200/55 hover:bg-amber-200/80",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

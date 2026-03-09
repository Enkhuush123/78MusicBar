/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

type Props = {
  locale: Locale;
  images: string[];
};

const AUTO_MS = 3600;

export default function HomeGalleryCarousel({ locale, images }: Props) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const active = safeImages.length ? index % safeImages.length : 0;

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeImages.length);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [safeImages.length]);

  useEffect(() => {
    if (!previewSrc) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewSrc(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [previewSrc]);

  if (!safeImages.length) return null;

  const prev = () =>
    setIndex((cur) => (cur - 1 + safeImages.length) % safeImages.length);
  const next = () => setIndex((cur) => (cur + 1) % safeImages.length);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.16fr_0.84fr]" data-no-lightbox="true">
      <div className="relative h-[46vh] min-h-[300px] overflow-hidden rounded-2xl border border-amber-300/28 bg-[linear-gradient(165deg,rgba(50,33,20,0.55)_0%,rgba(34,23,15,0.65)_100%)] sm:min-h-[360px] md:h-[50vh] md:min-h-[500px]">
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <img
            key={`gallery-active-${active}`}
            src={safeImages[active]}
            alt={`gallery-${active + 1}`}
            className="h-full w-full cursor-zoom-in object-cover object-center"
            onClick={() => setPreviewSrc(safeImages[active])}
            data-no-lightbox="true"
          />
        </div>

        {safeImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous gallery image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg border border-amber-200/45 bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-amber-50 hover:bg-black/65 md:left-3 md:rounded-xl md:px-3 md:py-2 md:text-xs"
            >
              {tr(locale, "Prev", "Өмнөх")}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next gallery image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-amber-200/45 bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-amber-50 hover:bg-black/65 md:right-3 md:rounded-xl md:px-3 md:py-2 md:text-xs"
            >
              {tr(locale, "Next", "Дараах")}
            </button>
          </>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 py-3">
          <div className="flex items-center justify-between text-xs text-amber-100/85">
            <p className="font-semibold uppercase tracking-[0.14em]">
              {tr(locale, "Live Gallery", "Gallery")}
            </p>
            <p>
              {active + 1} / {safeImages.length}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/85">
            {tr(locale, "All Photos", "Бүх зураг")}
          </p>
          <p className="text-[11px] text-amber-100/75">
            {safeImages.length} {tr(locale, "images", "зураг")}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 pr-1">
          {safeImages.map((src, i) => (
            <button
              key={`gallery-mobile-thumb-${src}-${i}`}
              type="button"
              onClick={() => {
                setIndex(i);
                setPreviewSrc(src);
              }}
              aria-label={`Gallery thumbnail ${i + 1}`}
              className={[
                "shrink-0 overflow-hidden rounded-xl border bg-black/35 transition",
                i === active
                  ? "border-amber-200/85 ring-1 ring-amber-200/65"
                  : "border-amber-300/25",
              ].join(" ")}
            >
              <img
                src={src}
                alt={`mobile-thumb-${i + 1}`}
                className="h-16 w-24 object-cover object-center"
                data-no-lightbox="true"
              />
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden rounded-2xl border border-amber-300/24 bg-[linear-gradient(165deg,rgba(25,18,12,0.78)_0%,rgba(14,10,7,0.88)_100%)] p-3 lg:block">
        <div className="mb-3 flex items-end justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/85">
            {tr(locale, "All Photos", "Бүх зураг")}
          </p>
          <p className="text-xs text-amber-100/75">
            {safeImages.length} {tr(locale, "images", "зураг")}
          </p>
        </div>

        <div className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:max-h-[500px] lg:grid-cols-2">
          {safeImages.map((src, i) => (
            <button
              key={`gallery-thumb-${src}-${i}`}
              type="button"
              onClick={() => {
                setIndex(i);
                setPreviewSrc(src);
              }}
              aria-label={`Gallery thumbnail ${i + 1}`}
              className={[
                "group overflow-hidden rounded-xl border bg-black/30 transition",
                i === active
                  ? "border-amber-200/85 ring-1 ring-amber-200/65"
                  : "border-amber-300/25 hover:border-amber-200/50",
              ].join(" ")}
            >
              <img
                src={src}
                alt={`thumb-${i + 1}`}
                className="h-20 w-full object-cover object-center transition duration-300 group-hover:scale-105 sm:h-24"
                data-no-lightbox="true"
              />
            </button>
          ))}
        </div>
      </aside>

      {previewSrc ? (
        <div
          className="fixed inset-0 z-[130] grid place-items-center bg-black/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setPreviewSrc(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-xl border border-amber-200/55 bg-black/45 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-amber-50 hover:bg-black/65"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewSrc(null);
            }}
          >
            CLOSE
          </button>
          <div
            className="h-[84vh] w-full max-w-[96vw] overflow-hidden rounded-2xl border border-amber-100/35 bg-[linear-gradient(170deg,#3d2a1b_0%,#2a1d13_100%)] shadow-[0_24px_56px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSrc}
              alt="gallery-preview"
              className="h-full w-full object-cover object-center"
              data-no-lightbox="true"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

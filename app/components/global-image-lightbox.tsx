"use client";

import { useEffect, useState } from "react";

type ActiveImage = {
  src: string;
  alt: string;
};

function readImageSource(img: HTMLImageElement) {
  return String(img.currentSrc || img.src || "").trim();
}

export default function GlobalImageLightbox() {
  const [active, setActive] = useState<ActiveImage | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const img = target.closest("img");
      if (!(img instanceof HTMLImageElement)) return;

      if (
        img.dataset.noLightbox === "true" ||
        img.closest('[data-no-lightbox="true"]')
      ) {
        return;
      }

      // Preserve default navigation for linked images unless explicitly enabled.
      if (img.closest("a[href]") && !img.closest('[data-lightbox="true"]')) {
        return;
      }

      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const maxEdge = Math.max(img.naturalWidth, img.naturalHeight);
        if (maxEdge < 80) return;
      }

      const src = readImageSource(img);
      if (!src) return;

      event.preventDefault();
      event.stopPropagation();
      setActive({
        src,
        alt: img.alt || "Image preview",
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/86 px-4 py-6 backdrop-blur-sm"
      onClick={() => setActive(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-xl border border-amber-200/55 bg-black/45 px-3 py-2 text-xs font-semibold tracking-[0.08em] text-amber-50 hover:bg-black/65"
        onClick={(e) => {
          e.stopPropagation();
          setActive(null);
        }}
      >
        CLOSE
      </button>

      <figure
        className="max-h-[92vh] max-w-[96vw] overflow-hidden rounded-2xl border border-amber-100/35 bg-black/40 p-2 shadow-[0_24px_56px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.src}
          alt={active.alt}
          className="max-h-[82vh] max-w-[94vw] rounded-xl object-cover"
          data-no-lightbox="true"
        />
        {active.alt && (
          <figcaption className="px-2 pb-1 pt-2 text-center text-xs text-amber-100/85">
            {active.alt}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

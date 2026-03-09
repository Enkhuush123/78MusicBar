"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  id: string;
  label: string;
};

export default function CollectionsSidebar({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!items.length) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const el = container.querySelector<HTMLElement>(
      `[data-nav-index=\"${active}\"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [active]);

  return (
    <aside className="rounded-2xl border border-[#decab3] bg-[#fffaf2] p-3 lg:sticky lg:top-24 lg:max-h-[70vh]">
      <div
        ref={containerRef}
        className="mt-2 grid max-h-[58vh] gap-2 overflow-y-auto pr-1"
      >
        {items.map((item, index) => (
          <a
            key={item.id}
            data-nav-index={index}
            href={`#${item.id}`}
            className={`block rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              active === index
                ? "border-[#bb9671] bg-[#f0ddc7] text-[#2f2116]"
                : "border-[#eadccd] bg-white text-[#2f2116] hover:bg-[#f7eee2]"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

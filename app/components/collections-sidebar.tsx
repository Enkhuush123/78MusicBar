"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  id: string;
  label: string;
  count: number;
  subtitle?: string;
};

export default function CollectionsSidebar({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  const goToItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    setActive(index);

    const section = document.getElementById(item.id);
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${item.id}`);
  };

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
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:max-h-[78vh] lg:overflow-hidden">
      <div className="rounded-[28px] border border-[#e5dff0] bg-white p-5 shadow-[0_10px_28px_rgba(92,104,141,0.08)]">
        <div className="mb-5">
          <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#171717]">
            Performer overview
          </h2>
          <p className="mt-1 text-base text-[#66738f]">
            Most active lineup groups
          </p>
        </div>

        <div className="rounded-[24px] border border-[#edf0f6] px-4 py-5">
          <div className="flex h-44 items-end gap-3 border-b border-[#edf0f6] pb-4">
            {items.map((item, index) => {
              const height = Math.max(28, Math.round((item.count / maxCount) * 112));
              return (
                <button
                  key={`bar-${item.id}`}
                  type="button"
                  onClick={() => goToItem(index)}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <span
                    className={[
                      "w-full max-w-[48px] rounded-t-md transition-all",
                      active === index ? "bg-[#eb7d7d]" : "bg-[#f3b0b0]",
                    ].join(" ")}
                    style={{ height }}
                  />
                  <span className="text-xs font-medium text-[#687894]">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {items.map((item, index) => (
              <button
                key={`axis-${item.id}`}
                type="button"
                onClick={() => goToItem(index)}
                className={[
                  "rounded-xl px-2 py-2 text-sm font-medium transition",
                  active === index
                    ? "bg-[#f9e3e3] text-[#c95f5f]"
                    : "text-[#687894] hover:bg-[#f6f8fb]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e5dff0] bg-white p-5 shadow-[0_10px_28px_rgba(92,104,141,0.08)]">
        <div
          ref={containerRef}
          className="grid max-h-[48vh] gap-3 overflow-y-auto pr-1"
        >
          {items.map((item, index) => (
            <a
              key={item.id}
              data-nav-index={index}
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                goToItem(index);
              }}
              onMouseEnter={() => setActive(index)}
              className={[
                "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[22px] border px-4 py-4 transition",
                active === index
                  ? "border-[#f0dada] bg-[#fdf1f1]"
                  : "border-[#ebe8f4] bg-white hover:bg-[#f8f9fc]",
              ].join(" ")}
            >
              <span
                className={[
                  "h-8 w-8 rounded-full border-2 transition",
                  active === index
                    ? "border-[#db5f5f] shadow-[inset_0_0_0_6px_#fff,inset_0_0_0_999px_#db5f5f]"
                    : "border-[#dbd6e7] bg-white",
                ].join(" ")}
              />
              <span className="min-w-0">
                <span className="block truncate text-lg font-medium text-[#171717]">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate text-sm text-[#66738f]">
                  {item.subtitle || "Lineup details"}
                </span>
              </span>
              <span className="text-base font-medium text-[#171717]">
                {item.count}
              </span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

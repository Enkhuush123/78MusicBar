/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  info: string;
  imageUrl: string | null;
};

type Group = {
  key: string;
  label: string;
  subtitle: string;
  items: Item[];
};

export default function CollectionsShowcase({
  groups,
  compact = false,
  stacked = false,
}: {
  groups: Group[];
  compact?: boolean;
  stacked?: boolean;
}) {
  const [activeKey, setActiveKey] = useState(groups[0]?.key ?? "");
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [stackedIndexMap, setStackedIndexMap] = useState<
    Record<string, number>
  >({});

  const active = useMemo(
    () => groups.find((g) => g.key === activeKey) ?? groups[0],
    [activeKey, groups],
  );

  const selectGroup = (key: string) => {
    setActiveKey(key);
    setActiveItemIndex(0);
  };

  useEffect(() => {
    if (!stacked) return;
    const timer = setInterval(() => {
      setStackedIndexMap((prev) => {
        const next = { ...prev };
        for (const group of groups) {
          if (group.items.length <= 1) continue;
          const current = next[group.key] ?? 0;
          next[group.key] = (current + 1) % group.items.length;
        }
        return next;
      });
    }, 3600);
    return () => clearInterval(timer);
  }, [groups, stacked]);

  useEffect(() => {
    if (!groups.length || groups.length < 2) return;
    const timer = setInterval(() => {
      const nextKey = (() => {
        const current = activeKey;
        const idx = groups.findIndex((g) => g.key === current);
        if (idx === -1) return groups[0].key;
        return groups[(idx + 1) % groups.length].key;
      })();
      setActiveKey(nextKey);
      setActiveItemIndex(0);
    }, 5200);
    return () => clearInterval(timer);
  }, [groups, activeKey]);

  useEffect(() => {
    if (!active?.items?.length || active.items.length < 2) return;
    const timer = setInterval(() => {
      setActiveItemIndex((prev) => (prev + 1) % active.items.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [active]);

  if (!groups.length) {
    return (
      <div className="rounded-2xl border border-[#deccb5] bg-[#fff7ed] p-5 text-sm text-[#654b34]">
        No performer profiles yet.
      </div>
    );
  }

  if (stacked) {
    return (
      <div className="grid gap-4">
        {groups.map((group) => {
          const hasItems = group.items.length > 0;
          const currentIndex = hasItems
            ? (stackedIndexMap[group.key] ?? 0) % group.items.length
            : 0;
          const currentItem = hasItems ? group.items[currentIndex] : null;
          const canRotate = group.items.length > 1;

          const prevItem = () => {
            if (!canRotate) return;
            setStackedIndexMap((prev) => ({
              ...prev,
              [group.key]:
                ((prev[group.key] ?? 0) - 1 + group.items.length) %
                group.items.length,
            }));
          };
          const nextItem = () => {
            if (!canRotate) return;
            setStackedIndexMap((prev) => ({
              ...prev,
              [group.key]: ((prev[group.key] ?? 0) + 1) % group.items.length,
            }));
          };

          return (
            <section
              key={group.key}
              className="rounded-2xl border border-[#ddcab2] bg-[linear-gradient(170deg,#fffaf2_0%,#fff4e7_100%)] p-4 shadow-[0_10px_24px_rgba(90,54,24,0.1)]"
            >
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                    {group.subtitle}
                  </p>
                  <h3 className="jazz-heading mt-1 text-2xl text-[#2f2116]">
                    {group.label}
                  </h3>
                </div>
                <p className="rounded-full border border-[#e4d2be] bg-white px-3 py-1 text-xs font-semibold text-[#5f4733]">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "profile" : "profiles"}
                </p>
              </div>

              {!hasItems ? (
                <div className="mt-3 rounded-xl border border-[#e4d2be] bg-white p-4 text-sm text-[#5f4733]">
                  No performer profiles yet.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_240px]">
                  <article className="mx-auto w-full max-w-[700px] rounded-xl border border-[#e4d2be] bg-white">
                    {currentItem?.imageUrl ? (
                      <img
                        src={currentItem.imageUrl}
                        alt={currentItem.name}
                        className="h-[260px] w-full object-cover object-center transition duration-500 sm:h-[320px] lg:h-[350px]"
                      />
                    ) : (
                      <div className="flex h-[260px] w-full items-center justify-center bg-[#f5e8d8] px-4 text-center text-2xl font-semibold text-[#6d5038] sm:h-[320px] lg:h-[350px]">
                        {currentItem?.name}
                      </div>
                    )}
                  </article>

                  <div className="rounded-xl border border-[#e6d3bc] bg-white/90 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                      Now Showing
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#2f2116]">
                      {currentItem?.name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5f4733]">
                      {currentItem?.info}
                    </p>

                    {canRotate ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={prevItem}
                          className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf]"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={nextItem}
                          className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf]"
                        >
                          Next
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.items.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setStackedIndexMap((prev) => ({
                              ...prev,
                              [group.key]: idx,
                            }))
                          }
                          className={[
                            "h-2.5 rounded-full transition-all",
                            idx === currentIndex
                              ? "w-6 bg-[#b2875e]"
                              : "w-2.5 bg-[#cba886] hover:bg-[#b2875e]",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  if (!active) return null;
  const safeItemIndex = active.items.length
    ? activeItemIndex % active.items.length
    : 0;
  const activeItem = active.items[safeItemIndex] ?? null;
  const canRotate = active.items.length > 1;

  const prevItem = () => {
    if (!active.items.length) return;
    setActiveItemIndex(
      (prev) => (prev - 1 + active.items.length) % active.items.length,
    );
  };
  const nextItem = () => {
    if (!active.items.length) return;
    setActiveItemIndex((prev) => (prev + 1) % active.items.length);
  };

  const hasGroupTabs = groups.length > 1;

  if (compact) {
    return (
      <div className="rounded-2xl border border-[#decab3] bg-[linear-gradient(170deg,#fffaf2_0%,#fff4e7_100%)] p-3 shadow-[0_14px_34px_rgba(90,54,24,0.1)]">
        {active.items.length === 0 ? (
          <div className="rounded-2xl border border-[#eadccd] bg-white px-4 py-8 text-center text-sm text-[#6f533b]">
            No performer profiles yet.
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl border border-[#eadccd] bg-white">
              {activeItem?.imageUrl ? (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.name}
                  className="h-[270px] w-full object-cover object-center transition duration-500 sm:h-[300px]"
                />
              ) : (
                <div className="flex h-[270px] w-full items-center justify-center bg-[#f5e8d8] px-6 text-center text-2xl font-semibold text-[#6d5038] sm:h-[300px]">
                  {activeItem?.name}
                </div>
              )}

              <div className="absolute inset-x-0 top-0 p-4">
                <span className="inline-flex rounded-full border border-[#e8c9a6]/70 bg-[#2f2116]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f7e4cc]">
                  {active.label}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5">
                <p className="text-2xl font-semibold text-[#fff8ee]">
                  {activeItem?.name}
                </p>
                <p className="mt-1 text-sm text-[#f5e8d8]">
                  {activeItem?.info}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e6d3bc] bg-white/90 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                  Spotlight Control
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={prevItem}
                    disabled={!canRotate}
                    className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={nextItem}
                    disabled={!canRotate}
                    className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-3 grid max-h-[180px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {active.items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemIndex(index)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition ${
                      index === safeItemIndex
                        ? "border-[#b2875e] bg-[#eecfae] text-[#2f2116]"
                        : "border-[#eadccd] bg-white text-[#5f4733] hover:bg-[#f7eee2]"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${compact ? "xl:grid-cols-[230px_1fr]" : "lg:grid-cols-[290px_1fr]"}`}
    >
      <aside
        className={`rounded-2xl border border-[#d9c0a2] bg-[linear-gradient(175deg,#f8efe1_0%,#f2e4d2_100%)] p-3 ${compact ? "xl:h-[66vh]" : "lg:h-[74vh]"}`}
      >
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5d42]">
          Performers
        </p>
        {hasGroupTabs ? (
          <div className="mt-3 grid max-h-[45vh] gap-2 overflow-y-auto pr-1">
            {groups.map((group) => (
              <button
                key={group.key}
                onClick={() => selectGroup(group.key)}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                  activeKey === group.key
                    ? "border-[#b2875e] bg-[#eecfae] text-[#2f2116]"
                    : "border-[#eadccd] bg-white/90 text-[#2f2116] hover:bg-[#f7eee2]"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={`${hasGroupTabs ? "mt-3" : "mt-4"} rounded-xl border border-[#e3d1bc] bg-white/90 p-3`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
            {active.label}
          </p>
          <p className="mt-1 text-xs text-[#5f4733]">{active.subtitle}</p>
          <p className="mt-2 text-sm font-semibold text-[#2f2116]">
            {active.items.length}{" "}
            {active.items.length === 1 ? "profile" : "profiles"}
          </p>
        </div>
      </aside>

      <article className="min-w-0 rounded-3xl border border-[#decab3] bg-[linear-gradient(170deg,#fffaf2_0%,#fff4e7_100%)] p-4 shadow-[0_14px_34px_rgba(90,54,24,0.1)] md:p-5">
        {active.items.length === 0 ? (
          <div className="rounded-2xl border border-[#eadccd] bg-white px-4 py-8 text-center text-sm text-[#6f533b]">
            No performer profiles yet.
          </div>
        ) : (
          <div
            className={`grid gap-3 ${compact ? "md:grid-cols-[1fr_250px]" : "lg:grid-cols-[1fr_270px]"}`}
          >
            <div className="relative mx-auto w-full max-w-[700px] overflow-hidden rounded-2xl border border-[#eadccd] bg-white">
              {activeItem?.imageUrl ? (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.name}
                  className={`w-full object-cover object-center transition duration-500 ${compact ? "h-[300px] sm:h-[330px]" : "h-[320px] sm:h-[390px]"}`}
                />
              ) : (
                <div
                  className={`flex w-full items-center justify-center bg-[#f5e8d8] px-6 text-center text-2xl font-semibold text-[#6d5038] ${compact ? "h-[300px] sm:h-[330px]" : "h-[320px] sm:h-[390px]"}`}
                >
                  {activeItem?.name}
                </div>
              )}

              <div className="absolute inset-x-0 top-0 p-4">
                <span className="inline-flex rounded-full border border-[#e8c9a6]/70 bg-[#2f2116]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f7e4cc]">
                  {active.label}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5">
                <p className="text-2xl font-semibold text-[#fff8ee]">
                  {activeItem?.name}
                </p>
                <p className="mt-1 max-w-3xl text-sm text-[#f5e8d8]">
                  {activeItem?.info}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6d3bc] bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                Now Showing
              </p>
              <p className="mt-1 text-base font-semibold text-[#2f2116]">
                {activeItem?.name}
              </p>
              <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-[#5f4733]">
                {activeItem?.info}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={prevItem}
                  disabled={!canRotate}
                  className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={nextItem}
                  disabled={!canRotate}
                  className="rounded-lg border border-[#dcc5ab] bg-[#fff9f1] px-3 py-1 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="mt-3 grid max-h-[230px] gap-2 overflow-y-auto pr-1">
                {active.items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemIndex(index)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                      index === safeItemIndex
                        ? "border-[#b2875e] bg-[#eecfae] text-[#2f2116]"
                        : "border-[#eadccd] bg-white text-[#5f4733] hover:bg-[#f7eee2]"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

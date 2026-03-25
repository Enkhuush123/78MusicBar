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

function itemCountLabel(count: number) {
  return `${count} ${count === 1 ? "profile" : "profiles"}`;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#eadccd] bg-white px-4 py-8 text-center text-sm text-[#6f533b]">
      No performer profiles yet.
    </div>
  );
}

function SpotlightImage({
  item,
  label,
  compact = false,
}: {
  item: Item | null;
  label: string;
  compact?: boolean;
}) {
  const height = compact ? "h-[240px] sm:h-[340px]" : "h-[280px] sm:h-[440px]";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[#dcc4a8] bg-[#1f160f] shadow-[0_24px_56px_rgba(45,26,12,0.22)]">
      {item?.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`w-full object-cover object-center transition duration-700 ${height}`}
        />
      ) : (
        <div
          className={`flex w-full items-center justify-center bg-[#f3e1cb] px-6 text-center text-3xl font-semibold text-[#6d5038] ${height}`}
        >
          {item?.name}
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,8,6,0.08)_0%,rgba(12,8,6,0.16)_32%,rgba(12,8,6,0.88)_100%)]" />

      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f6ddbc] backdrop-blur">
          {label}
        </span>
        <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          78MusicBar
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2c99b]">
          Performer spotlight
        </p>
        <p className="jazz-heading mt-2 text-[1.9rem] leading-none text-[#fff8ee] sm:text-5xl">
          {item?.name}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#f7e8d4]/88 sm:mt-3 sm:text-base">
          {item?.info}
        </p>
      </div>
    </div>
  );
}

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
  const [stackedIndexMap, setStackedIndexMap] = useState<Record<string, number>>(
    {},
  );

  const active = useMemo(
    () => groups.find((g) => g.key === activeKey) ?? groups[0],
    [activeKey, groups],
  );

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
    if (!groups.length || groups.length < 2 || stacked) return;
    const timer = setInterval(() => {
      setActiveKey((current) => {
        const idx = groups.findIndex((g) => g.key === current);
        if (idx === -1) return groups[0].key;
        return groups[(idx + 1) % groups.length].key;
      });
      setActiveItemIndex(0);
    }, 5200);
    return () => clearInterval(timer);
  }, [groups, stacked]);

  useEffect(() => {
    if (!active?.items?.length || active.items.length < 2 || stacked) return;
    const timer = setInterval(() => {
      setActiveItemIndex((prev) => (prev + 1) % active.items.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [active, stacked]);

  if (!groups.length) {
    return (
      <div className="rounded-2xl border border-[#deccb5] bg-[#fff7ed] p-5 text-sm text-[#654b34]">
        No performer profiles yet.
      </div>
    );
  }

  if (stacked) {
    return (
      <div className="grid gap-5">
        {groups.map((group) => {
          const hasItems = group.items.length > 0;
          const currentIndex = hasItems
            ? (stackedIndexMap[group.key] ?? 0) % group.items.length
            : 0;
          const currentItem = hasItems ? group.items[currentIndex] : null;
          const canRotate = group.items.length > 1;

          return (
            <section
              key={group.key}
              className="relative overflow-hidden rounded-[32px] border border-[#d8c0a1] bg-[linear-gradient(160deg,#fff8ee_0%,#f4e6d5_58%,#ecd6bb_100%)] p-4 shadow-[0_18px_36px_rgba(85,53,28,0.12)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.56),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(187,133,81,0.22),transparent_26%)]" />

              <div className="relative flex items-end justify-between gap-3">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b694b]">
                    {group.subtitle}
                  </p>
                  <h3 className="jazz-heading mt-2 text-[2rem] text-[#2f2116] sm:text-4xl md:text-5xl">
                    {group.label}
                  </h3>
                </div>
                <p className="rounded-full border border-[#d8c1a8] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f4733] shadow-[0_10px_20px_rgba(84,56,31,0.08)]">
                  {itemCountLabel(group.items.length)}
                </p>
              </div>

              {!hasItems ? (
                <div className="relative mt-4">
                  <EmptyState />
                </div>
              ) : (
                <div className="relative mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
                  <SpotlightImage item={currentItem} label={group.label} />

                  <div className="grid gap-3">
                    <div className="rounded-[24px] border border-[#dbc3a7] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(250,240,227,0.92)_100%)] p-4 shadow-[0_14px_32px_rgba(84,56,31,0.08)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5d42]">
                        Lineup note
                      </p>
                      <p className="mt-2 text-xl font-semibold text-[#2f2116]">
                        {currentItem?.name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#5f4733]">
                        {currentItem?.info}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-[#ead7c2] bg-white/80 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                            Type
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                            {group.label}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#ead7c2] bg-white/80 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                            Count
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                            {group.items.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#ead7c2] bg-white/80 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                            Venue
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                            78
                          </p>
                        </div>
                      </div>
                    </div>

                    {canRotate ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setStackedIndexMap((prev) => ({
                              ...prev,
                              [group.key]:
                                ((prev[group.key] ?? 0) - 1 + group.items.length) %
                                group.items.length,
                            }))
                          }
                          className="flex-1 rounded-2xl border border-[#d9c2a7] bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f2116] transition hover:bg-[#f8efe2]"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStackedIndexMap((prev) => ({
                              ...prev,
                              [group.key]:
                                ((prev[group.key] ?? 0) + 1) % group.items.length,
                            }))
                          }
                          className="flex-1 rounded-2xl border border-[#d9c2a7] bg-[#2f2116] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff7eb] transition hover:bg-[#20150d]"
                        >
                          Next
                        </button>
                      </div>
                    ) : null}

                    <div className="rounded-[24px] border border-[#dbc3a7] bg-[linear-gradient(180deg,#fffdf9_0%,#f9efdf_100%)] p-3 shadow-[0_14px_32px_rgba(84,56,31,0.07)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5d42]">
                          Profiles reel
                        </p>
                        <div className="flex flex-wrap gap-1.5">
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
                              aria-label={`${group.label} profile ${idx + 1}`}
                              className={[
                                "h-2.5 rounded-full transition-all",
                                idx === currentIndex
                                  ? "w-7 bg-[#9f734e]"
                                  : "w-2.5 bg-[#d5b08a] hover:bg-[#b2875e]",
                              ].join(" ")}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 grid max-h-[240px] gap-2 overflow-y-auto pr-1 sm:max-h-none">
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
                              "flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
                              idx === currentIndex
                                ? "border-[#bb8d63] bg-[#2f2116] text-[#fff7eb]"
                                : "border-[#e7d2bc] bg-white/85 text-[#2f2116] hover:bg-[#fbf4ea]",
                            ].join(" ")}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">
                                {item.name}
                              </span>
                              <span
                                className={[
                                  "mt-1 block text-xs uppercase tracking-[0.16em]",
                                  idx === currentIndex
                                    ? "text-[#f3dac0]/80"
                                    : "text-[#7a5d42]",
                                ].join(" ")}
                              >
                                {group.label}
                              </span>
                            </span>
                            <span
                              className={[
                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                idx === currentIndex
                                  ? "bg-white/10 text-[#f8dfbf]"
                                  : "bg-[#f4e3d1] text-[#7a5d42]",
                              ].join(" ")}
                            >
                              {idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
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
  const hasGroupTabs = groups.length > 1;

  if (compact) {
    return (
      <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#decab3] bg-[linear-gradient(160deg,#fffaf2_0%,#f7ead9_54%,#efdcc7_100%)] p-2.5 shadow-[0_18px_36px_rgba(90,54,24,0.12)] sm:p-3">
        {active.items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            <SpotlightImage item={activeItem} label={active.label} compact />

            <div className="rounded-[22px] border border-[#e0ccb8] bg-white/88 p-3 shadow-[0_12px_26px_rgba(84,56,31,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5d42]">
                    Spotlight control
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                    {itemCountLabel(active.items.length)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveItemIndex(
                        (prev) => (prev - 1 + active.items.length) % active.items.length,
                      )
                    }
                    disabled={!canRotate}
                    className="rounded-xl border border-[#dcc5ab] bg-[#fff9f1] px-3 py-2 text-xs font-semibold text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveItemIndex((prev) => (prev + 1) % active.items.length)
                    }
                    disabled={!canRotate}
                    className="rounded-xl border border-[#dcc5ab] bg-[#2f2116] px-3 py-2 text-xs font-semibold text-[#fff8ee] transition hover:bg-[#20150d] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-3 grid max-h-[180px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {active.items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemIndex(index)}
                    className={`rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${
                      index === safeItemIndex
                        ? "border-[#b2875e] bg-[#2f2116] text-[#fff8ee]"
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
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="overflow-hidden rounded-[28px] border border-[#d4baa0] bg-[linear-gradient(175deg,#3b2a1d_0%,#261910_100%)] p-3 text-[#f6e8d4] shadow-[0_20px_44px_rgba(22,13,7,0.28)]">
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2cd9d]/85">
            Performers
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#f7ead8]/80">
            Switch between DJ, Artist, and Band lineups.
          </p>
        </div>

        {hasGroupTabs ? (
          <div className="mt-3 grid gap-2 overflow-y-auto pr-1 lg:max-h-[45vh]">
            {groups.map((group) => (
              <button
                key={group.key}
                onClick={() => {
                  setActiveKey(group.key);
                  setActiveItemIndex(0);
                }}
                className={`rounded-[20px] border px-4 py-3 text-left text-sm font-semibold transition ${
                  activeKey === group.key
                    ? "border-[#f0c28e] bg-[linear-gradient(180deg,#f4d2a8_0%,#e8b97b_100%)] text-[#24170f] shadow-[0_12px_24px_rgba(0,0,0,0.24)]"
                    : "border-white/10 bg-white/5 text-[#f7ead8] hover:bg-white/10"
                }`}
              >
                <span className="block">{group.label}</span>
                <span
                  className={`mt-1 block text-[11px] uppercase tracking-[0.16em] ${
                    activeKey === group.key ? "text-[#5e4330]" : "text-[#f2cd9d]/70"
                  }`}
                >
                  {itemCountLabel(group.items.length)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={`${hasGroupTabs ? "mt-3" : "mt-4"} rounded-[22px] border border-white/10 bg-white/5 p-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2cd9d]/80">
            Active reel
          </p>
          <p className="mt-2 text-xl font-semibold text-[#fff8ee]">{active.label}</p>
          <p className="mt-1 text-xs text-[#f7ead8]/76">{active.subtitle}</p>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f2cd9d]/70">
              Profiles
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#fff8ee]">
              {active.items.length}
            </p>
          </div>
        </div>
      </aside>

      <article className="min-w-0 overflow-hidden rounded-[30px] border border-[#decab3] bg-[linear-gradient(165deg,#fffaf2_0%,#f6e6d3_58%,#efd8bb_100%)] p-4 shadow-[0_20px_40px_rgba(90,54,24,0.12)] md:p-5">
        {active.items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_300px]">
            <SpotlightImage item={activeItem} label={active.label} />

            <div className="grid gap-3">
              <div className="rounded-[24px] border border-[#e2ccb7] bg-white/88 p-4 shadow-[0_14px_28px_rgba(84,56,31,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a5d42]">
                  Spotlight notes
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2116]">
                  {activeItem?.name}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#5f4733]">
                  {activeItem?.info}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[20px] border border-[#e3d0bb] bg-white/78 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                    Type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                    {active.label}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[#e3d0bb] bg-white/78 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                    Profiles
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                    {active.items.length}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[#e3d0bb] bg-white/78 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b694b]">
                    Venue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                    78
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveItemIndex(
                      (prev) => (prev - 1 + active.items.length) % active.items.length,
                    )
                  }
                  disabled={!canRotate}
                  className="flex-1 rounded-2xl border border-[#dcc5ab] bg-[#fff9f1] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f2116] transition hover:bg-[#f6ecdf] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveItemIndex((prev) => (prev + 1) % active.items.length)
                  }
                  disabled={!canRotate}
                  className="flex-1 rounded-2xl border border-[#dcc5ab] bg-[#2f2116] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff8ee] transition hover:bg-[#20150d] disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="rounded-[24px] border border-[#e2ccb7] bg-[linear-gradient(180deg,#fffefb_0%,#f7ecdd_100%)] p-3 shadow-[0_14px_28px_rgba(84,56,31,0.07)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a5d42]">
                  Performer reel
                </p>
                <div className="mt-3 grid max-h-[250px] gap-2 overflow-y-auto pr-1">
                  {active.items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItemIndex(index)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-xs font-semibold transition ${
                        index === safeItemIndex
                          ? "border-[#b2875e] bg-[#2f2116] text-[#fff8ee]"
                          : "border-[#eadccd] bg-white text-[#5f4733] hover:bg-[#f7eee2]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {item.name}
                        </span>
                        <span
                          className={`mt-1 block text-[10px] uppercase tracking-[0.16em] ${
                            index === safeItemIndex
                              ? "text-[#f3dac0]/70"
                              : "text-[#8b694b]"
                          }`}
                        >
                          {active.label}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          index === safeItemIndex
                            ? "bg-white/10 text-[#f8dfbf]"
                            : "bg-[#f4e3d1] text-[#7a5d42]"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

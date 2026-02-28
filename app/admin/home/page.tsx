/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

type Hero = {
  id: string;
  imageUrl: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  isActive: boolean;
};

type HomeImage = {
  id: string;
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

type EventOption = {
  id: string;
  title: string;
  startsAt: string;
  isPublished?: boolean;
};

type FeaturedRow = {
  id: string;
  sort: number;
  isActive: boolean;
  eventId: string;
  event: EventOption;
};

async function uploadToCloudinary(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  return (await res.json()) as { url: string };
}

export default function AdminHomePage() {
  const { locale } = useLocale();
  const [hero, setHero] = useState<Hero | null>(null);
  const [imgs, setImgs] = useState<HomeImage[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);

  const [specialPick, setSpecialPick] = useState("");
  const [upcomingPick, setUpcomingPick] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setMsg(null);
    const [h, g, f, ev] = await Promise.all([
      fetch("/api/admin/home", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/home/images", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/home/featured", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/events", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => d.events ?? []),
    ]);
    setHero(h);
    setImgs(g);
    setFeatured(f);
    setEvents(ev);
    setSpecialPick((prev) => prev || ev?.[0]?.id || "");
    setUpcomingPick((prev) => prev || ev?.[0]?.id || "");
  };

  useEffect(() => {
    load();
  }, []);

  const special = useMemo(
    () => featured.find((f) => f.sort === 0) ?? null,
    [featured],
  );

  const upcomingRows = useMemo(
    () => featured.filter((f) => f.sort > 0).sort((a, b) => a.sort - b.sort),
    [featured],
  );

  const saveHero = async () => {
    if (!hero) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hero),
      });
      if (!res.ok) return setMsg(tr(locale, "Save failed", "Хадгалахад алдаа гарлаа"));
      setMsg(tr(locale, "✅ Hero saved", "✅ Hero хадгалагдлаа"));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onHeroFile = async (file: File) => {
    if (!hero) return;
    try {
      const up = await uploadToCloudinary(file);
      setHero({ ...hero, imageUrl: up.url });
    } catch {
      setMsg(tr(locale, "Upload error", "Зураг оруулахад алдаа гарлаа"));
    }
  };

  const addGallery = async (file: File) => {
    try {
      const up = await uploadToCloudinary(file);
      const res = await fetch("/api/admin/home/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: up.url, sort: 0 }),
      });
      if (!res.ok) return setMsg(tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
      await load();
    } catch {
      setMsg(tr(locale, "Upload error", "Зураг оруулахад алдаа гарлаа"));
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/home/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    await load();
  };

  const removeGallery = async (id: string) => {
    if (!confirm(tr(locale, "Delete image?", "Зургийг устгах уу?"))) return;
    await fetch(`/api/admin/home/images/${id}`, { method: "DELETE" });
    await load();
  };

  const setSpecialEvent = async () => {
    if (!specialPick) return;
    setSaving(true);
    setMsg(null);
    try {
      if (special && special.eventId !== specialPick) {
        await fetch(`/api/admin/home/featured/${special.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort: 1 }),
        });
      }

      await fetch("/api/admin/home/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: specialPick, sort: 0 }),
      });

      setMsg(tr(locale, "✅ Special event updated", "✅ Онцлох эвент шинэчлэгдлээ"));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const addUpcomingEvent = async () => {
    if (!upcomingPick) return;
    const used = featured.some((f) => f.eventId === upcomingPick);
    if (used)
      return setMsg(
        tr(locale, "This event is already selected.", "Энэ эвент аль хэдийн сонгогдсон байна."),
      );

    setSaving(true);
    setMsg(null);
    try {
      const nextSort = Math.max(1, ...upcomingRows.map((x) => x.sort)) + 1;
      await fetch("/api/admin/home/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: upcomingPick, sort: nextSort }),
      });
      setMsg(tr(locale, "✅ Upcoming event added", "✅ Удахгүй эвент нэмэгдлээ"));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const moveUpcoming = async (id: string, dir: "up" | "down") => {
    const index = upcomingRows.findIndex((x) => x.id === id);
    if (index === -1) return;
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= upcomingRows.length) return;

    const a = upcomingRows[index];
    const b = upcomingRows[swapWith];
    await Promise.all([
      fetch(`/api/admin/home/featured/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: b.sort }),
      }),
      fetch(`/api/admin/home/featured/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: a.sort }),
      }),
    ]);
    await load();
  };

  const removeFeatured = async (id: string) => {
    await fetch(`/api/admin/home/featured/${id}`, { method: "DELETE" });
    await load();
  };

  if (!hero)
    return (
      <div className="text-amber-100/80">
        {tr(locale, "Loading...", "Уншиж байна...")}
      </div>
    );

  return (
    <section className="mx-auto max-w-5xl px-1 py-2">
      <div className="jazz-panel rounded-2xl p-6">
        <p className="jazz-heading text-amber-200">{tr(locale, "Homepage", "Нүүр хуудас")}</p>
        <h1 className="jazz-heading text-4xl text-amber-50">{tr(locale, "Admin Home", "Нүүр удирдлага")}</h1>
        {msg && <p className="mt-2 text-sm text-amber-100/80">{msg}</p>}

        <div className="mt-6 grid gap-5">
          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">{tr(locale, "Special Event", "Онцлох эвент")}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px]">
              <select
                className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                value={specialPick}
                onChange={(e) => setSpecialPick(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              <button
                onClick={setSpecialEvent}
                className="h-11 rounded-xl bg-amber-300 font-semibold text-neutral-900 hover:bg-amber-200"
              >
                {tr(locale, "Set", "Сонгох")}
              </button>
            </div>
            {special ? (
              <p className="mt-2 text-sm text-amber-100/70">
                {tr(locale, "Current", "Одоогийн")}: {special.event.title}
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-100/70">
                {tr(locale, "No special event selected.", "Онцлох эвент сонгоогүй байна.")}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">{tr(locale, "Upcoming Events", "Удахгүй эвентүүд")}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px]">
              <select
                className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                value={upcomingPick}
                onChange={(e) => setUpcomingPick(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              <button
                onClick={addUpcomingEvent}
                className="h-11 rounded-xl bg-amber-300 font-semibold text-neutral-900 hover:bg-amber-200"
              >
                {tr(locale, "Add", "Нэмэх")}
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {upcomingRows.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-black/30 px-3 py-2"
                >
                  <p className="text-sm text-amber-50">
                    {i + 1}. {r.event.title}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveUpcoming(r.id, "up")}
                      className="rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-50"
                    >
                      {tr(locale, "Up", "Дээш")}
                    </button>
                    <button
                      onClick={() => moveUpcoming(r.id, "down")}
                      className="rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-50"
                    >
                      {tr(locale, "Down", "Доош")}
                    </button>
                    <button
                      onClick={() => removeFeatured(r.id)}
                      className="rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-50"
                    >
                      {tr(locale, "Remove", "Хасах")}
                    </button>
                  </div>
                </div>
              ))}
              {upcomingRows.length === 0 && (
                <p className="text-sm text-amber-100/70">
                  {tr(locale, "No upcoming events selected.", "Удахгүй эвент сонгоогүй байна.")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">Hero</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-xl border border-amber-300/25 bg-black/30">
                {hero.imageUrl ? (
                  <img src={hero.imageUrl} alt="hero" className="h-40 w-full object-cover" />
                ) : (
                  <div className="grid h-40 place-items-center text-sm text-amber-100/70">
                    {tr(locale, "No image", "Зураг алга")}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <input
                  className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                  value={hero.headline}
                  onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                  placeholder={tr(locale, "Headline", "Гарчиг")}
                />
                <input
                  className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                  value={hero.subheadline}
                  onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
                  placeholder={tr(locale, "Subheadline", "Дэд гарчиг")}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                    value={hero.ctaText}
                    onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
                    placeholder={tr(locale, "CTA text", "CTA текст")}
                  />
                  <input
                    className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                    value={hero.ctaHref}
                    onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })}
                    placeholder={tr(locale, "CTA href", "CTA холбоос")}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-amber-100">
                    <input
                      className="mr-2"
                      type="checkbox"
                      checked={hero.isActive}
                      onChange={(e) => setHero({ ...hero, isActive: e.target.checked })}
                    />
                    {tr(locale, "Active", "Идэвхтэй")}
                  </label>
                  <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-amber-300/40 px-4 text-sm text-amber-50 hover:bg-amber-300/15">
                    {tr(locale, "Upload hero", "Hero зураг оруулах")}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onHeroFile(f);
                      }}
                    />
                  </label>
                  <button
                    onClick={saveHero}
                    disabled={saving}
                    className={cn(
                      "h-11 rounded-xl px-5 text-sm font-semibold",
                      saving
                        ? "bg-neutral-200 text-neutral-500"
                        : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
                    )}
                  >
                    {tr(locale, "Save hero", "Hero хадгалах")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-100">{tr(locale, "Gallery Images", "Галерей зураг")}</p>
              <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-amber-300/40 px-4 text-sm text-amber-50 hover:bg-amber-300/15">
                {tr(locale, "+ Add image", "+ Зураг нэмэх")}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addGallery(f);
                  }}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {imgs.map((it) => (
                <div key={it.id} className="rounded-2xl border border-amber-300/25 p-3">
                  <div className="h-40 overflow-hidden rounded-xl border border-amber-300/25 bg-black/30">
                    <img src={it.imageUrl} alt="img" className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="text-xs text-amber-100">
                      <input
                        className="mr-2"
                        type="checkbox"
                        checked={it.isActive}
                        onChange={(e) => toggleActive(it.id, e.target.checked)}
                      />
                      {tr(locale, "Active", "Идэвхтэй")}
                    </label>
                    <button
                      onClick={() => removeGallery(it.id)}
                      className="rounded-lg border border-amber-300/40 px-3 py-1 text-xs text-amber-50"
                    >
                      {tr(locale, "Delete", "Устгах")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

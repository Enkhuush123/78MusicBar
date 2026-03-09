/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import AdminConfirmDialog from "@/app/components/admin-confirm-dialog";

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

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

type ConfirmState = {
  open: boolean;
  kind: "slider" | "gallery" | "featured" | null;
  id: string | null;
  title: string;
  body: string;
};

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2560;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function guessMimeType(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function imageFromFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Cannot read image file"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to process image"));
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

async function optimizeImageForUpload(file: File) {
  const unsupportedHeic =
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    /\.(heic|heif)$/i.test(file.name);
  if (unsupportedHeic) {
    throw new Error("HEIC зураг дэмжихгүй байна. JPG/PNG/WebP оруулна уу.");
  }

  const compressible = /image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  if (!compressible) {
    if (file.size > TARGET_UPLOAD_BYTES) {
      throw new Error("JPG/PNG/WebP under 8MB only.");
    }
    return file;
  }
  if (file.size <= TARGET_UPLOAD_BYTES) return file;

  const img = await imageFromFile(file);
  const maxSide = Math.max(img.width, img.height);
  const scale = Math.min(1, MAX_IMAGE_EDGE / maxSide);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_UPLOAD_BYTES && quality > 0.55) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > TARGET_UPLOAD_BYTES) {
    throw new Error(
      "Image is still too large after optimization. Please crop/resize and retry.",
    );
  }

  const base = file.name.replace(/\.[^.]+$/, "");
  if (blob.size >= file.size * 0.96 && file.size <= TARGET_UPLOAD_BYTES) {
    return file;
  }
  return new File([blob], `${base}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function uploadToCloudinary(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image too large. Please use an image under 40MB.");
  }
  const optimized = await optimizeImageForUpload(file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      "Content-Type": guessMimeType(optimized),
      "X-File-Name": encodeURIComponent(optimized.name || "upload-image"),
    },
    body: optimized,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(String(d?.message ?? "upload failed"));
  }
  const data = (await res.json()) as { url: string };
  return { ...data, sourceBytes: file.size, uploadBytes: optimized.size };
}

export default function AdminHomePage() {
  const { locale } = useLocale();
  const [hero, setHero] = useState<Hero | null>(null);
  const [sliderImgs, setSliderImgs] = useState<HomeImage[]>([]);
  const [galleryImgs, setGalleryImgs] = useState<HomeImage[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);

  const [specialPick, setSpecialPick] = useState("");
  const [upcomingPick, setUpcomingPick] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    open: false,
    kind: null,
    id: null,
    title: "",
    body: "",
  });

  const load = async () => {
    setMsg(null);
    const [h, slider, gallery, f, ev] = await Promise.all([
      fetch("/api/admin/home", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/home/images", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/admin/home/gallery", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/admin/home/featured", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/admin/events", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => d.events ?? []),
    ]);
    setHero(h);
    setSliderImgs(slider);
    setGalleryImgs(gallery);
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
      if (!res.ok)
        return setMsg(tr(locale, "Save failed", "Хадгалахад алдаа гарлаа"));
      setMsg(tr(locale, "✅ Hero saved", "✅ Hero хадгалагдлаа"));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onHeroFile = async (file: File) => {
    if (!hero) return;
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadToCloudinary(file);
      setHero({ ...hero, imageUrl: up.url });
      setMsg(
        tr(
          locale,
          `Hero image ready (${formatBytes(up.sourceBytes)} -> ${formatBytes(up.uploadBytes)}). Click Save hero.`,
          `Hero зураг бэлэн (${formatBytes(up.sourceBytes)} -> ${formatBytes(up.uploadBytes)}). Hero хадгалах дарна уу.`,
        ),
      );
    } catch (e) {
      const reason = String((e as Error)?.message ?? "");
      setMsg(reason || tr(locale, "Upload error", "Зураг оруулахад алдаа гарлаа"));
    } finally {
      setUploading(false);
    }
  };

  const addSliderImage = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadToCloudinary(file);
      const res = await fetch("/api/admin/home/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: up.url, sort: 0 }),
      });
      if (!res.ok)
        return setMsg(tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
      await load();
    } catch (e) {
      const reason = String((e as Error)?.message ?? "");
      setMsg(reason || tr(locale, "Upload error", "Зураг оруулахад алдаа гарлаа"));
    } finally {
      setUploading(false);
    }
  };

  const addSliderImages = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await addSliderImage(file);
    }
  };

  const toggleSliderActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/home/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    await load();
  };

  const updateSliderSort = async (id: string, sort: number) => {
    await fetch(`/api/admin/home/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort }),
    });
    await load();
  };

  const askRemoveSliderImage = (id: string) => {
    setConfirmDialog({
      open: true,
      kind: "slider",
      id,
      title: tr(locale, "Delete slider image?", "Слайдер зургийг устгах уу?"),
      body: tr(
        locale,
        "This image will be removed from hero slider.",
        "Энэ зураг hero слайдераас устна.",
      ),
    });
  };

  const addGalleryImage = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadToCloudinary(file);
      const res = await fetch("/api/admin/home/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: up.url, sort: 0 }),
      });
      if (!res.ok)
        return setMsg(tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
      await load();
    } catch (e) {
      const reason = String((e as Error)?.message ?? "");
      setMsg(reason || tr(locale, "Upload error", "Зураг оруулахад алдаа гарлаа"));
    } finally {
      setUploading(false);
    }
  };

  const addGalleryImages = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await addGalleryImage(file);
    }
  };

  const toggleGalleryActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/home/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    await load();
  };

  const updateGallerySort = async (id: string, sort: number) => {
    await fetch(`/api/admin/home/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort }),
    });
    await load();
  };

  const askRemoveGalleryImage = (id: string) => {
    setConfirmDialog({
      open: true,
      kind: "gallery",
      id,
      title: tr(locale, "Delete gallery image?", "Галерейн зургийг устгах уу?"),
      body: tr(
        locale,
        "This image will be removed from homepage gallery.",
        "Энэ зураг homepage gallery-с устна.",
      ),
    });
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

      setMsg(
        tr(locale, "✅ Special event updated", "✅ Онцлох эвент шинэчлэгдлээ"),
      );
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
        tr(
          locale,
          "This event is already selected.",
          "Энэ эвент аль хэдийн сонгогдсон байна.",
        ),
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
      setMsg(
        tr(locale, "✅ Upcoming event added", "✅ Удахгүй эвент нэмэгдлээ"),
      );
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

  const askRemoveFeatured = (id: string) => {
    setConfirmDialog({
      open: true,
      kind: "featured",
      id,
      title: tr(locale, "Remove this event?", "Энэ эвентийг хасах уу?"),
      body: tr(
        locale,
        "This event will be removed from homepage featured list.",
        "Энэ эвент нүүр хуудасны онцлох жагсаалтаас хасагдана.",
      ),
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      open: false,
      kind: null,
      id: null,
      title: "",
      body: "",
    });
  };

  const runConfirm = async () => {
    if (!confirmDialog.id || !confirmDialog.kind) return closeConfirm();
    const id = confirmDialog.id;
    const kind = confirmDialog.kind;
    closeConfirm();
    if (kind === "slider") {
      await fetch(`/api/admin/home/images/${id}`, { method: "DELETE" });
      await load();
      return;
    }
    if (kind === "gallery") {
      await fetch(`/api/admin/home/gallery/${id}`, { method: "DELETE" });
      await load();
      return;
    }
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
        <p className="jazz-heading text-amber-200">
          {tr(locale, "Homepage", "Нүүр хуудас")}
        </p>
        <h1 className="jazz-heading text-4xl text-amber-50">
          {tr(locale, "Admin Home", "Нүүр удирдлага")}
        </h1>
        {msg && <p className="mt-2 text-sm text-amber-100/80">{msg}</p>}

        <div className="mt-6 grid gap-5">
          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">
              {tr(locale, "Special Event", "Онцлох эвент")}
            </p>
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
                {tr(
                  locale,
                  "No special event selected.",
                  "Онцлох эвент сонгоогүй байна.",
                )}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">
              {tr(locale, "Upcoming Events", "Удахгүй эвентүүд")}
            </p>
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
                      onClick={() => askRemoveFeatured(r.id)}
                      className="rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-50"
                    >
                      {tr(locale, "Remove", "Хасах")}
                    </button>
                  </div>
                </div>
              ))}
              {upcomingRows.length === 0 && (
                <p className="text-sm text-amber-100/70">
                  {tr(
                    locale,
                    "No upcoming events selected.",
                    "Удахгүй эвент сонгоогүй байна.",
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <p className="text-sm font-semibold text-amber-100">Hero</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-xl border border-amber-300/25 bg-black/30">
                {hero.imageUrl ? (
                  <img
                    src={hero.imageUrl}
                    alt="hero"
                    className="h-40 w-full object-cover"
                  />
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
                  onChange={(e) =>
                    setHero({ ...hero, headline: e.target.value })
                  }
                  placeholder={tr(locale, "Headline", "Гарчиг")}
                />
                <input
                  className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                  value={hero.subheadline}
                  onChange={(e) =>
                    setHero({ ...hero, subheadline: e.target.value })
                  }
                  placeholder={tr(locale, "Subheadline", "Дэд гарчиг")}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                    value={hero.ctaText}
                    onChange={(e) =>
                      setHero({ ...hero, ctaText: e.target.value })
                    }
                    placeholder={tr(locale, "CTA text", "CTA текст")}
                  />
                  <input
                    className="h-11 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                    value={hero.ctaHref}
                    onChange={(e) =>
                      setHero({ ...hero, ctaHref: e.target.value })
                    }
                    placeholder={tr(locale, "CTA href", "CTA холбоос")}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-amber-100">
                    <input
                      className="mr-2"
                      type="checkbox"
                      checked={hero.isActive}
                      onChange={(e) =>
                        setHero({ ...hero, isActive: e.target.checked })
                      }
                    />
                    {tr(locale, "Active", "Идэвхтэй")}
                  </label>

                  <label className="group inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-dashed border-amber-300/45 bg-black/25 px-4 text-sm text-amber-50 transition hover:bg-amber-300/15">
                    {uploading
                      ? tr(locale, "Uploading...", "Оруулж байна...")
                      : tr(locale, "Upload Hero Image", "Hero зураг оруулах")}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          void onHeroFile(f);
                          e.currentTarget.value = "";
                        }
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
                <p className="text-xs text-amber-100/70">
                  {tr(
                    locale,
                    "Large images are automatically optimized before upload.",
                    "Том зургууд upload хийхээс өмнө автоматаар шахагдана.",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  {tr(locale, "Hero Slider Images", "Hero слайдер зургууд")}
                </p>
                <p className="mt-1 text-xs text-amber-100/70">
                  {tr(
                    locale,
                    "Used only in hero auto-slider.",
                    "Зөвхөн hero auto-slider дээр ашиглагдана.",
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2">
                <p className="text-xs text-amber-100/70">{tr(locale, "TOTAL", "НИЙТ")}</p>
                <p className="text-lg font-bold text-amber-50">{sliderImgs.length}</p>
              </div>
            </div>

            <div className="mt-3">
              <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-amber-300/40 px-4 text-sm text-amber-50 hover:bg-amber-300/15">
                {uploading
                  ? tr(locale, "Uploading...", "Оруулж байна...")
                  : tr(locale, "Upload slider images", "Слайдер зураг оруулах")}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void addSliderImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sliderImgs.map((img) => (
                <article
                  key={img.id}
                  className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/20"
                >
                  <div className="h-44 bg-black/30">
                    <img
                      src={img.imageUrl}
                      alt="hero-slider"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-3 p-3">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <input
                        type="number"
                        className="h-10 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-sm text-amber-50"
                        defaultValue={img.sort}
                        onBlur={(e) =>
                          void updateSliderSort(img.id, Number(e.target.value))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-amber-100/80">
                        <input
                          type="checkbox"
                          checked={img.isActive}
                          onChange={(e) => void toggleSliderActive(img.id, e.target.checked)}
                        />
                        {tr(locale, "Active", "Идэвхтэй")}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => askRemoveSliderImage(img.id)}
                      className="h-10 rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                    >
                      {tr(locale, "Delete", "Устгах")}
                    </button>
                  </div>
                </article>
              ))}
              {sliderImgs.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-amber-300/30 bg-black/20 p-6 text-center text-sm text-amber-100/70">
                  {tr(locale, "No slider images yet.", "Слайдер зураг алга байна.")}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  {tr(locale, "Homepage Gallery Images", "Homepage галерейн зургууд")}
                </p>
                <p className="mt-1 text-xs text-amber-100/70">
                  {tr(
                    locale,
                    "Used only in homepage gallery section.",
                    "Зөвхөн homepage gallery хэсэгт ашиглагдана.",
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2">
                <p className="text-xs text-amber-100/70">{tr(locale, "TOTAL", "НИЙТ")}</p>
                <p className="text-lg font-bold text-amber-50">{galleryImgs.length}</p>
              </div>
            </div>

            <div className="mt-3">
              <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-amber-300/40 px-4 text-sm text-amber-50 hover:bg-amber-300/15">
                {uploading
                  ? tr(locale, "Uploading...", "Оруулж байна...")
                  : tr(locale, "Upload gallery images", "Галерей зураг оруулах")}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void addGalleryImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImgs.map((img) => (
                <article
                  key={img.id}
                  className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/20"
                >
                  <div className="h-44 bg-black/30">
                    <img
                      src={img.imageUrl}
                      alt="homepage-gallery"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-3 p-3">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <input
                        type="number"
                        className="h-10 rounded-xl border border-amber-300/30 bg-black/30 px-3 text-sm text-amber-50"
                        defaultValue={img.sort}
                        onBlur={(e) =>
                          void updateGallerySort(img.id, Number(e.target.value))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-amber-100/80">
                        <input
                          type="checkbox"
                          checked={img.isActive}
                          onChange={(e) => void toggleGalleryActive(img.id, e.target.checked)}
                        />
                        {tr(locale, "Active", "Идэвхтэй")}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => askRemoveGalleryImage(img.id)}
                      className="h-10 rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                    >
                      {tr(locale, "Delete", "Устгах")}
                    </button>
                  </div>
                </article>
              ))}
              {galleryImgs.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-amber-300/30 bg-black/20 p-6 text-center text-sm text-amber-100/70">
                  {tr(locale, "No gallery images yet.", "Галерейн зураг алга байна.")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AdminConfirmDialog
        open={confirmDialog.open}
        locale={locale}
        title={confirmDialog.title}
        body={confirmDialog.body}
        tone="red"
        confirmLabel={tr(locale, "Delete", "Устгах")}
        cancelLabel={tr(locale, "Back", "Буцах")}
        onCancel={closeConfirm}
        onConfirm={() => void runConfirm()}
      />
    </section>
  );
}

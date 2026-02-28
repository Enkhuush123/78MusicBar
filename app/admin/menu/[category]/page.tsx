/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";

type Row = {
  id: string;
  category: "drinks" | "food";
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

export default function AdminMenuPage() {
  const { locale } = useLocale();
  const params = useParams<{ category: "drinks" | "food" }>();
  const category = params.category;

  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setMsg(null);
    const res = await fetch(`/api/admin/menu?category=${category}`, {
      cache: "no-store",
    });
    if (!res.ok) return setMsg(tr(locale, "Load failed", "Уншихад алдаа гарлаа"));
    setRows(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const upload = async (file: File, onDone?: (url: string) => void) => {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || tr(locale, "Upload failed", "Зураг оруулахад алдаа гарлаа"));
        return;
      }
      const d = await res.json();
      const url = String(d.url);
      onDone?.(url);
      if (!onDone) setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    setMsg(null);
    if (!imageUrl) return setMsg(tr(locale, "Please add image.", "Зураг оруулна уу."));

    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, imageUrl, sort }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
        return;
      }
      setImageUrl("");
      setSort(0);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const updateRow = async (id: string, patch: Partial<Row>) => {
    await fetch(`/api/admin/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm(tr(locale, "Delete this image?", "Энэ зургийг устгах уу?"))) return;
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="jazz-heading text-amber-200">
            {tr(locale, "Menu Assets", "Меню файлууд")}
          </p>
          <h1 className="jazz-heading text-4xl text-amber-50">
            {category === "drinks"
              ? tr(locale, "Drinks Menu", "Уух зүйлсийн меню")
              : tr(locale, "Food Menu", "Хоолны меню")}
          </h1>
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-black/20 px-4 py-3">
          <p className="text-xs font-semibold text-amber-100/70">{tr(locale, "TOTAL", "НИЙТ")}</p>
          <p className="text-2xl font-extrabold text-amber-50">{rows.length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-amber-300/25 bg-black/20 p-4 md:grid-cols-[1fr_240px]">
        <div>
          <p className="text-sm text-amber-100/75">{tr(locale, "Add image", "Зураг оруулах")}</p>

          <div className="mt-2 flex items-center gap-3">
            <input
              className="block w-full text-sm"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
            <span className="text-xs text-amber-100/70">
              {uploading ? tr(locale, "Uploading...", "Оруулж байна...") : ""}
            </span>
          </div>

          <input
            className="mt-3 h-11 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={tr(locale, "...or paste URL", "...эсвэл URL paste")}
          />

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm text-amber-100/75">{tr(locale, "Sort", "Дараалал")}</p>
              <input
                type="number"
                className="mt-2 h-11 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                value={sort}
                onChange={(e) => setSort(Number(e.target.value))}
              />
            </div>

            <button
              onClick={create}
              disabled={saving || uploading}
              className={cn(
                "mt-6 h-11 rounded-xl font-semibold transition",
                saving || uploading
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
              )}
            >
              {saving ? tr(locale, "Saving...", "Хадгалж байна...") : tr(locale, "Add", "Нэмэх")}
            </button>
          </div>

          {msg && <p className="mt-2 text-sm text-amber-100/80">{msg}</p>}
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-black/20 p-3">
          <p className="text-xs text-amber-100/70">{tr(locale, "Preview", "Урьдчилан харах")}</p>
          <div className="mt-2 h-44 overflow-hidden rounded-xl bg-black/30">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-amber-100/70">
                {tr(locale, "No image", "Зураг алга")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/20 shadow-sm"
          >
            <div className="h-56 w-full bg-black/30">
              <img
                src={r.imageUrl}
                alt="menu"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 grid gap-3">
              <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {tr(locale, "Replace image", "Зураг солих")}
                  </p>
                <input
                  className="mt-2 block w-full text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    upload(f, async (url) => {
                      await updateRow(r.id, { imageUrl: url });
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-[1fr_110px] gap-2 items-end">
                <div>
                  <p className="text-xs font-semibold text-amber-100/75">
                    {tr(locale, "Sort", "Дараалал")}
                  </p>
                  <input
                    type="number"
                    className="mt-2 h-10 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3 text-amber-50"
                    value={r.sort}
                    onChange={(e) =>
                      updateRow(r.id, { sort: Number(e.target.value) })
                    }
                  />
                </div>

                <button
                  onClick={() => remove(r.id)}
                  className="h-10 rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                >
                  {tr(locale, "Delete", "Устгах")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

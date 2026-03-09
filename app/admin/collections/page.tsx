/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import { uploadAdminImage } from "@/lib/client-image-upload";

type Category = {
  id: string;
  nameEn: string;
  nameMn: string;
  sort: number;
  isActive: boolean;
};

type Item = {
  id: string;
  categoryId: string;
  nameEn: string;
  nameMn: string;
  infoEn: string;
  infoMn: string;
  imageUrl: string | null;
  sort: number;
  isActive: boolean;
  updatedAt?: string;
};

type FormState = {
  nameEn: string;
  nameMn: string;
  infoEn: string;
  infoMn: string;
  imageUrl: string;
};

const emptyForm: FormState = {
  nameEn: "",
  nameMn: "",
  infoEn: "",
  infoMn: "",
  imageUrl: "",
};

const FIXED_TYPES = [
  { key: "dj", nameEn: "DJ", nameMn: "DJ" },
  { key: "artist", nameEn: "Artist", nameMn: "Artist" },
  { key: "band", nameEn: "Band", nameMn: "Band" },
] as const;

function normalizeTypeKey(nameEn: string, nameMn: string) {
  const raw = `${nameEn} ${nameMn}`.toLowerCase();
  if (raw.includes("dj")) return "dj";
  if (raw.includes("band") || raw.includes("хамтлаг")) return "band";
  if (raw.includes("artist") || raw.includes("уран")) return "artist";
  return null;
}

export default function AdminCollectionsPage() {
  const { locale } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [loadedOnce, setLoadedOnce] = useState(false);
  const bootstrapDoneRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/collections", { cache: "no-store" });
      if (!res.ok) {
        setMsg(tr(locale, "Failed to load collections.", "Collection уншихад алдаа гарлаа."));
        return;
      }
      const data = await res.json();
      setCategories((data.categories ?? []) as Category[]);
      setItems((data.items ?? []) as Item[]);
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForms((prev) => {
      const next: Record<string, FormState> = { ...prev };
      for (const c of categories) {
        if (!next[c.id]) next[c.id] = { ...emptyForm };
      }
      return next;
    });
  }, [categories]);

  const grouped = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const c of categories) map[c.id] = [];
    for (const i of items) {
      if (!map[i.categoryId]) map[i.categoryId] = [];
      map[i.categoryId].push(i);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sort - b.sort);
    }
    return map;
  }, [categories, items]);

  const setForm = (categoryId: string, key: keyof FormState, value: string) => {
    setForms((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] ?? emptyForm), [key]: value },
    }));
  };

  const uploadToCloudinary = async (file: File) => {
    return uploadAdminImage(file);
  };

  const uploadNewImage = async (categoryId: string, file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadToCloudinary(file);
      setForm(categoryId, "imageUrl", up.url);
      setMsg(tr(locale, "Image uploaded.", "Зураг амжилттай орлоо."));
    } catch (error) {
      setMsg(
        String((error as Error)?.message ?? "") ||
          tr(locale, "Image upload failed.", "Зураг оруулахад алдаа гарлаа."),
      );
    } finally {
      setUploading(false);
    }
  };

  const replaceImage = async (item: Item, file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadToCloudinary(file);
      await updateField(item, "imageUrl", up.url);
      setMsg(tr(locale, "Image replaced.", "Зураг солигдлоо."));
    } catch (error) {
      setMsg(
        String((error as Error)?.message ?? "") ||
          tr(locale, "Image upload failed.", "Зураг оруулахад алдаа гарлаа."),
      );
    } finally {
      setUploading(false);
    }
  };

  const createItem = async (categoryId: string) => {
    const f = forms[categoryId] ?? emptyForm;
    if (!f.nameEn.trim() || !f.nameMn.trim() || !f.infoEn.trim() || !f.infoMn.trim()) {
      setMsg(tr(locale, "Please fill all name/info fields.", "Нэр/тайлбарын бүх талбарыг бөглөнө үү."));
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          nameEn: f.nameEn,
          nameMn: f.nameMn,
          infoEn: f.infoEn,
          infoMn: f.infoMn,
          imageUrl: f.imageUrl,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || tr(locale, "Create item failed.", "Нэмэхэд алдаа гарлаа."));
        return;
      }
      setForms((prev) => ({ ...prev, [categoryId]: { ...emptyForm } }));
      setMsg(tr(locale, "Collection item created.", "Collection амжилттай нэмэгдлээ."));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryActive = async (category: Category) => {
    await fetch(`/api/admin/collections/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    await load();
  };

  const toggleActive = async (item: Item) => {
    await fetch(`/api/admin/collections/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await load();
  };

  const removeItem = async (id: string) => {
    if (!confirm(tr(locale, "Delete this item?", "Энэ мөрийг устгах уу?"))) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    await load();
  };

  const moveItem = async (categoryId: string, id: string, dir: "up" | "down") => {
    const rows = grouped[categoryId] ?? [];
    const index = rows.findIndex((x) => x.id === id);
    if (index < 0) return;

    const swapIndex = dir === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) return;

    const a = rows[index];
    const b = rows[swapIndex];

    await Promise.all([
      fetch(`/api/admin/collections/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: b.sort }),
      }),
      fetch(`/api/admin/collections/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: a.sort }),
      }),
    ]);
    await load();
  };

  const updateField = async (item: Item, key: keyof Item, value: string | boolean) => {
    const payload: Record<string, unknown> = { [key]: value };
    const res = await fetch(`/api/admin/collections/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setMsg(tr(locale, "Update failed.", "Шинэчлэхэд алдаа гарлаа."));
      return;
    }
    await load();
  };

  const typeSections = useMemo(() => {
    const byKey = new Map<string, Category>();
    for (const cat of categories) {
      const key = normalizeTypeKey(cat.nameEn, cat.nameMn);
      if (key && !byKey.has(key)) byKey.set(key, cat);
    }
    return FIXED_TYPES.map((type) => {
      const category = byKey.get(type.key) ?? null;
      return {
        ...type,
        category,
        items: category ? grouped[category.id] ?? [] : [],
      };
    });
  }, [categories, grouped]);

  const setupMissingTypes = async () => {
    const existing = new Set(
      categories
        .map((cat) => normalizeTypeKey(cat.nameEn, cat.nameMn))
        .filter(Boolean),
    );
    const missing = FIXED_TYPES.filter((type) => !existing.has(type.key));
    if (!missing.length) return;

    setSaving(true);
    setMsg(null);
    try {
      for (const type of missing) {
        await fetch("/api/admin/collections/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameEn: type.nameEn, nameMn: type.nameMn }),
        });
      }
      await load();
      setMsg(tr(locale, "DJ/Artist/Band types are ready.", "DJ/Artist/Band төрлүүд бэлэн боллоо."));
    } catch {
      setMsg(tr(locale, "Type setup failed.", "Төрөл үүсгэхэд алдаа гарлаа."));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loadedOnce || loading || bootstrapDoneRef.current || !categories) return;
    bootstrapDoneRef.current = true;
    void setupMissingTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedOnce, loading, categories]);

  const missingTypeCount = typeSections.filter((section) => !section.category).length;

  return (
    <section className="jazz-panel reservation-panel rounded-2xl p-6 md:p-8">
      <p className="jazz-heading text-sm uppercase tracking-[0.2em] text-amber-200">
        {tr(locale, "Content Studio", "Контент удирдлага")}
      </p>
      <h1 className="jazz-heading mt-2 text-4xl text-amber-50">
        {tr(locale, "Collections", "Collection")}
      </h1>
      {msg && (
        <p className="reservation-soft mt-3 rounded-xl px-3 py-2 text-sm text-amber-100/90">
          {msg}
        </p>
      )}

      <div className="reservation-soft mt-5 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-100">
          {tr(locale, "Performer Types", "Уран бүтээлчийн төрлүүд")}
        </p>
        <p className="mt-1 text-xs text-amber-100/80">
          {tr(
            locale,
            "Collections only use fixed types: DJ, Artist, Band.",
            "Collection зөвхөн DJ, Artist, Band гэсэн тогтмол төрлөөр ажиллана.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {FIXED_TYPES.map((type) => (
            <span
              key={`fixed-type-${type.key}`}
              className="rounded-full border border-amber-300/35 bg-black/20 px-3 py-1 text-xs font-semibold text-amber-100/90"
            >
              {locale === "mn" ? type.nameMn : type.nameEn}
            </span>
          ))}
          <button
            onClick={setupMissingTypes}
            disabled={saving || loading || missingTypeCount === 0}
            className="ger-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
          >
            {missingTypeCount === 0
              ? tr(locale, "Types Ready", "Төрлүүд бэлэн")
              : tr(locale, "Setup Missing Types", "Дутуу төрлийг үүсгэх")}
          </button>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-amber-100/85">{tr(locale, "Loading...", "Уншиж байна...")}</p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {typeSections.map((section) => {
          const category = section.category;
          const categoryId = category?.id ?? "";
          return (
          <article key={section.key} className="rounded-2xl border border-amber-300/30 bg-[linear-gradient(165deg,rgba(34,24,17,0.86)_0%,rgba(25,18,13,0.86)_100%)] p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="jazz-heading text-xl text-amber-50">
                {locale === "mn" ? section.nameMn : section.nameEn}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => category && toggleCategoryActive(category)}
                  disabled={!category}
                  className="ger-btn-secondary rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  {!category
                    ? tr(locale, "Preparing...", "Бэлдэж байна...")
                    : category.isActive
                      ? tr(locale, "Hide", "Нуух")
                      : tr(locale, "Show", "Харуулах")}
                </button>
              </div>
            </div>
            {!category ? (
              <p className="mt-2 text-xs text-amber-100/70">
                {tr(locale, "Type category is being prepared...", "Төрлийн category бэлтгэгдэж байна...")}
              </p>
            ) : null}
            <div className="mt-3 grid gap-2">
              <input
                className="h-10 rounded-xl px-3 text-sm text-amber-50"
                placeholder={tr(locale, "Name (EN)", "Нэр (EN)")}
                value={(forms[categoryId] ?? emptyForm).nameEn}
                onChange={(e) => categoryId && setForm(categoryId, "nameEn", e.target.value)}
                disabled={!categoryId}
              />
              <input
                className="h-10 rounded-xl px-3 text-sm text-amber-50"
                placeholder={tr(locale, "Name (MN)", "Нэр (MN)")}
                value={(forms[categoryId] ?? emptyForm).nameMn}
                onChange={(e) => categoryId && setForm(categoryId, "nameMn", e.target.value)}
                disabled={!categoryId}
              />
              <textarea
                rows={3}
                className="rounded-xl px-3 py-2 text-sm text-amber-50"
                placeholder={tr(locale, "Info (EN)", "Тайлбар (EN)")}
                value={(forms[categoryId] ?? emptyForm).infoEn}
                onChange={(e) => categoryId && setForm(categoryId, "infoEn", e.target.value)}
                disabled={!categoryId}
              />
              <textarea
                rows={3}
                className="rounded-xl px-3 py-2 text-sm text-amber-50"
                placeholder={tr(locale, "Info (MN)", "Тайлбар (MN)")}
                value={(forms[categoryId] ?? emptyForm).infoMn}
                onChange={(e) => categoryId && setForm(categoryId, "infoMn", e.target.value)}
                disabled={!categoryId}
              />
              <label className="ger-btn-secondary flex cursor-pointer items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold">
                {(forms[categoryId] ?? emptyForm).imageUrl
                  ? tr(locale, "Change Photo", "Зураг солих")
                  : tr(locale, "Upload Photo", "Зураг оруулах")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!categoryId}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && categoryId) void uploadNewImage(categoryId, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {(forms[categoryId] ?? emptyForm).imageUrl ? (
                <img
                  src={(forms[categoryId] ?? emptyForm).imageUrl}
                  alt="preview"
                  className="h-28 w-full rounded-xl border border-amber-300/30 object-cover"
                />
              ) : null}
              <button
                onClick={() => categoryId && createItem(categoryId)}
                disabled={saving || uploading || !categoryId}
                className="ger-btn-primary h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {tr(locale, "Add Item", "Нэмэх")}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {section.items.length === 0 && (
                <p className="text-xs text-amber-100/80">
                  {tr(locale, "No items yet.", "Одоогоор нэмэгдээгүй байна.")}
                </p>
              )}

              {section.items.map((item) => (
                <div key={`${item.id}:${item.updatedAt ?? ""}`} className="reservation-soft rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-amber-100/80">#{item.sort + 1}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => categoryId && moveItem(categoryId, item.id, "up")}
                        disabled={!categoryId}
                        className="ger-btn-secondary rounded-md px-2 py-0.5 text-xs font-semibold"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => categoryId && moveItem(categoryId, item.id, "down")}
                        disabled={!categoryId}
                        className="ger-btn-secondary rounded-md px-2 py-0.5 text-xs font-semibold"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <select
                      className="h-9 rounded-lg px-2 text-sm text-amber-50"
                      value={item.categoryId}
                      onChange={(e) =>
                        e.target.value !== item.categoryId &&
                        updateField(item, "categoryId", e.target.value)
                      }
                    >
                      {typeSections
                        .filter((s) => !!s.category)
                        .map((s) => (
                          <option key={`type-opt-${s.key}`} value={s.category!.id}>
                            {locale === "mn" ? s.nameMn : s.nameEn}
                          </option>
                        ))}
                    </select>
                    <input
                      className="h-9 rounded-lg px-2 text-sm text-amber-50"
                      onBlur={(e) => e.target.value !== item.nameEn && updateField(item, "nameEn", e.target.value)}
                      defaultValue={item.nameEn}
                    />
                    <input
                      className="h-9 rounded-lg px-2 text-sm text-amber-50"
                      onBlur={(e) => e.target.value !== item.nameMn && updateField(item, "nameMn", e.target.value)}
                      defaultValue={item.nameMn}
                    />
                    <textarea
                      rows={2}
                      className="rounded-lg px-2 py-1 text-sm text-amber-50"
                      defaultValue={item.infoEn}
                      onBlur={(e) => e.target.value !== item.infoEn && updateField(item, "infoEn", e.target.value)}
                    />
                    <textarea
                      rows={2}
                      className="rounded-lg px-2 py-1 text-sm text-amber-50"
                      defaultValue={item.infoMn}
                      onBlur={(e) => e.target.value !== item.infoMn && updateField(item, "infoMn", e.target.value)}
                    />
                    <div className="grid gap-2">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="h-24 w-full rounded-lg border border-amber-300/30 object-cover"
                        />
                      ) : null}
                      <label className="ger-btn-secondary flex cursor-pointer items-center justify-center rounded-lg px-2 py-1.5 text-xs font-semibold">
                        {tr(locale, "Replace Photo", "Зураг солих")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void replaceImage(item, file);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => toggleActive(item)}
                      className="ger-btn-secondary rounded-lg px-2.5 py-1 text-xs font-semibold"
                    >
                      {item.isActive
                        ? tr(locale, "Hide", "Нуух")
                        : tr(locale, "Show", "Харуулах")}
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg border border-rose-300/45 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/20"
                    >
                      {tr(locale, "Delete", "Устгах")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

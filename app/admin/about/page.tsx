/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import {
  AboutContent,
  Bilingual,
  defaultAboutContent,
  parseAboutContent,
} from "@/lib/about-content";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import AdminConfirmDialog from "@/app/components/admin-confirm-dialog";
import { uploadAdminImage } from "@/lib/client-image-upload";

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

type AboutDTO = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
};

export default function AdminAboutPage() {
  const { locale } = useLocale();
  const [raw, setRaw] = useState<AboutDTO | null>(null);
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/about", { cache: "no-store" });
    if (!res.ok) return setMsg("Load failed");
    const d = (await res.json()) as AboutDTO;
    setRaw(d);
    setContent(parseAboutContent(d.body));
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const up = await uploadAdminImage(file);
      return up.url;
    } catch (error) {
      const reason = String((error as Error)?.message || "Upload failed");
      console.error("[About upload] " + reason);
      setMsg(reason);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadHeaderImage = async (file: File) => {
    const url = await upload(file);
    if (!url) return;
    setRaw((p) => (p ? { ...p, imageUrl: url } : p));
  };

  const uploadGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const url = await upload(file);
      if (!url) continue;
      setContent((prev) => ({
        ...prev,
        gallery: [...prev.gallery, { imageUrl: url, text: { en: "", mn: "" } }],
      }));
    }
  };

  const replaceGalleryImage = async (index: number, file: File) => {
    const url = await upload(file);
    if (!url) return;
    setContent((prev) => ({
      ...prev,
      gallery: prev.gallery.map((img, i) =>
        i === index ? { ...img, imageUrl: url } : img,
      ),
    }));
  };

  const updateGalleryText = (index: number, field: "en" | "mn", value: string) => {
    setContent((prev) => ({
      ...prev,
      gallery: prev.gallery.map((item, i) =>
        i === index ? { ...item, text: { ...item.text, [field]: value } } : item,
      ),
    }));
  };

  const removeGallery = (index: number) => {
    setContent((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const askRemoveGallery = (index: number) => setDeleteIndex(index);
  const closeConfirm = () => setDeleteIndex(null);
  const runConfirm = () => {
    if (deleteIndex === null) return;
    const idx = deleteIndex;
    closeConfirm();
    removeGallery(idx);
  };

  const moveGallery = (index: number, dir: "left" | "right") => {
    setContent((prev) => {
      const target = dir === "left" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.gallery.length) return prev;
      const next = [...prev.gallery];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, gallery: next };
    });
  };

  const save = async () => {
    if (!raw) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: raw.title,
          imageUrl: raw.imageUrl,
          body: JSON.stringify(content),
        }),
      });
      if (!res.ok) return setMsg("Save failed");
      setMsg("✅ Saved");
    } finally {
      setSaving(false);
    }
  };

  if (!raw) {
    return (
      <section className="jazz-panel rounded-2xl p-6">
        <p className="text-sm text-amber-100/80">{msg ?? "Loading..."}</p>
      </section>
    );
  }

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <p className="jazz-heading text-amber-200">Content</p>
      <h1 className="jazz-heading text-4xl text-amber-50">About Us</h1>

      <div className="mt-6 grid gap-5">
        <Field label="Page Title">
          <input
            className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
            value={raw.title}
            onChange={(e) => setRaw({ ...raw, title: e.target.value })}
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <div>
            <Field label="Header Image">
              <input
                className="block w-full text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadHeaderImage(f);
                  e.currentTarget.value = "";
                }}
              />
              <p className="mt-2 text-xs text-amber-100/70">
                {uploading ? "Uploading..." : ""}
              </p>
            </Field>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-300/30 bg-black/20">
            {raw.imageUrl ? (
              <img src={raw.imageUrl} alt="about" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center text-xs text-amber-100/70">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
          <p className="text-sm text-amber-100/75">About Gallery Images</p>

          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-3">
              <input
                className="block w-full text-sm"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  void uploadGalleryFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />

              <p className="text-xs text-amber-100/65">
                Upload many photos at once, then reorder them to control how they appear on
                the About page.
              </p>

              {msg && <p className="text-sm text-amber-100/85">{msg}</p>}
            </div>

            <div className="rounded-xl border border-amber-300/25 bg-black/25 p-3">
              <p className="text-xs text-amber-100/70">Total Gallery Images</p>
              <p className="mt-1 text-3xl font-bold text-amber-50">{content.gallery.length}</p>
              <p className="mt-1 text-xs text-amber-100/65">Saved with the About page content.</p>
            </div>
          </div>

          {content.gallery.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {content.gallery.map((item, index) => (
                <div
                  key={`${item.imageUrl}-${index}`}
                  className="overflow-hidden rounded-2xl border border-amber-300/25 bg-black/20"
                >
                  <div className="h-40 bg-black/30">
                    <img
                      src={item.imageUrl}
                      alt={`about-gallery-${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="grid gap-2 p-3">
                    <input
                      className="block w-full text-xs text-amber-100/90"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        void replaceGalleryImage(index, f);
                        e.currentTarget.value = "";
                      }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => moveGallery(index, "left")}
                        disabled={index === 0}
                        className={cn(
                          "h-9 rounded-lg border border-amber-300/35 text-xs font-semibold text-amber-50 transition",
                          index === 0 ? "opacity-50" : "hover:bg-amber-300/15",
                        )}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGallery(index, "right")}
                        disabled={index === content.gallery.length - 1}
                        className={cn(
                          "h-9 rounded-lg border border-amber-300/35 text-xs font-semibold text-amber-50 transition",
                          index === content.gallery.length - 1
                            ? "opacity-50"
                            : "hover:bg-amber-300/15",
                        )}
                      >
                        Right
                      </button>
                      <button
                        type="button"
                        onClick={() => askRemoveGallery(index)}
                        className="h-9 rounded-lg border border-amber-300/35 text-xs font-semibold text-amber-50 transition hover:bg-amber-300/15"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="h-9 rounded-lg border border-amber-300/35 bg-black/30 px-2 text-xs text-amber-50"
                        value={item.text.en}
                        onChange={(e) =>
                          updateGalleryText(index, "en", e.target.value)
                        }
                        placeholder="Overlay text (EN)"
                      />
                      <input
                        className="h-9 rounded-lg border border-amber-300/35 bg-black/30 px-2 text-xs text-amber-50"
                        value={item.text.mn}
                        onChange={(e) =>
                          updateGalleryText(index, "mn", e.target.value)
                        }
                        placeholder="Overlay text (MN)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex h-28 items-center justify-center rounded-2xl border border-dashed border-amber-300/25 bg-black/20 text-sm text-amber-100/70">
              No gallery images yet
            </div>
          )}
        </div>

        <BilingualField
          label="Intro"
          value={content.intro}
          rows={3}
          onChange={(v) => setContent({ ...content, intro: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Story Heading"
            value={content.storyHeading}
            onChange={(v) => setContent({ ...content, storyHeading: v })}
          />
          <BilingualField
            label="Vibe Heading"
            value={content.vibeHeading}
            onChange={(v) => setContent({ ...content, vibeHeading: v })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Story Body"
            value={content.storyBody}
            rows={6}
            onChange={(v) => setContent({ ...content, storyBody: v })}
          />
          <BilingualField
            label="Vibe Body"
            value={content.vibeBody}
            rows={6}
            onChange={(v) => setContent({ ...content, vibeBody: v })}
          />
        </div>

        <BilingualField
          label="Quote"
          value={content.quote}
          onChange={(v) => setContent({ ...content, quote: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Details Heading"
            value={content.detailsHeading}
            onChange={(v) => setContent({ ...content, detailsHeading: v })}
          />
          <BilingualField
            label="Contact"
            value={content.contact}
            onChange={(v) => setContent({ ...content, contact: v })}
          />
        </div>

        <BilingualField
          label="Details Body"
          value={content.detailsBody}
          rows={3}
          onChange={(v) => setContent({ ...content, detailsBody: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Address"
            value={content.address}
            onChange={(v) => setContent({ ...content, address: v })}
          />
          <BilingualField
            label="Hours"
            value={content.hours}
            onChange={(v) => setContent({ ...content, hours: v })}
          />
        </div>

        <button
          onClick={save}
          disabled={saving || uploading}
          className={cn(
            "h-11 rounded-xl font-semibold transition",
            saving || uploading
              ? "bg-neutral-200 text-neutral-500"
              : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
          )}
        >
          {saving ? "Saving..." : "Save About Page"}
        </button>

        {msg && <p className="text-sm text-amber-100/80">{msg}</p>}
      </div>
      <AdminConfirmDialog
        open={deleteIndex !== null}
        locale={locale}
        title={tr(locale, "Delete this image?", "Энэ зургийг устгах уу?")}
        body={tr(
          locale,
          "This About gallery image will be permanently deleted.",
          "Энэ About gallery зураг бүр мөсөн устна.",
        )}
        tone="red"
        confirmLabel={tr(locale, "Delete", "Устгах")}
        cancelLabel={tr(locale, "Back", "Буцах")}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      />
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-amber-100/75">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  rows?: number;
}) {
  const cls =
    "w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2 text-amber-50";

  return (
    <div className="grid gap-2">
      <p className="text-sm text-amber-100/75">{label}</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-amber-100/60">EN</p>
          {rows ? (
            <textarea
              rows={rows}
              className={cls}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          ) : (
            <input
              className={`h-11 ${cls}`}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs text-amber-100/60">MN</p>
          {rows ? (
            <textarea
              rows={rows}
              className={cls}
              value={value.mn}
              onChange={(e) => onChange({ ...value, mn: e.target.value })}
            />
          ) : (
            <input
              className={`h-11 ${cls}`}
              value={value.mn}
              onChange={(e) => onChange({ ...value, mn: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

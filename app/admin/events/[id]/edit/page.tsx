/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/app/components/use-locale";
import { tr } from "@/lib/i18n";
import { uploadAdminImage } from "@/lib/client-image-upload";
import {
  combineDateAndTime,
  toDateInput,
  toTimeInput,
} from "@/lib/datetime";

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

type EventDTO = {
  id: string;
  title: string;
  description: string | null;
  djName: string | null;
  djType: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
};

export default function AdminEditEventPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<EventDTO | null>(null);
  const [startsDate, setStartsDate] = useState("");
  const [startsTime, setStartsTime] = useState("");
  const [endsDate, setEndsDate] = useState("");
  const [endsTime, setEndsTime] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      setMsg(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/events/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setMsg(tr(locale, "Event not found", "Эвент олдсонгүй"));
          setForm(null);
          return;
        }
        const data = (await res.json()) as EventDTO;
        setForm(data);
        setStartsDate(toDateInput(data.startsAt));
        setStartsTime(toTimeInput(data.startsAt));
        setEndsDate(toDateInput(data.endsAt));
        setEndsTime(toTimeInput(data.endsAt));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, locale]);

  const uploadImage = async (file: File) => {
    setUploadMsg(null);
    setUploading(true);

    try {
      const up = await uploadAdminImage(file);
      setUploadMsg("✅ Image uploaded");
      return up.url;
    } catch (error) {
      setUploadMsg(
        String((error as Error)?.message ?? "") ||
          tr(locale, "Upload failed", "Зураг оруулахад алдаа гарлаа"),
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = async (f?: File | null) => {
    if (!f) return;
    if (!form) return;

    if (!f.type.startsWith("image/")) {
      setUploadMsg(tr(locale, "Please select an image file (png/jpg/webp...)", "Зөвхөн зураг сонгоно уу (png/jpg/webp...)"));
      return;
    }

    const url = await uploadImage(f);
    if (!url) return;

    setForm({ ...form, imageUrl: url });
  };

  const update = async () => {
    if (!form || !id) return;

    setMsg(null);
    const startsAt = combineDateAndTime(startsDate, startsTime);
    const endsAt =
      endsTime && (endsDate || startsDate)
        ? combineDateAndTime(endsDate || startsDate, endsTime)
        : "";

    if (!form.title.trim()) return setMsg(tr(locale, "Title required", "Гарчиг заавал оруулна"));
    if (!startsAt) return setMsg(tr(locale, "Starts at is required", "Эхлэх цаг заавал оруулна"));

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description?.trim() || null,
          djName: form.djName?.trim() || null,
          djType: form.djType?.trim() || null,
          imageUrl: form.imageUrl?.trim() || null,
          price: Number(form.price),
          currency: form.currency,
          startsAt,
          endsAt: endsAt || null,
          isPublished: !!form.isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data?.message || tr(locale, "Update failed", "Шинэчлэхэд алдаа гарлаа"));
        return;
      }

      router.refresh();
      setMsg(tr(locale, "✅ Saved", "✅ Хадгаллаа"));
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!id) return;
    if (!confirm(tr(locale, "Delete this event?", "Энэ эвентийг устгах уу?"))) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setMsg(tr(locale, "Delete failed", "Устгахад алдаа гарлаа"));
        return;
      }
      router.push("/admin/events");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <section className="jazz-panel mx-auto max-w-2xl rounded-2xl p-6">
        <p className="font-semibold text-amber-50">{tr(locale, "Invalid id", "Буруу id")}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="jazz-panel mx-auto max-w-2xl rounded-2xl p-6 text-amber-100/80">
        {tr(locale, "Loading...", "Уншиж байна...")}
      </section>
    );
  }

  if (!form) {
    return (
      <section className="jazz-panel mx-auto max-w-2xl rounded-2xl p-6">
        <p className="font-semibold text-amber-50">{tr(locale, "Event not found", "Эвент олдсонгүй")}</p>
        <p className="mt-2 text-sm text-amber-100/75">{msg}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-1 py-2">
      <div className="jazz-panel rounded-2xl p-6">
          <p className="jazz-heading text-amber-200">{tr(locale, "Management", "Удирдлага")}</p>
          <h1 className="jazz-heading text-4xl text-amber-50">{tr(locale, "Edit Event", "Эвент засах")}</h1>
          <p className="mt-1 text-sm text-amber-100/75">
            ID: <span className="font-mono">{form.id}</span>
          </p>

          <div className="mt-6 grid gap-4">
            <Field label={tr(locale, "Event title", "Эвент нэр")}>
              <input
                className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>

            <Field label={tr(locale, "Description", "Мэдээлэл")}>
              <textarea
                className="w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2 text-amber-50"
                rows={4}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>

            <Field label={tr(locale, "DJ name", "DJ нэр")}>
              <input
                className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                value={form.djName ?? ""}
                onChange={(e) => setForm({ ...form, djName: e.target.value })}
                placeholder={tr(locale, "DJ name...", "DJ нэр...")}
              />
            </Field>

            <Field label={tr(locale, "DJ type", "DJ төрөл")}>
              <input
                className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                value={form.djType ?? ""}
                onChange={(e) => setForm({ ...form, djType: e.target.value })}
                placeholder={tr(locale, "Afro House / Techno / Hip Hop...", "Afro House / Techno / Hip Hop...")}
              />
            </Field>

            <Field label={tr(locale, "Image", "Зураг")}>
              <div className="grid gap-3">
                {form.imageUrl ? (
                  <div className="overflow-hidden rounded-2xl border">
                    <img
                      src={form.imageUrl}
                      alt="event"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-amber-300/25 bg-black/20 text-sm text-amber-100/70">
                    {tr(locale, "No image", "Зураг алга")}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "h-11 rounded-xl px-4 text-sm font-semibold transition",
                        uploading
                          ? "bg-neutral-200 text-neutral-500"
                          : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
                    )}
                  >
                    {uploading
                      ? tr(locale, "Uploading...", "Оруулж байна...")
                      : tr(locale, "Upload image", "Зураг оруулах")}
                  </button>

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => setForm({ ...form, imageUrl: null })}
                    className="h-11 rounded-xl border border-amber-300/40 px-4 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                  >
                    {tr(locale, "Remove", "Хасах")}
                  </button>
                </div>

                {uploadMsg && (
                  <p className="text-sm text-amber-100/75">{uploadMsg}</p>
                )}
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Price">
                <input
                  type="number"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </Field>

              <Field label={tr(locale, "Currency", "Валют")}>
                <input
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={tr(locale, "Starts date", "Эхлэх өдөр")}>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={startsDate}
                  onChange={(e) => setStartsDate(e.target.value)}
                />
              </Field>

              <Field label={tr(locale, "Starts time", "Эхлэх цаг")}>
                <input
                  type="time"
                  step={300}
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={startsTime}
                  onChange={(e) => setStartsTime(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={tr(locale, "Ends date", "Дуусах өдөр")}>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={endsDate}
                  onChange={(e) => setEndsDate(e.target.value)}
                />
              </Field>

              <Field label={tr(locale, "Ends time", "Дуусах цаг")}>
                <input
                  type="time"
                  step={300}
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={endsTime}
                  onChange={(e) => setEndsTime(e.target.value)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-amber-100">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
              />
              {tr(locale, "Published", "Нийтэлсэн")}
            </label>

            <button
              type="button"
              onClick={update}
              disabled={saving || uploading}
              className={cn(
                "h-11 w-full rounded-xl font-semibold transition",
                saving || uploading
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
              )}
            >
              {saving
                ? tr(locale, "Saving...", "Хадгалж байна...")
                : tr(locale, "Save changes", "Өөрчлөлт хадгалах")}
            </button>

            <button
              type="button"
              onClick={del}
              disabled={saving || uploading}
              className="h-11 w-full rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
            >
              {tr(locale, "Delete event", "Эвент устгах")}
            </button>

            {msg && <p className="text-sm text-amber-100/75">{msg}</p>}
          </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-amber-100/75">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

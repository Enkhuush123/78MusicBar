"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useLocale } from "@/app/components/use-locale";
import { tr } from "@/lib/i18n";
import { uploadAdminImage } from "@/lib/client-image-upload";

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

export default function AdminNewEventPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState("MNT");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setMsg(null);
    setUploading(true);
    try {
      const up = await uploadAdminImage(file);
      setImageUrl(up.url);
    } catch (error) {
      setMsg(
        String((error as Error)?.message ?? "") ||
          tr(locale, "Upload failed", "Зураг оруулахад алдаа гарлаа"),
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setMsg(null);
    if (!title.trim()) return setMsg(tr(locale, "Title required", "Гарчиг заавал оруулна"));
    if (!startsAt) return setMsg(tr(locale, "Starts at is required", "Эхлэх цаг заавал оруулна"));

    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          price,
          currency,
          startsAt,
          endsAt: endsAt || null,
          isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data?.message || tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
        return;
      }

      router.push("/admin/events");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-1 py-2">
      <div className="jazz-panel rounded-2xl p-6">
          <p className="jazz-heading text-amber-200">{tr(locale, "Management", "Удирдлага")}</p>
          <h1 className="jazz-heading text-4xl text-amber-50">{tr(locale, "New Event", "Шинэ эвент")}</h1>
          <p className="mt-1 text-sm text-amber-100/80">
            {tr(locale, "Create a new event here.", "Эндээс шинэ эвент үүсгэнэ.")}
          </p>

          <div className="mt-6 grid gap-4">
            <Field label={tr(locale, "Event title", "Эвент нэр")}>
                <input
                className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr(locale, "Event title...", "Эвент нэр...")}
              />
            </Field>

            <Field label={tr(locale, "Description", "Мэдээлэл")}>
                <textarea
                className="w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2 text-amber-50"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tr(locale, "Short description...", "Товч мэдээлэл...")}
              />
            </Field>

            <Field label={tr(locale, "Event image", "Эвентийн зураг")}>
              <div className="grid gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                      "h-11 rounded-xl border px-4 text-sm font-semibold transition",
                      uploading
                        ? "bg-neutral-200 text-neutral-500"
                        : "border-amber-300/40 text-amber-50 hover:bg-amber-300/15",
                    )}
                  >
                    {uploading
                      ? tr(locale, "Uploading...", "Оруулж байна...")
                      : tr(locale, "Upload image", "Зураг оруулах")}
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="h-11 rounded-xl border border-amber-300/40 px-4 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                    >
                      {tr(locale, "Remove", "Хасах")}
                    </button>
                  )}
                </div>

                {imageUrl ? (
                  <div className="overflow-hidden rounded-2xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <p>{tr(locale, "No image selected", "Зураг оруулаагүй байна")}</p>
                )}
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Price">
                <input
                  type="number"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </Field>

              <Field label={tr(locale, "Currency", "Валют")}>
                <input
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Starts At">
                <input
                  type="datetime-local"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </Field>

              <Field label="Ends At (optional)">
                <input
                  type="datetime-local"
                  className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-amber-100">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              {tr(locale, "Publish", "Нийтлэх")}
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={loading || uploading}
              className={cn(
                "h-11 w-full rounded-xl font-semibold transition",
                loading || uploading
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
              )}
            >
              {loading ? tr(locale, "Saving...", "Хадгалж байна...") : tr(locale, "Save", "Хадгалах")}
            </button>

            {msg && <p className="text-sm text-amber-100/80">{msg}</p>}
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

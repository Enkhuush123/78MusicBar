/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import AdminConfirmDialog from "@/app/components/admin-confirm-dialog";

type Row = {
  id: string;
  category: "drinks" | "food";
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

type SpecialRow = {
  id: string;
  name: string;
  ingredients: string;
  imageUrl: string;
  sort: number;
  isActive: boolean;
};

type DeleteDialogState = {
  open: boolean;
  kind: "menu" | "special" | null;
  id: string | null;
  title: string;
  body: string;
};

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2560;

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

export default function AdminMenuPage() {
  const { locale } = useLocale();
  const params = useParams<{ category: "drinks" | "food" }>();
  const category = params.category;
  const isUnifiedMenu = category === "drinks";

  const [rows, setRows] = useState<Row[]>([]);
  const [specials, setSpecials] = useState<SpecialRow[]>([]);
  const [sort, setSort] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [specialName, setSpecialName] = useState("");
  const [specialIngredients, setSpecialIngredients] = useState("");
  const [specialImageUrl, setSpecialImageUrl] = useState("");
  const [specialSort, setSpecialSort] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    kind: null,
    id: null,
    title: "",
    body: "",
  });

  const load = async () => {
    setMsg(null);
    const res = await fetch(
      `/api/admin/menu?category=${isUnifiedMenu ? "all" : category}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok)
      return setMsg(tr(locale, "Load failed", "Уншихад алдаа гарлаа"));
    setRows(await res.json());

    setSpecials([]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const upload = async (file: File, onDone?: (url: string) => void) => {
    setUploading(true);
    setMsg(null);
    try {
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
        setMsg(
          d?.message ||
            tr(locale, "Upload failed", "Зураг оруулахад алдаа гарлаа"),
        );
        return;
      }
      const d = await res.json();
      const url = String(d.url);
      onDone?.(url);
      if (!onDone) setImageUrl(url);
    } catch (error) {
      setMsg(
        String((error as Error)?.message || "") ||
          tr(locale, "Upload failed", "Зураг оруулахад алдаа гарлаа"),
      );
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    setMsg(null);
    if (!imageUrl)
      return setMsg(tr(locale, "Please add image.", "Зураг оруулна уу."));

    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: isUnifiedMenu ? "drinks" : category,
          imageUrl,
          sort,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(
          d?.message || tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"),
        );
        return;
      }
      setImageUrl("");
      setSort(0);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const createSpecial = async () => {
    setMsg(null);
    if (!specialName.trim())
      return setMsg(
        tr(locale, "Please add cocktail name.", "Коктейлийн нэр оруулна уу."),
      );
    if (!specialIngredients.trim())
      return setMsg(
        tr(locale, "Please add ingredients.", "Орцын мэдээлэл оруулна уу."),
      );
    if (!specialImageUrl.trim())
      return setMsg(tr(locale, "Please add image.", "Зураг оруулна уу."));

    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu/drinks-specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: specialName.trim(),
          ingredients: specialIngredients.trim(),
          imageUrl: specialImageUrl.trim(),
          sort: specialSort,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(
          d?.message || tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"),
        );
        return;
      }

      setSpecialName("");
      setSpecialIngredients("");
      setSpecialImageUrl("");
      setSpecialSort(0);
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

  const updateSpecial = async (id: string, patch: Partial<SpecialRow>) => {
    await fetch(`/api/admin/menu/drinks-specials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    await load();
  };

  const removeSpecial = async (id: string) => {
    await fetch(`/api/admin/menu/drinks-specials/${id}`, { method: "DELETE" });
    await load();
  };

  const askRemoveMenu = (id: string) => {
    setDeleteDialog({
      open: true,
      kind: "menu",
      id,
      title: tr(locale, "Delete this image?", "Энэ зургийг устгах уу?"),
      body: tr(
        locale,
        "This menu image will be permanently deleted.",
        "Энэ меню зураг бүр мөсөн устна.",
      ),
    });
  };

  const askRemoveSpecial = (id: string) => {
    setDeleteDialog({
      open: true,
      kind: "special",
      id,
      title: tr(locale, "Delete this cocktail?", "Энэ коктейлийг устгах уу?"),
      body: tr(
        locale,
        "This special cocktail row will be permanently deleted.",
        "Энэ онцлох коктейлийн мөр бүр мөсөн устна.",
      ),
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      kind: null,
      id: null,
      title: "",
      body: "",
    });
  };

  const runDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.kind) return closeDeleteDialog();
    const id = deleteDialog.id;
    const kind = deleteDialog.kind;
    closeDeleteDialog();
    if (kind === "special") {
      await removeSpecial(id);
      return;
    }
    await remove(id);
  };

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="jazz-heading text-amber-200">
            {tr(locale, "Menu Assets", "Меню файлууд")}
          </p>
          <h1 className="jazz-heading text-4xl text-amber-50">
            {isUnifiedMenu
              ? tr(locale, "Menu", "Меню")
              : tr(locale, "Food Menu", "Хоолны меню")}
          </h1>
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-black/20 px-4 py-3">
          <p className="text-xs font-semibold text-amber-100/70">
            {tr(locale, "TOTAL", "НИЙТ")}
          </p>
          <p className="text-2xl font-extrabold text-amber-50">{rows.length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-amber-300/25 bg-black/20 p-4 md:grid-cols-[1fr_240px]">
        <div>
          <p className="text-sm text-amber-100/75">
            {tr(locale, "Add image", "Зураг оруулах")}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <input
              className="block w-full text-sm"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  upload(f);
                  e.currentTarget.value = "";
                }
              }}
            />
            <span className="text-xs text-amber-100/70">
              {uploading ? tr(locale, "Uploading...", "Оруулж байна...") : ""}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-100/70">
            {imageUrl
              ? tr(locale, "Image ready. Click Add.", "Зураг бэлэн. Нэмэх дарна уу.")
              : tr(locale, "Select image to upload.", "Зургаа сонгож оруулна уу.")}
          </p>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm text-amber-100/75">
                {tr(locale, "Sort", "Дараалал")}
              </p>
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
              {saving
                ? tr(locale, "Saving...", "Хадгалж байна...")
                : tr(locale, "Add", "Нэмэх")}
            </button>
          </div>

          {msg && <p className="mt-2 text-sm text-amber-100/80">{msg}</p>}
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-black/20 p-3">
          <p className="text-xs text-amber-100/70">
            {tr(locale, "Preview", "Урьдчилан харах")}
          </p>
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
                    e.currentTarget.value = "";
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
                  onClick={() => askRemoveMenu(r.id)}
                  className="h-10 rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-50 hover:bg-amber-300/15 transition"
                >
                  {tr(locale, "Delete", "Устгах")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <AdminConfirmDialog
        open={deleteDialog.open}
        locale={locale}
        title={deleteDialog.title}
        body={deleteDialog.body}
        tone="red"
        confirmLabel={tr(locale, "Delete", "Устгах")}
        cancelLabel={tr(locale, "Back", "Буцах")}
        onCancel={closeDeleteDialog}
        onConfirm={() => void runDelete()}
      />
    </section>
  );
}

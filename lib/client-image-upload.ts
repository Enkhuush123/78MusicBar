export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
export const TARGET_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 2560;

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

export async function optimizeImageForUpload(file: File) {
  const unsupportedHeic =
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    /\.(heic|heif)$/i.test(file.name);
  if (unsupportedHeic) {
    throw new Error("HEIC image is not supported. Please upload JPG/PNG/WebP.");
  }

  const compressible = /image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  if (!compressible) {
    if (file.size > TARGET_UPLOAD_BYTES) {
      throw new Error("Please upload JPG/PNG/WebP under 8MB.");
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
    throw new Error("Image is still too large after optimization. Please crop/resize and retry.");
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

export async function uploadAdminImage(file: File) {
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
    const data = await res.json().catch(() => ({}));
    throw new Error(String(data?.message ?? "Upload failed"));
  }

  const data = (await res.json()) as { url?: string };
  const url = String(data?.url ?? "").trim();
  if (!url) throw new Error("Upload failed");

  return { url, sourceBytes: file.size, uploadBytes: optimized.size };
}

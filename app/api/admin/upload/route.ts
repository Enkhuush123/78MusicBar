/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
const SIMPLE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const CHUNKED_UPLOAD_BYTES = 6 * 1024 * 1024;

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof e.message === "string" && e.message.trim()) return e.message;
    if (typeof e.error?.message === "string" && e.error.message.trim()) {
      return e.error.message;
    }
  }
  return "unknown error";
}

function getErrorStatus(error: unknown) {
  const msg = getErrorMessage(error).toLowerCase();
  if (msg.includes("file size too large")) return 413;
  if (msg.includes("payload too large")) return 413;
  if (msg.includes("requested resource too large")) return 413;
  if (msg.includes("too large")) return 413;
  return 500;
}

async function readImageBytes(req: Request) {
  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  const fallbackReq = req.clone();

  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return { error: "file is required", status: 400 } as const;
      if (!file.type.startsWith("image/")) {
        return { error: "Only image uploads are allowed", status: 400 } as const;
      }
      return { bytes: Buffer.from(await file.arrayBuffer()) } as const;
    } catch {
      // Fall back to raw body parsing below.
    }
  }

  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await fallbackReq.arrayBuffer());
    if (!bytes.length) return { error: "file is required", status: 400 } as const;
    return { bytes } as const;
  }

  if (contentType.includes("multipart/form-data")) {
    return { error: "Failed to parse body as FormData.", status: 400 } as const;
  }

  return {
    error: "Unsupported content type. Use multipart/form-data or image/* body.",
    status: 400,
  } as const;
}

async function uploadImageToCloudinary(bytes: Buffer) {
  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const done = (
      error?: unknown,
      result?: { secure_url?: string; public_id?: string } | null,
    ) => {
      if (error) return reject(error);
      if (!result?.secure_url || !result.public_id) {
        return reject(new Error("Cloudinary upload returned empty result"));
      }
      resolve({
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
    };

    const uploadOptions = {
      folder: "78musicbar/menu",
      resource_type: "image" as const,
    };

    const stream =
      bytes.length > SIMPLE_UPLOAD_LIMIT_BYTES
        ? cloudinary.uploader.upload_chunked_stream({
            ...uploadOptions,
            chunk_size: CHUNKED_UPLOAD_BYTES,
          }, done)
        : cloudinary.uploader.upload_stream(uploadOptions, done);

    stream.end(bytes);
  });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e: any) {
    const digest = String(e?.digest ?? e?.message ?? "");
    if (digest.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const missing = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ].filter((k) => !process.env[k]);
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Missing env: ${missing.join(", ")}` },
        { status: 500 },
      );
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
    });

    const input = await readImageBytes(req);
    if ("error" in input) {
      return NextResponse.json({ message: input.error }, { status: input.status });
    }

    const uploaded = await uploadImageToCloudinary(input.bytes);

    return NextResponse.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (e: any) {
    const reason = getErrorMessage(e);
    console.error("[/api/admin/upload] upload failed:", reason);
    return NextResponse.json(
      {
        message: `upload failed: ${reason}`,
      },
      { status: getErrorStatus(e) },
    );
  }
}

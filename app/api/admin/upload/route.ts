/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/admin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file)
      return NextResponse.json(
        { message: "file is required" },
        { status: 400 },
      );

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "78musicbar/menu", resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      stream.end(bytes);
    });

    return NextResponse.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (e: any) {
    if (String(e?.message) === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message: "upload failed" }, { status: 500 });
  }
}

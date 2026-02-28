import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const rows = await prisma.review.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      displayName: true,
      comment: true,
      rating: true,
      createdAt: true,
    },
  });

  return Response.json(rows);
}

export async function POST(req: Request) {
  let user = getSupabaseUserFromRequest(req);

  if (!user?.id || !user?.email) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );
    const { data } = await supabase.auth.getUser();
    if (data.user?.id && data.user?.email) {
      user = { id: data.user.id, email: data.user.email, phone: undefined };
    }
  }

  if (!user?.id || !user?.email) {
    return Response.json({ message: "Login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const comment = String(body?.comment ?? "").trim();
  const rating = Number(body?.rating ?? 5);

  if (comment.length < 6) {
    return Response.json(
      { message: "Comment must be at least 6 characters" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ message: "Rating must be 1-5" }, { status: 400 });
  }

  const displayName = user.email.split("@")[0];
  const created = await prisma.review.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      displayName,
      comment,
      rating,
      isApproved: false,
    },
  });

  return Response.json(
    { id: created.id, message: "Submitted for approval" },
    { status: 201 },
  );
}

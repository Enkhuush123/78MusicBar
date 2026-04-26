import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/auth";
import { publicReservationTitle } from "@/lib/daily-reservation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
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
      user = {
        id: data.user.id,
        email: data.user.email,
        phone:
          (data.user.user_metadata?.phone as string | undefined) ||
          (data.user.phone as string | undefined),
      };
    }
  }

  if (!user?.id && !user?.email) {
    return Response.json({ message: "Login required" }, { status: 401 });
  }

  const rows = await prisma.reservation.findMany({
    where: {
      OR: [
        ...(user?.id ? [{ userId: user.id }] : []),
        ...(user?.email ? [{ userEmail: user.email }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      tableNo: true,
      guests: true,
      reservedFor: true,
      surchargeAmount: true,
      status: true,
      createdAt: true,
      note: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          venue: true,
          price: true,
          currency: true,
          imageUrl: true,
        },
      },
    },
  });

  return Response.json(
    rows.map((row) => ({
      ...row,
      event: row.event
        ? {
            ...row.event,
            title: publicReservationTitle(row.event) ?? row.event.title,
          }
        : null,
    })),
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}

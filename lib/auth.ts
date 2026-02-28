/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";

export function getSupabaseUserFromRequest(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    return {
      id: payload?.sub as string | undefined,
      email: payload?.email as string | undefined,
      phone:
        (payload?.user_metadata?.phone as string | undefined) ||
        (payload?.phone as string | undefined),
    };
  } catch {
    return null;
  }
}

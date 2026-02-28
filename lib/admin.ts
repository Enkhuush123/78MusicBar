import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
      },
    },
  );
}

export async function requireAdmin() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase().trim() ?? "";

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email) redirect("/");
  if (allow.length === 0) redirect("/");
  if (!allow.includes(email)) redirect("/");

  return { email };
}

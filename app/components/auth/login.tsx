"use client";

import { useEffect, useState } from "react";
import { supabase as supabaseClient } from "@/lib/supabase/browser";
import { X } from "lucide-react";
import { Locale, tr } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
};

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

export function LoginModal({ open, onClose, locale }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMsg(null);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setPassword("");
    setPhone("");
    setMode("login");
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setMsg(null);
    setLoading(true);

    try {
      const e = email.trim();
      const p = password;

      if (!e || !p) {
        setMsg(tr(locale, "Email and password are required.", "Имэйл болон нууц үг заавал."));
        return;
      }

      if (mode === "login") {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: e,
          password: p,
        });

        if (error) {
          setMsg(error.message);
          return;
        }

        onClose();
        return;
      }

      const { error } = await supabaseClient.auth.signUp({
        email: e,
        password: p,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { phone: phone.trim() || null },
        },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg(
        tr(
          locale,
          "Signup complete. Please verify from your email.",
          "✅ Бүртгэл амжилттай. Имэйлээ шалгаад баталгаажуулна уу.",
        ),
      );
      setMode("login");
    } catch (err) {
      console.error(err);
      setMsg(
        tr(
          locale,
          "Network error. Supabase URL/KEY may be invalid or blocked.",
          "Сүлжээний алдаа. Supabase URL/KEY эсвэл network блоклогдсон байж магадгүй.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-300/30 bg-[#120e0b] text-amber-50 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="jazz-heading text-4xl text-amber-100">
                  {mode === "login"
                    ? tr(locale, "Login", "Нэвтрэх")
                    : tr(locale, "Sign Up", "Бүртгүүлэх")}
                </h2>
                <p className="mt-1 text-sm text-amber-100/75">
                  {tr(
                    locale,
                    "Login to make reservations with your account.",
                    "Захиалга хийхийн тулд account-оороо нэвтэрнэ.",
                  )}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg border border-amber-300/30 p-2 hover:bg-amber-300/15 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 rounded-xl border border-amber-300/25 p-1">
              <button
                className={cn(
                  "h-10 rounded-lg text-sm font-medium transition",
                  mode === "login"
                    ? "bg-amber-300 text-neutral-900"
                    : "hover:bg-amber-300/15",
                )}
                onClick={() => setMode("login")}
                type="button"
              >
                {tr(locale, "Login", "Нэвтрэх")}
              </button>

              <button
                className={cn(
                  "h-10 rounded-lg text-sm font-medium transition",
                  mode === "signup"
                    ? "bg-amber-300 text-neutral-900"
                    : "hover:bg-amber-300/15",
                )}
                onClick={() => setMode("signup")}
                type="button"
              >
                {tr(locale, "Sign Up", "Бүртгүүлэх")}
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div>
                <p className="text-sm text-amber-100/75">{tr(locale, "Email", "Имэйл")}</p>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <p className="text-sm text-amber-100/75">{tr(locale, "Phone", "Утас")}</p>
                  <input
                    className="mt-2 h-11 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-amber-100/75">{tr(locale, "Password", "Нууц үг")}</p>
                <input
                  type="password"
                  className="mt-2 h-11 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className={cn(
                  "mt-2 h-11 w-full rounded-xl font-medium transition",
                  loading
                    ? "bg-neutral-200 text-neutral-500"
                    : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
                )}
              >
                {loading
                  ? tr(locale, "Please wait...", "Түр хүлээнэ үү...")
                  : mode === "login"
                    ? tr(locale, "Login", "Нэвтрэх")
                    : tr(locale, "Sign Up", "Бүртгүүлэх")}
              </button>

              {msg && <p className="text-sm text-amber-100/80">{msg}</p>}
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-neutral-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,200,100,0.18),transparent_45%)]" />
            <div className="relative flex h-full flex-col justify-between p-10 text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-amber-300/40 bg-amber-300/10" />
                <div>
                  <p className="jazz-heading text-2xl text-amber-100">MusicBar78</p>
                  <p className="text-sm text-amber-100/70">Live music • Events</p>
                </div>
              </div>

              <div>
                <p className="jazz-heading text-4xl leading-snug text-amber-100">
                  {tr(locale, "Events and table reservations.", "Эвентүүд, ширээ захиалга.")}
                </p>
                <p className="mt-3 text-amber-100/70">
                  {tr(
                    locale,
                    "When logged in, your reservations are linked to your account.",
                    "Нэвтэрснээр таны захиалга account дээр хадгалагдана.",
                  )}
                </p>
              </div>

              <p className="text-xs text-white/50">
                © {new Date().getFullYear()} MusicBar78
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

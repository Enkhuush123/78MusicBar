"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/use-locale";
import { tr } from "@/lib/i18n";
import { supabase as supabaseClient } from "@/lib/supabase/browser";

type Row = {
  id: string;
  tableNo: number;
  guests: number;
  reservedFor: string;
  status: string;
  createdAt: string;
  note: string | null;
  event: {
    id: string;
    title: string;
    startsAt: string;
    venue: string;
    price: number;
    currency: string;
    imageUrl: string | null;
  } | null;
};

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmt(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusLabel(locale: "en" | "mn", status: string) {
  if (status === "pending_payment")
    return tr(locale, "Pending Payment", "Төлбөр хүлээгдэж буй");
  if (status === "confirmed") return tr(locale, "Confirmed", "Баталгаажсан");
  if (status === "cancelled") return tr(locale, "Cancelled", "Цуцлагдсан");
  if (status === "rejected") return tr(locale, "Rejected", "Татгалзсан");
  return status;
}

export default function ReservationRoot() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token ?? null;
      setLoggedIn(!!token);

      if (!token) {
        setRows([]);
        return;
      }

      const res = await fetch("/api/my/reservations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || tr(locale, "Load failed.", "Ачааллахад алдаа гарлаа."));
        setRows([]);
        return;
      }

      setRows((await res.json()) as Row[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabaseClient.auth.onAuthStateChange(() => load());
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => {
      clearInterval(timer);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmedRows = useMemo(
    () => rows.filter((r) => r.status === "confirmed"),
    [rows],
  );

  return (
    <main className="reservation-shell mx-auto max-w-6xl px-4 pt-24 pb-16">
      <section className="reservation-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="jazz-heading text-amber-200">
              {tr(locale, "Profile", "Профайл")}
            </p>
            <h1 className="jazz-heading text-4xl text-amber-50">
              {tr(locale, "My Reservations", "Миний захиалгууд")}
            </h1>
            <p className="mt-1 text-sm text-amber-100/70">
              {tr(locale, "Realtime updates every 5 seconds", "5 секунд тутам realtime шинэчлэгдэнэ")}
            </p>
          </div>
          <button
            onClick={load}
            className="ger-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold"
          >
            {tr(locale, "Refresh", "Шинэчлэх")}
          </button>
        </div>

        {!loggedIn && !loading ? (
          <div className="reservation-soft mt-6 rounded-2xl p-8 text-center">
            <p className="text-amber-100/80">
              {tr(locale, "Please login to see your reservations.", "Захиалгаа харахын тулд нэвтэрнэ үү.")}
            </p>
          </div>
        ) : null}

        {msg ? <p className="mt-4 text-sm text-amber-100/80">{msg}</p> : null}

        {confirmedRows.length > 0 && (
          <div className="mt-5 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-100">
              {tr(locale, "Approved Reservations", "Баталгаажсан захиалгууд")}
            </p>
            <p className="mt-1 text-xs text-emerald-100/80">
              {tr(
                locale,
                "Your payment is verified by admin. Your table is confirmed.",
                "Таны төлбөрийг админ баталгаажуулсан. Таны ширээ баталгаатай.",
              )}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {loading ? (
            <div className="reservation-soft rounded-2xl p-8 text-center text-amber-100/80">
              {tr(locale, "Loading...", "Уншиж байна...")}
            </div>
          ) : rows.length === 0 ? (
            <div className="reservation-soft rounded-2xl p-8 text-center text-amber-100/80">
              {tr(locale, "No reservations yet.", "Одоогоор захиалга алга.")}
            </div>
          ) : (
            rows.map((r) => {
              const expected = (r.event?.price || 0) * r.guests;
              const ref = `RSV-T${r.tableNo}-${r.id.slice(0, 8).toUpperCase()}`;
              return (
                <article
                  key={r.id}
                  className={cn(
                    "rounded-2xl border bg-[linear-gradient(165deg,rgba(30,23,17,0.82)_0%,rgba(22,16,12,0.84)_100%)] p-4",
                    r.status === "confirmed"
                      ? "border-emerald-300/45 shadow-[0_0_0_1px_rgba(110,231,183,0.2)]"
                      : "border-amber-300/25",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-amber-50">
                      {r.event?.title || tr(locale, "Unknown Event", "Тодорхойгүй эвент")}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        r.status === "confirmed" && "border-emerald-300/50 text-emerald-200",
                        r.status === "pending_payment" && "border-amber-300/50 text-amber-200",
                        r.status === "cancelled" && "border-neutral-300/40 text-neutral-300",
                        r.status === "rejected" && "border-red-300/50 text-red-200",
                      )}
                    >
                      {statusLabel(locale, r.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-amber-100/70">
                    {fmt(r.reservedFor)} • {tr(locale, "Table", "Ширээ")} #{r.tableNo} • {r.guests} {tr(locale, "people", "хүн")}
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {tr(locale, "Payment Ref", "Төлбөрийн код")}:{" "}
                    <span className="font-semibold text-amber-200">{ref}</span>
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {tr(locale, "Expected Amount", "Төлөх дүн")}:{" "}
                    <span className="font-semibold text-amber-200">
                      {expected.toLocaleString()} {r.event?.currency || "MNT"}
                    </span>
                  </p>
                  {r.note ? (
                    <p className="mt-2 text-xs text-amber-100/80">
                      {tr(locale, "Note", "Тэмдэглэл")}: {r.note}
                    </p>
                  ) : null}

                  {r.event?.id ? (
                    <Link
                      className="ger-btn-secondary mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold"
                      href={`/events/${r.event.id}/reserve`}
                    >
                      {tr(locale, "Open Event", "Эвент рүү орох")}
                    </Link>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

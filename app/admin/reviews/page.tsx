"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";

type Review = {
  id: string;
  displayName: string;
  userEmail: string | null;
  comment: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
};

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

function fmt(dt: string) {
  return new Date(dt).toLocaleString();
}

export default function AdminReviewsPage() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      if (!res.ok) {
        setMsg(tr(locale, "Load failed", "Уншихад алдаа гарлаа"));
        return;
      }
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const setApprove = async (id: string, isApproved: boolean) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    if (!res.ok) return setMsg(tr(locale, "Update failed", "Шинэчлэхэд алдаа гарлаа"));
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm(tr(locale, "Delete this review?", "Энэ сэтгэгдлийг устгах уу?"))) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) return setMsg(tr(locale, "Delete failed", "Устгахад алдаа гарлаа"));
    await load();
  };

  const counts = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.isApproved).length;
    return { total, approved, pending: total - approved };
  }, [rows]);

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="jazz-heading text-amber-200">Community</p>
          <h1 className="jazz-heading text-4xl text-amber-50">{tr(locale, "Reviews", "Сэтгэгдэл")}</h1>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label={tr(locale, "Total", "Нийт")} value={counts.total} />
          <Stat label={tr(locale, "Approved", "Баталсан")} value={counts.approved} />
          <Stat label={tr(locale, "Pending", "Хүлээгдэж буй")} value={counts.pending} />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-amber-100/75">{tr(locale, "Loading...", "Уншиж байна...")}</p>}
        {msg && <p className="text-sm text-amber-100/75">{msg}</p>}

        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-amber-300/25 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-50">
                  @{r.displayName}
                </p>
                <p className="text-xs text-amber-100/65">
                  {r.userEmail || tr(locale, "unknown", "тодорхойгүй")} • {fmt(r.createdAt)}
                </p>
                <p className="mt-2 text-amber-100">{r.comment}</p>
                <p className="mt-1 text-xs text-amber-200">
                  {"★".repeat(Math.max(1, Math.min(5, r.rating)))}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs",
                  r.isApproved
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-200",
                )}
              >
                {r.isApproved ? tr(locale, "Approved", "Баталсан") : tr(locale, "Pending", "Хүлээгдэж буй")}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {!r.isApproved ? (
                <button
                  onClick={() => setApprove(r.id, true)}
                  className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold text-neutral-900"
                >
                  {tr(locale, "Approve", "Батлах")}
                </button>
              ) : (
                <button
                  onClick={() => setApprove(r.id, false)}
                  className="rounded-xl border border-amber-300/40 px-3 py-2 text-sm text-amber-50"
                >
                  {tr(locale, "Unapprove", "Баталгааг цуцлах")}
                </button>
              )}
              <button
                onClick={() => remove(r.id)}
                className="rounded-xl border border-amber-300/40 px-3 py-2 text-sm text-amber-50"
              >
                {tr(locale, "Delete", "Устгах")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-black/20 px-4 py-3">
      <p className="text-xs font-semibold text-amber-100/70">{label}</p>
      <p className="text-xl font-extrabold text-amber-50">{value}</p>
    </div>
  );
}

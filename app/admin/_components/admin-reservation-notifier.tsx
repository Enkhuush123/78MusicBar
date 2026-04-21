"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { tr, type Locale } from "@/lib/i18n";

type NotificationPayload = {
  pendingCount: number;
  latest: {
    id: string;
    tableNo: number;
    guests: number;
    reservedFor: string;
    status: string;
    createdAt: string;
    eventTitle: string | null;
  } | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatReservationTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminReservationNotifier({ locale }: { locale: Locale }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const lastLatestIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      }).catch(() => null);

      if (!isMounted || !res?.ok) return;
      const data = (await res.json()) as NotificationPayload;

      setPendingCount(data.pendingCount);

      const latestId = data.latest?.id ?? null;
      if (!initializedRef.current) {
        initializedRef.current = true;
        lastLatestIdRef.current = latestId;
        return;
      }

      if (latestId && latestId !== lastLatestIdRef.current) {
        lastLatestIdRef.current = latestId;
        const time = formatReservationTime(data.latest?.reservedFor);
        const text = tr(
          locale,
          `Table #${data.latest?.tableNo ?? "?"} reserved${time ? ` at ${time}` : ""}${data.latest?.eventTitle ? ` • ${data.latest.eventTitle}` : ""}`,
          `Ширээ #${data.latest?.tableNo ?? "?"}${time ? ` • ${time}` : ""} захиалагдлаа${data.latest?.eventTitle ? ` • ${data.latest.eventTitle}` : ""}`,
        );
        setToast(text);
        setTimeout(() => setToast(null), 8000);
      }
    };

    poll();
    const t = setInterval(poll, 5000);

    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [locale]);

  return (
    <>
      <Link
        href="/admin/reservations"
        className="block rounded-xl border border-red-300/45 bg-red-500/10 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/20"
      >
        {tr(locale, "Pending Payments", "Хүлээгдэж буй төлбөр")}{" "}
        <span className="font-semibold">({pendingCount})</span>
      </Link>

      {toast && (
        <div className="fixed right-4 top-24 z-[120] max-w-sm rounded-xl border border-amber-300/45 bg-[linear-gradient(165deg,rgba(45,31,18,0.97)_0%,rgba(25,18,13,0.98)_100%)] px-4 py-3 text-sm text-amber-100 shadow-2xl">
          <p className="font-semibold">{tr(locale, "New Reservation", "Шинэ захиалга")}</p>
          <p className="mt-1">{toast}</p>
          <Link
            href="/admin/reservations"
            className="mt-3 inline-flex rounded-lg border border-amber-300/55 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-300/15"
          >
            {tr(locale, "Open reservations", "Захиалгууд руу орох")}
          </Link>
        </div>
      )}
    </>
  );
}

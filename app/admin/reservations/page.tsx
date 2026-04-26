/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import {
  buildDailyTimeOptions,
  getTodayReservationDateInput,
} from "@/lib/daily-reservation";

type Row = {
  id: string;
  eventId: string | null;
  userId: string | null;
  tableNo: number;
  guests: number;
  reservedFor: string;
  surchargeAmount: number;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  phone: string | null;
  userEmail: string | null;
  userPhone: string | null;
  event?: {
    id?: string;
    title: string;
    startsAt: string;
    venue: string;
    price: number;
    currency: string;
  } | null;
};

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmt(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateTime(date: string, time: string) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

const TABLES = Array.from({ length: 22 }, (_, i) => i + 1);

export default function AdminReservationsPage() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<
    "all" | "pending_payment" | "confirmed" | "cancelled" | "rejected"
  >("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [allowCustomDate, setAllowCustomDate] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [manualDate] = useState(() => getTodayReservationDateInput());
  const manualTimeOptions = useMemo(() => buildDailyTimeOptions(30), []);
  const [manualTime, setManualTime] = useState(() => manualTimeOptions[0] || "18:00");
  const [manualTableNo, setManualTableNo] = useState<number | null>(null);
  const [manualReserved, setManualReserved] = useState<number[]>([]);
  const [manualSaving, setManualSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    mode: "cancel" | "delete";
    id: string | null;
    title: string;
    body: string;
    confirmLabel: string;
    tone: "amber" | "red";
  }>({
    open: false,
    mode: "cancel",
    id: null,
    title: "",
    body: "",
    confirmLabel: "",
    tone: "amber",
  });

  const load = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      sp.set("status", status);
      if (from) sp.set("from", new Date(from).toISOString());
      if (to) sp.set("to", new Date(to).toISOString());

      const res = await fetch(`/api/admin/reservations?${sp.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || "Load failed");
        setRows([]);
        return;
      }
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    const res = await fetch("/api/admin/reservations/settings", {
      cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json()) as {
      paymentRequired?: boolean;
      allowCustomDate?: boolean;
    };
    setPaymentRequired(data.paymentRequired !== false);
    setAllowCustomDate(data.allowCustomDate === true);
  };

  const loadManualReserved = async () => {
    const reservedFor = combineDateTime(manualDate, manualTime);
    if (!reservedFor) {
      setManualReserved([]);
      return;
    }
    const res = await fetch(
      `/api/reservations?reservationDate=${encodeURIComponent(manualDate)}&reservedFor=${encodeURIComponent(reservedFor)}`,
      { cache: "no-store" },
    ).catch(() => null);
    if (!res?.ok) {
      setManualReserved([]);
      return;
    }
    const data = (await res.json()) as { reserved?: number[] };
    setManualReserved(Array.isArray(data.reserved) ? data.reserved : []);
  };

  useEffect(() => {
    load();
    loadSettings();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadManualReserved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualTime]);

  const createManualReservation = async () => {
    const reservedFor = combineDateTime(manualDate, manualTime);
    if (!reservedFor || !manualTableNo) {
      setMsg(
        tr(
          locale,
          "Choose date, time, and table.",
          "Өдөр, цаг, ширээгээ сонгоно уу.",
        ),
      );
      return;
    }
    setManualSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationDate: manualDate,
          reservedFor,
          tableNo: manualTableNo,
          guests: 2,
          adminHold: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(
          data?.message ||
            tr(locale, "Table hold failed.", "Ширээ хадгалахад алдаа гарлаа."),
        );
        return;
      }
      setMsg(
        tr(
          locale,
          `Table #${manualTableNo} is now reserved on the website.`,
          `Ширээ #${manualTableNo} website дээр reserved боллоо.`,
        ),
      );
      setManualTableNo(null);
      await loadManualReserved();
      await load();
    } finally {
      setManualSaving(false);
    }
  };

  const togglePaymentRequired = async () => {
    const next = !paymentRequired;
    setSettingsSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reservations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRequired: next }),
      });
      if (!res.ok) {
        setMsg(
          tr(
            locale,
            "Payment setting update failed",
            "Төлбөрийн тохиргоо хадгалагдсангүй",
          ),
        );
        return;
      }
      setPaymentRequired(next);
      setMsg(
        next
          ? tr(
              locale,
              "Payment is now required for new reservations.",
              "Шинэ захиалгад төлбөр шаардана.",
            )
          : tr(
              locale,
              "New reservations will now be confirmed automatically.",
              "Шинэ захиалга шууд баталгааждаг боллоо.",
            ),
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const toggleAllowCustomDate = async () => {
    const next = !allowCustomDate;
    setSettingsSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reservations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowCustomDate: next }),
      });
      if (!res.ok) {
        setMsg(
          tr(
            locale,
            "Reservation date setting update failed",
            "Захиалгын өдрийн тохиргоо хадгалагдсангүй",
          ),
        );
        return;
      }
      setAllowCustomDate(next);
      setMsg(
        next
          ? tr(
              locale,
              "Daily reservation section is now visible on homepage.",
              "Энгийн өдрийн захиалгын хэсэг нүүр хуудсанд харагддаг боллоо.",
            )
          : tr(
              locale,
              "Daily reservation section is now hidden from homepage.",
              "Энгийн өдрийн захиалгын хэсэг нүүр хуудаснаас нуугдлаа.",
            ),
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const cancel = async (id: string) => {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d?.message || "Cancel failed");
      return;
    }
    await load();
  };

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    if (!res.ok) return setMsg("Approve failed");
    await load();
  };

  const restore = async (id: string) => {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending_payment" }),
    });
    if (!res.ok) return setMsg("Restore failed");
    await load();
  };

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (!res.ok) return setMsg("Reject failed");
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setMsg(
        d?.message || tr(locale, "Delete failed", "Устгахад алдаа гарлаа"),
      );
    }
    await load();
  };

  const askCancel = (id: string) => {
    setConfirmDialog({
      open: true,
      mode: "cancel",
      id,
      title: tr(locale, "Cancel Reservation?", "Захиалгыг цуцлах уу?"),
      body: tr(
        locale,
        "This reservation will be marked as cancelled. You can still restore it later.",
        "Энэ захиалга цуцлагдсан төлөвтэй болно. Дараа нь дахин сэргээх боломжтой.",
      ),
      confirmLabel: tr(locale, "Yes, cancel", "Тийм, цуцал"),
      tone: "amber",
    });
  };

  const askDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      mode: "delete",
      id,
      title: tr(locale, "Delete Permanently?", "Бүр мөсөн устгах уу?"),
      body: tr(
        locale,
        "This will permanently delete the reservation from database and cannot be undone.",
        "Энэ үйлдэл захиалгыг database-с бүр мөсөн устгана. Буцаах боломжгүй.",
      ),
      confirmLabel: tr(locale, "Delete forever", "Бүр мөсөн устга"),
      tone: "red",
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((p) => ({ ...p, open: false, id: null }));
  };

  const runConfirmAction = async () => {
    if (!confirmDialog.id) return closeConfirm();
    const id = confirmDialog.id;
    const mode = confirmDialog.mode;
    closeConfirm();
    if (mode === "cancel") await cancel(id);
    if (mode === "delete") await remove(id);
  };

  const counts = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending_payment").length;
    const confirmed = rows.filter((r) => r.status === "confirmed").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    return { total, pending, confirmed, cancelled };
  }, [rows]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const pa = a.status === "pending_payment" ? 0 : 1;
      const pb = b.status === "pending_payment" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows]);

  return (
    <section className="jazz-panel reservation-panel rounded-2xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="jazz-heading text-amber-200">Bookings</p>
          <h1 className="jazz-heading text-4xl text-amber-50">
            {tr(locale, "Reservations", "Захиалгууд")}
          </h1>
          <p className="mt-1 text-sm text-amber-100/90">
            {tr(
              locale,
              "Review • approve payment • cancel • delete • filter reservations",
              "Захиалга хянах • төлбөр батлах • цуцлах • устгах • шүүх",
            )}
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            {tr(
              locale,
              "Realtime updates every 5 seconds",
              "5 секунд тутам realtime шинэчлэгдэнэ",
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label={tr(locale, "Total", "Нийт")} value={counts.total} />
          <Stat
            label={tr(locale, "Pending payment", "Төлбөр хүлээгдэж буй")}
            value={counts.pending}
          />
          <Stat
            label={tr(locale, "Confirmed", "Баталгаажсан")}
            value={counts.confirmed}
          />
          <Stat
            label={tr(locale, "Cancelled", "Цуцалсан")}
            value={counts.cancelled}
          />
        </div>
      </div>

      <div className="reservation-soft mt-6 rounded-2xl p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-50">
              {tr(locale, "Floor Control", "Ширээ хянах")}
            </p>
            <p className="text-xs text-amber-100/70">
              {tr(
                locale,
                "Mark a table as reserved when a walk-in customer sits down.",
                "Салбарт шууд орж ирсэн зочин суувал тухайн ширээг reserved болгоно.",
              )}
            </p>
          </div>
          <p className="text-xs text-amber-100/70">
            {tr(locale, "Today", "Өнөөдөр")}: {manualDate} • {manualTime}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px]">
          <select
            className="h-11 rounded-xl px-3 text-amber-50"
            value={manualTime}
            onChange={(e) => {
              setManualTime(e.target.value);
              setManualTableNo(null);
            }}
          >
            {manualTimeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={createManualReservation}
            disabled={manualSaving || !manualTableNo}
            className={cn(
              "h-11 rounded-xl font-semibold transition",
              manualSaving || !manualTableNo
                ? "bg-neutral-200 text-neutral-500"
                : "ger-btn-primary",
            )}
          >
            {manualSaving
              ? tr(locale, "Saving...", "Хадгалж байна...")
              : tr(locale, "Mark Reserved", "Reserved болгох")}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
          {TABLES.map((tableNo) => {
            const isReserved = manualReserved.includes(tableNo);
            const isSelected = manualTableNo === tableNo;
            return (
              <button
                key={tableNo}
                type="button"
                disabled={isReserved}
                onClick={() => setManualTableNo(tableNo)}
                className={cn(
                  "h-12 rounded-xl border text-sm font-semibold transition",
                  isReserved &&
                    "cursor-not-allowed border-neutral-500/40 bg-neutral-900/45 text-neutral-400",
                  !isReserved &&
                    !isSelected &&
                    "border-amber-300/30 bg-black/20 text-amber-100 hover:bg-amber-300/15",
                  isSelected &&
                    "border-amber-200 bg-amber-300 text-neutral-950",
                )}
              >
                #{tableNo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="reservation-soft mt-6 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_160px_170px_170px_140px]">
        <input
          className="h-11 w-full rounded-xl px-3 text-amber-50"
          placeholder={tr(
            locale,
            "Search name / phone / email",
            "Нэр / утас / email хайх",
          )}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="h-11 rounded-xl px-3 text-amber-50"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">{tr(locale, "All", "Бүгд")}</option>
          <option value="pending_payment">
            {tr(locale, "Pending payment", "Төлбөр хүлээгдэж буй")}
          </option>
          <option value="confirmed">
            {tr(locale, "Confirmed", "Баталгаажсан")}
          </option>
          <option value="cancelled">
            {tr(locale, "Cancelled", "Цуцалсан")}
          </option>
          <option value="rejected">
            {tr(locale, "Rejected", "Татгалзсан")}
          </option>
        </select>

        <input
          type="datetime-local"
          className="h-11 rounded-xl px-3 text-amber-50"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="datetime-local"
          className="h-11 rounded-xl px-3 text-amber-50"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          onClick={load}
          className={cn(
            "h-11 rounded-xl font-semibold transition",
            loading ? "bg-neutral-200 text-neutral-500" : "ger-btn-primary",
          )}
          disabled={loading}
        >
          {loading ? "Loading..." : tr(locale, "Filter", "Шүүх")}
        </button>
      </div>

      <div className="reservation-soft mt-3 flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-50">
            {tr(locale, "Reservation Payment", "Захиалгын төлбөр")}
          </p>
          <p className="text-xs text-amber-100/80">
            {paymentRequired
              ? tr(
                  locale,
                  "Customers must transfer payment and wait for approval.",
                  "Хэрэглэгч төлбөр шилжүүлж админ батлах шаардлагатай.",
                )
              : tr(
                  locale,
                  "New reservations are confirmed automatically.",
                  "Шинэ захиалга шууд баталгаажна.",
                )}
          </p>
        </div>
        <button
          type="button"
          onClick={togglePaymentRequired}
          disabled={settingsSaving}
          className={cn(
            "h-10 rounded-xl px-4 text-sm font-semibold transition",
            paymentRequired
              ? "border border-amber-300/40 text-amber-100 hover:bg-amber-300/15"
              : "border border-emerald-300/45 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-300/15",
          )}
        >
          {settingsSaving
            ? tr(locale, "Saving...", "Хадгалж байна...")
            : paymentRequired
              ? tr(locale, "Turn Off Payment", "Төлбөргүй болгох")
              : tr(locale, "Require Payment", "Төлбөр шаардах")}
        </button>
      </div>

      <div className="reservation-soft mt-3 flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-50">
            {tr(locale, "Daily Reservation Section", "Энгийн өдрийн захиалга")}
          </p>
          <p className="text-xs text-amber-100/80">
            {tr(
              locale,
              "Show or hide the regular day reservation section on homepage.",
              "Нүүр хуудас дээрх энгийн өдрийн захиалгын хэсгийг гаргах эсвэл нуух.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAllowCustomDate}
          disabled={settingsSaving}
          className={cn(
            "h-10 rounded-xl px-4 text-sm font-semibold transition",
            allowCustomDate
              ? "border border-sky-300/45 bg-sky-500/10 text-sky-100 hover:bg-sky-300/15"
              : "border border-amber-300/40 text-amber-100 hover:bg-amber-300/15",
          )}
        >
          {settingsSaving
            ? tr(locale, "Saving...", "Хадгалж байна...")
            : allowCustomDate
              ? tr(locale, "Hide Daily Reservation", "Энгийн өдрийн захиалгыг нуух")
              : tr(
                  locale,
                  "Show Daily Reservation",
                  "Энгийн өдрийн захиалгыг гаргах",
                )}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-amber-100">{msg}</p>}

      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <div className="reservation-soft rounded-2xl p-10 text-center text-sm text-amber-100/90">
            {tr(locale, "No reservations found.", "Захиалга алга.")}
          </div>
        ) : (
          sortedRows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border border-amber-300/28 bg-[linear-gradient(165deg,rgba(31,23,17,0.84)_0%,rgba(22,16,12,0.84)_100%)] p-4",
                r.status === "cancelled" && "opacity-70",
              )}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-50">
                    {r.event?.title || tr(locale, "No event", "Эвентгүй")}
                    {r.status === "cancelled"
                      ? tr(locale, " • (cancelled)", " • (цуцалсан)")
                      : r.status === "pending_payment"
                        ? tr(
                            locale,
                            " • (pending payment)",
                            " • (төлбөр хүлээгдэж буй)",
                          )
                        : r.status === "confirmed"
                          ? tr(locale, " • (confirmed)", " • (баталгаажсан)")
                          : r.status === "rejected"
                            ? tr(locale, " • (rejected)", " • (татгалзсан)")
                            : ""}
                  </p>
                  <p className="text-xs text-amber-100/90">
                    {fmt(r.reservedFor)} • {tr(locale, "Table", "Ширээ")} #
                    {r.tableNo} • {r.guests} {tr(locale, "people", "хүн")}
                  </p>
                  <p className="truncate text-xs text-amber-100/90">
                    {r.name || r.userEmail || "—"} •{" "}
                    {r.phone || r.userPhone || "—"}
                  </p>
                  <p className="mt-1 text-xs text-amber-100/90">
                    {tr(locale, "Payment ref", "Төлбөрийн код")}:{" "}
                    <span className="font-semibold text-amber-200">
                      RSV-T{r.tableNo}-{r.id.slice(0, 8).toUpperCase()}
                    </span>{" "}
                    • {tr(locale, "Expected", "Хүлээгдэх дүн")}:{" "}
                    <span className="font-semibold text-amber-200">
                      {(
                        (r.event?.price || 0) * r.guests +
                        (r.surchargeAmount || 0)
                      ).toLocaleString()}{" "}
                      {r.event?.currency || "MNT"}
                    </span>
                  </p>
                  {r.surchargeAmount > 0 ? (
                    <p className="mt-1 text-xs text-amber-100/80">
                      {tr(locale, "Surcharge", "Нэмэгдэл")}:{" "}
                      <span className="font-semibold text-amber-200">
                        +{r.surchargeAmount.toLocaleString()}{" "}
                        {r.event?.currency || "MNT"}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-amber-100/80">
                    {tr(locale, "Booked", "Үүсгэсэн")}: {fmt(r.createdAt)} •{" "}
                    {tr(locale, "Updated", "Шинэчилсэн")}: {fmt(r.updatedAt)} •{" "}
                    {tr(locale, "Venue", "Байршил")}:{" "}
                    {r.event?.venue || "78MusicBar"}
                  </p>
                  {r.note ? (
                    <p className="mt-2 rounded-lg border border-amber-300/20 bg-black/30 px-2 py-1 text-xs text-amber-100/80">
                      {tr(locale, "Note", "Тэмдэглэл")}: {r.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {r.status === "pending_payment" && (
                    <button
                      onClick={() => approve(r.id)}
                      className="h-9 rounded-xl border border-emerald-300/50 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                    >
                      {tr(locale, "Approve", "Батлах")}
                    </button>
                  )}
                  {r.status === "pending_payment" && (
                    <button
                      onClick={() => reject(r.id)}
                      className="h-9 rounded-xl border border-red-300/55 bg-red-500/10 px-3 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                    >
                      {tr(locale, "Reject", "Татгалзах")}
                    </button>
                  )}

                  {r.status !== "cancelled" ? (
                    <button
                      onClick={() => askCancel(r.id)}
                      className="ger-btn-secondary h-9 rounded-xl px-3 text-sm font-semibold"
                    >
                      {tr(locale, "Cancel", "Цуцлах")}
                    </button>
                  ) : (
                    <button
                      onClick={() => restore(r.id)}
                      className="ger-btn-secondary h-9 rounded-xl px-3 text-sm font-semibold"
                    >
                      {tr(locale, "Restore", "Буцаах")}
                    </button>
                  )}
                  <button
                    onClick={() => askDelete(r.id)}
                    className="h-9 rounded-xl border border-red-300/55 bg-red-500/10 px-3 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                  >
                    {tr(locale, "Delete", "Устгах")}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-300/35 bg-[linear-gradient(165deg,rgba(35,26,20,0.98)_0%,rgba(26,20,15,0.98)_100%)] p-6 shadow-2xl">
            <p className="jazz-heading text-2xl text-amber-100">
              {confirmDialog.title}
            </p>
            <p className="mt-3 text-sm text-amber-100/85">
              {confirmDialog.body}
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="ger-btn-secondary h-10 flex-1 rounded-xl"
              >
                {tr(locale, "Back", "Буцах")}
              </button>
              <button
                type="button"
                onClick={runConfirmAction}
                className={cn(
                  "h-10 flex-1 rounded-xl font-semibold transition",
                  confirmDialog.tone === "red"
                    ? "bg-red-400 text-neutral-900 hover:bg-red-300"
                    : "ger-btn-primary",
                )}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-amber-300/26 bg-[linear-gradient(150deg,rgba(25,18,13,0.72)_0%,rgba(16,12,9,0.72)_100%)] px-4 py-3">
      <p className="text-xs font-semibold text-amber-100/70">{label}</p>
      <p className="text-xl font-extrabold text-amber-50">{value}</p>
    </div>
  );
}

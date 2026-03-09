"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Locale, tr } from "@/lib/i18n";
import { useLocale } from "@/app/components/use-locale";
import AdminConfirmDialog from "@/app/components/admin-confirm-dialog";

type Reservation = {
  id: string;
  requesterName: string;
  phone: string;
  djName: string;
  genre: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  preferredDate: string;
  userEmail: string | null;
  slot: {
    id: string;
    startsAt: string;
    endsAt: string;
    isOpen: boolean;
    day: { id: string; eventDate: string };
  } | null;
};

type Day = {
  id: string;
  eventDate: string;
  isActive: boolean;
  slots: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    isOpen: boolean;
    reservation: { id: string; djName: string; status: string } | null;
  }>;
};

function fmtDate(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(locale: Locale, status: Reservation["status"]) {
  if (status === "approved") return tr(locale, "Approved", "Батлагдсан");
  if (status === "rejected") return tr(locale, "Rejected", "Татгалзсан");
  if (status === "cancelled") return tr(locale, "Cancelled", "Цуцлагдсан");
  return tr(locale, "New request", "Шинэ хүсэлт");
}

function extractType(value: string) {
  const raw = String(value || "").trim();
  const parts = raw.split(/\s\|\s/).map((x) => x.trim()).filter(Boolean);
  return parts[0] || raw;
}

export default function AdminOpenDeckPage() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    mode: "delete-day" | "delete-one" | "delete-selected" | "set-status";
    dayId?: string;
    rowId?: string;
    nextStatus?: Reservation["status"];
    title: string;
    body: string;
    confirmLabel: string;
    tone: "amber" | "red";
  }>({
    open: false,
    mode: "delete-one",
    title: "",
    body: "",
    confirmLabel: "",
    tone: "amber",
  });

  const [eventDate, setEventDate] = useState("");
  const [startHour, setStartHour] = useState(20);
  const [endHour, setEndHour] = useState(2);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const sp = new URLSearchParams();
      sp.set("status", status);
      if (q.trim()) sp.set("q", q.trim());

      const [resReq, resDays] = await Promise.all([
        fetch(`/api/admin/open-deck?${sp.toString()}`, { cache: "no-store" }),
        fetch(`/api/admin/open-deck/days`, { cache: "no-store" }),
      ]);

      if (!resReq.ok || !resDays.ok) {
        setMsg(tr(locale, "Load failed", "Уншихад алдаа гарлаа"));
        return;
      }

      setRows(await resReq.json());
      setDays(await resDays.json());
    } finally {
      setLoading(false);
    }
  }, [locale, q, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const createDay = async () => {
    if (!eventDate) return setMsg(tr(locale, "Choose date", "Өдөр сонгоно уу"));
    const res = await fetch("/api/admin/open-deck/days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventDate, startHour, endHour, slotMinutes: 90 }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return setMsg(body?.message || tr(locale, "Create failed", "Үүсгэхэд алдаа гарлаа"));
    }
    setEventDate("");
    await load();
  };

  const setDayActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/open-deck/days/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    await load();
  };

  const deleteDay = async (id: string) => {
    await fetch(`/api/admin/open-deck/days/${id}`, { method: "DELETE" });
    await load();
  };

  const setSlotOpen = async (id: string, isOpen: boolean) => {
    await fetch(`/api/admin/open-deck/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen }),
    });
    await load();
  };

  const updateStatus = async (id: string, next: Reservation["status"]) => {
    const res = await fetch(`/api/admin/open-deck/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) return setMsg(tr(locale, "Update failed", "Шинэчлэхэд алдаа гарлаа"));
    await load();
  };

  const deleteOne = async (id: string) => {
    const res = await fetch(`/api/admin/open-deck/${id}`, { method: "DELETE" });
    if (!res.ok) return setMsg(tr(locale, "Delete failed", "Устгахад алдаа гарлаа"));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    await load();
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const res = await fetch("/api/admin/open-deck", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!res.ok) return setMsg(tr(locale, "Delete failed", "Устгахад алдаа гарлаа"));
    setSelectedIds([]);
    await load();
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    return { total, pending, approved };
  }, [rows]);

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      return prev.filter((id) => !visibleIds.includes(id));
    });
  };

  const askDeleteDay = (id: string) => {
    setConfirmDialog({
      open: true,
      mode: "delete-day",
      dayId: id,
      title: tr(locale, "Delete Open Deck Day?", "Open Deck өдрийг устгах уу?"),
      body: tr(
        locale,
        "This day and all related slots/reservations will be permanently removed.",
        "Энэ өдөр болон холбогдох слот/хүсэлтүүд бүр мөсөн устна.",
      ),
      confirmLabel: tr(locale, "Delete", "Устгах"),
      tone: "red",
    });
  };

  const askDeleteOne = (id: string) => {
    setConfirmDialog({
      open: true,
      mode: "delete-one",
      rowId: id,
      title: tr(locale, "Delete Request?", "Хүсэлтийг устгах уу?"),
      body: tr(
        locale,
        "This request will be permanently removed from database.",
        "Энэ хүсэлт database-ээс бүр мөсөн устна.",
      ),
      confirmLabel: tr(locale, "Delete", "Устгах"),
      tone: "red",
    });
  };

  const askDeleteSelected = () => {
    if (!selectedIds.length) return;
    setConfirmDialog({
      open: true,
      mode: "delete-selected",
      title: tr(locale, "Delete Selected Requests?", "Сонгосон хүсэлтүүдийг устгах уу?"),
      body: tr(
        locale,
        "Selected requests will be permanently removed from database.",
        "Сонгосон хүсэлтүүд database-ээс бүр мөсөн устна.",
      ),
      confirmLabel: tr(locale, "Delete", "Устгах"),
      tone: "red",
    });
  };

  const askStatus = (id: string, nextStatus: Reservation["status"]) => {
    const tone =
      nextStatus === "rejected" ? "red" : "amber";
    const label =
      nextStatus === "approved"
        ? tr(locale, "Approve & Publish", "Батлаад нийтлэх")
        : nextStatus === "pending"
          ? tr(locale, "Restore", "Буцаах")
        : nextStatus === "rejected"
          ? tr(locale, "Reject", "Татгалзах")
          : tr(locale, "Cancel", "Цуцлах");

    setConfirmDialog({
      open: true,
      mode: "set-status",
      rowId: id,
      nextStatus,
      title:
        nextStatus === "approved"
          ? tr(locale, "Approve this request?", "Энэ хүсэлтийг батлах уу?")
          : nextStatus === "pending"
            ? tr(locale, "Restore this request?", "Энэ хүсэлтийг буцаах уу?")
          : nextStatus === "rejected"
            ? tr(locale, "Reject this request?", "Энэ хүсэлтийг татгалзах уу?")
            : tr(locale, "Cancel this request?", "Энэ хүсэлтийг цуцлах уу?"),
      body:
        nextStatus === "approved"
          ? tr(
              locale,
              "The DJ request will be approved and visible in Open Deck lineup.",
              "DJ хүсэлт батлагдаж Open Deck lineup хэсэгт харагдана.",
            )
          : nextStatus === "pending"
            ? tr(
                locale,
                "The request will return to pending status.",
                "Хүсэлт хүлээгдэж буй төлөвт буцна.",
              )
          : nextStatus === "rejected"
            ? tr(
                locale,
                "The request will be marked as rejected.",
                "Хүсэлт татгалзсан төлөвтэй болно.",
              )
            : tr(
                locale,
                "The request will be marked as cancelled.",
                "Хүсэлт цуцлагдсан төлөвтэй болно.",
              ),
      confirmLabel: label,
      tone,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      open: false,
      mode: "delete-one",
      title: "",
      body: "",
      confirmLabel: "",
      tone: "amber",
    });
  };

  const runConfirm = async () => {
    const mode = confirmDialog.mode;
    const dayId = confirmDialog.dayId;
    const rowId = confirmDialog.rowId;
    const nextStatus = confirmDialog.nextStatus;
    closeConfirm();

    if (mode === "delete-day" && dayId) {
      await deleteDay(dayId);
      return;
    }
    if (mode === "delete-one" && rowId) {
      await deleteOne(rowId);
      return;
    }
    if (mode === "delete-selected") {
      await deleteSelected();
      return;
    }
    if (mode === "set-status" && rowId && nextStatus) {
      await updateStatus(rowId, nextStatus);
    }
  };

  return (
    <section className="jazz-panel reservation-panel rounded-2xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="jazz-heading text-amber-200">Open Deck</p>
          <h1 className="jazz-heading text-4xl text-amber-50">
            {tr(locale, "Open Deck Schedule & DJ Requests", "Open Deck хуваарь ба DJ хүсэлт")}
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label={tr(locale, "Total", "Нийт")} value={stats.total} />
          <Stat label={tr(locale, "Pending", "Хүлээгдэж буй")} value={stats.pending} />
          <Stat label={tr(locale, "Approved", "Баталсан")} value={stats.approved} />
        </div>
      </div>

      <div className="reservation-soft mt-5 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-100">
          {tr(locale, "Create Open Deck Day", "Open Deck өдөр үүсгэх")}
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_120px_120px_120px]">
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11 rounded-xl px-3 text-amber-50" />
          <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className="h-11 rounded-xl px-3 text-amber-50">
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={`start-${i}`} value={i}>{String(i).padStart(2, "0")}:00</option>
            ))}
          </select>
          <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} className="h-11 rounded-xl px-3 text-amber-50">
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={`end-${i}`} value={i}>{String(i).padStart(2, "0")}:00</option>
            ))}
          </select>
          <button onClick={createDay} className="ger-btn-primary h-11 rounded-xl font-semibold">
            {tr(locale, "Create", "Үүсгэх")}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {days.map((d) => (
          <div key={d.id} className="rounded-2xl border border-amber-300/28 bg-[linear-gradient(165deg,rgba(31,23,17,0.84)_0%,rgba(22,16,12,0.84)_100%)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-50">{fmtDate(d.eventDate)}</p>
              <div className="flex gap-2">
                <button onClick={() => setDayActive(d.id, !d.isActive)} className="ger-btn-secondary rounded-xl px-3 py-1.5 text-xs">
                  {d.isActive ? tr(locale, "Deactivate", "Идэвхгүй") : tr(locale, "Activate", "Идэвхжүүлэх")}
                </button>
                <button onClick={() => askDeleteDay(d.id)} className="rounded-xl border border-rose-300/45 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-300/20">
                  {tr(locale, "Delete Day", "Өдөр устгах")}
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {d.slots.map((s) => (
                <div key={s.id} className="reservation-soft rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-100">{fmtTime(s.startsAt)} - {fmtTime(s.endsAt)}</p>
                  <p className="text-xs text-amber-100/80">
                    {s.reservation ? `${s.reservation.djName} (${s.reservation.status})` : tr(locale, "Free slot", "Сул слот")}
                  </p>
                  <button onClick={() => setSlotOpen(s.id, !s.isOpen)} className="ger-btn-secondary mt-2 rounded-lg px-2 py-1 text-xs">
                    {s.isOpen ? tr(locale, "Close slot", "Слот хаах") : tr(locale, "Open slot", "Слот нээх")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="reservation-soft mt-6 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_160px_120px]">
        <input
          className="h-11 rounded-xl px-3 text-amber-50"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr(locale, "Search by DJ/name/type/phone", "DJ/нэр/төрөл/утсаар хайх")}
        />
        <select className="h-11 rounded-xl px-3 text-amber-50" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{tr(locale, "All", "Бүгд")}</option>
          <option value="pending">{tr(locale, "Pending", "Хүлээгдэж буй")}</option>
          <option value="approved">{tr(locale, "Approved", "Баталсан")}</option>
          <option value="rejected">{tr(locale, "Rejected", "Татгалзсан")}</option>
          <option value="cancelled">{tr(locale, "Cancelled", "Цуцалсан")}</option>
        </select>
        <button onClick={load} className="ger-btn-primary h-11 rounded-xl font-semibold">
          {loading ? "..." : tr(locale, "Filter", "Шүүх")}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-xs text-amber-100/80">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(e) => toggleSelectAllVisible(e.target.checked)}
          />
          {tr(locale, "Select all visible", "Харагдаж буйг бүгдийг сонгох")}
        </label>
        <button
          onClick={askDeleteSelected}
          disabled={!selectedIds.length}
          className="h-9 rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20 disabled:opacity-40"
        >
          {tr(locale, "Delete Selected", "Сонгосныг устгах")} ({selectedIds.length})
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-amber-100/80">{msg}</p>}

      <div className="mt-5 grid gap-3">
        {rows.map((r) => (
          (() => {
            const type = extractType(r.genre);
            return (
          <article
            key={r.id}
            className={[
              "rounded-2xl border p-4",
              r.status === "approved"
                ? "border-emerald-300/40 bg-emerald-950/20"
                : r.status === "rejected"
                  ? "border-rose-300/40 bg-rose-950/20"
                  : "border-amber-300/28 bg-[linear-gradient(165deg,rgba(31,23,17,0.84)_0%,rgba(22,16,12,0.84)_100%)]",
            ].join(" ")}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-amber-100/80">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id)}
                  onChange={(e) => toggleSelect(r.id, e.target.checked)}
                />
                {tr(locale, "Select", "Сонгох")}
              </label>
              <button
                onClick={() => askDeleteOne(r.id)}
                className="h-8 rounded-lg border border-rose-300/50 bg-rose-500/10 px-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20"
              >
                {tr(locale, "Delete", "Устгах")}
              </button>
            </div>
            <p className="text-sm font-semibold text-amber-50">{r.djName}</p>
            <p className="mt-1">
              <span className="rounded-full border border-amber-300/35 bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/85">
                {type || tr(locale, "Type", "Төрөл")}
              </span>
            </p>
            <p className="text-xs text-amber-100/70">
              {r.requesterName} • {r.phone} • {r.userEmail || "guest"}
            </p>
            <p className="mt-1 text-xs text-amber-100/70">
              {r.slot ? `${fmtDate(r.slot.startsAt)} • ${fmtTime(r.slot.startsAt)}` : `${fmtDate(r.preferredDate)} • ${fmtTime(r.preferredDate)}`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "pending" ? (
                <>
                  <button
                    onClick={() => askStatus(r.id, "approved")}
                    className="h-9 rounded-xl border border-emerald-300/50 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    {tr(locale, "Approve & Publish", "Батлаад нийтлэх")}
                  </button>
                  <button
                    onClick={() => askStatus(r.id, "rejected")}
                    className="h-9 rounded-xl border border-red-300/55 bg-red-500/10 px-3 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                  >
                    {tr(locale, "Reject", "Татгалзах")}
                  </button>
                </>
              ) : null}

              {r.status !== "cancelled" ? (
                <button
                  onClick={() => askStatus(r.id, "cancelled")}
                  className="ger-btn-secondary h-9 rounded-xl px-3 text-sm font-semibold"
                >
                  {tr(locale, "Cancel", "Цуцлах")}
                </button>
              ) : (
                <button
                  onClick={() => askStatus(r.id, "pending")}
                  className="ger-btn-secondary h-9 rounded-xl px-3 text-sm font-semibold"
                >
                  {tr(locale, "Restore", "Буцаах")}
                </button>
              )}
              <span className="inline-flex h-9 items-center rounded-xl border border-amber-300/30 bg-black/30 px-3 text-xs font-semibold text-amber-100/90">
                {statusLabel(locale, r.status)}
              </span>
            </div>
          </article>
            );
          })()
        ))}
      </div>
      <AdminConfirmDialog
        open={confirmDialog.open}
        locale={locale}
        title={confirmDialog.title}
        body={confirmDialog.body}
        tone={confirmDialog.tone}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={tr(locale, "Back", "Буцах")}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      />
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

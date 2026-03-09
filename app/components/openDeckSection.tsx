"use client";

import { useEffect, useMemo, useState } from "react";
import { Locale, tr } from "@/lib/i18n";

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  isOpen: boolean;
  reservation: { id: string; djName: string; status: string } | null;
};

type Day = {
  id: string;
  eventDate: string;
  slots: Slot[];
};

type ApprovedRow = {
  id: string;
  djName: string;
  genre: string;
  socialUrl: string | null;
  slot: {
    startsAt: string;
    endsAt: string;
    day: { eventDate: string };
  } | null;
};

type Props = {
  locale: Locale;
  days: Day[];
  approved: ApprovedRow[];
};

function fmtDateOnly(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function extractType(value: string) {
  const raw = String(value || "").trim();
  const parts = raw
    .split(/\s\|\s/)
    .map((x) => x.trim())
    .filter(Boolean);
  return parts[0] || raw;
}

export default function OpenDeckSection({ locale, days, approved }: Props) {
  const [daysState, setDaysState] = useState<Day[]>(days);
  const [approvedState, setApprovedState] = useState<ApprovedRow[]>(approved);
  const [requesterName, setRequesterName] = useState("");
  const [phone, setPhone] = useState("");
  const [djName, setDjName] = useState("");
  const [djType, setDjType] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<
    "idle" | "pending" | "approved" | "rejected" | "cancelled"
  >("idle");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const allSlots = useMemo(
    () =>
      daysState.flatMap((d) =>
        d.slots.map((s) => ({
          ...s,
          dayId: d.id,
          eventDate: d.eventDate,
          isTaken: !!(
            s.reservation &&
            ["pending", "approved"].includes(s.reservation.status)
          ),
        })),
      ),
    [daysState],
  );

  const chosen = allSlots.find((s) => s.id === selectedSlot) ?? null;
  const approvedGrouped = useMemo(() => {
    return approvedState.reduce<Record<string, ApprovedRow[]>>((acc, row) => {
      const key = row.slot
        ? fmtDateOnly(row.slot.day.eventDate)
        : tr(locale, "No Date", "Огноогүй");
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [approvedState, locale]);

  const approvedDays = useMemo(() => {
    return Object.keys(approvedGrouped).sort((a, b) => {
      const ta = Date.parse(a.replace(/\./g, "-"));
      const tb = Date.parse(b.replace(/\./g, "-"));
      if (Number.isNaN(ta) || Number.isNaN(tb)) return a.localeCompare(b);
      return ta - tb;
    });
  }, [approvedGrouped]);

  const noSchedule = daysState.length === 0;

  useEffect(() => {
    setDaysState(days);
  }, [days]);

  useEffect(() => {
    setApprovedState(approved);
  }, [approved]);

  const refreshOpenDeckData = async () => {
    const res = await fetch("/api/open-deck", { cache: "no-store" }).catch(
      () => null,
    );
    if (!res?.ok) return;
    const data = (await res.json()) as {
      days?: Day[];
      approved?: ApprovedRow[];
    };
    setDaysState(Array.isArray(data.days) ? data.days : []);
    setApprovedState(Array.isArray(data.approved) ? data.approved : []);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refreshOpenDeckData();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshOpenDeckData();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!trackingId || trackingStatus !== "pending") return;

    const poll = setInterval(async () => {
      const res = await fetch(`/api/open-deck/${trackingId}`, {
        cache: "no-store",
      }).catch(() => null);
      if (!res?.ok) return;
      const data = (await res.json()) as { status?: string };
      const s = String(data?.status ?? "");
      if (s === "approved") {
        setTrackingStatus("approved");
        await refreshOpenDeckData();
        setTimeout(() => {
          setStatusDialogOpen(false);
          setTrackingId(null);
          setTrackingStatus("idle");
          window.location.reload();
        }, 1600);
        return;
      }
      if (s === "rejected") {
        setTrackingStatus("rejected");
        setTimeout(() => {
          setStatusDialogOpen(false);
          setTrackingId(null);
          setTrackingStatus("idle");
        }, 1800);
        return;
      }
      if (s === "cancelled") {
        setTrackingStatus("cancelled");
        setTimeout(() => {
          setStatusDialogOpen(false);
          setTrackingId(null);
          setTrackingStatus("idle");
        }, 1800);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [trackingId, trackingStatus]);

  const submit = async () => {
    setMsg(null);
    if (
      !requesterName.trim() ||
      !phone.trim() ||
      !djName.trim() ||
      !djType.trim() ||
      !selectedSlot
    ) {
      setMsg(
        tr(
          locale,
          "Please fill required fields",
          "Шаардлагатай мэдээллээ бөглөнө үү",
        ),
      );
      return;
    }

    setSaving(true);
    try {
      const performerType = djType.trim();
      const res = await fetch("/api/open-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot,
          requesterName,
          phone,
          djName,
          type: performerType,
          genre: performerType,
          socialUrl,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(
          body?.message || tr(locale, "Submit failed", "Илгээхэд алдаа гарлаа"),
        );
        return;
      }
      setRequesterName("");
      setPhone("");
      setDjName("");
      setDjType("");
      setSocialUrl("");
      const chosenSlotId = selectedSlot;
      setSelectedSlot("");

      setDaysState((prev) =>
        prev.map((d) => ({
          ...d,
          slots: d.slots.map((s) =>
            s.id === chosenSlotId
              ? {
                  ...s,
                  reservation: {
                    id: String(body?.id ?? `pending-${Date.now()}`),
                    djName,
                    status: "pending",
                  },
                }
              : s,
          ),
        })),
      );
      setTrackingId(String(body?.id ?? ""));
      setTrackingStatus("pending");
      setStatusDialogOpen(true);
      setMsg(
        tr(
          locale,
          "Request sent. Please wait. It will show as Approved after admin confirmation.",
          "Хүсэлт илгээгдлээ. Түр хүлээнэ үү. Админ баталгаажуулсны дараа Баталгаажсан гэж гарна.",
        ),
      );
      void refreshOpenDeckData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ger-surface rounded-3xl p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="ger-kicker">Open Deck</p>
          <h2 className="jazz-heading text-4xl text-[#2f2116]">
            {tr(locale, "DJ Open Deck", "DJ Open Deck")}
          </h2>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-amber-300/45 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {tr(
          locale,
          "Important: If you are more than 15 minutes late, your slot will be cancelled automatically.",
          "Анхааруулга: 15 минутаас илүү хоцорвол таны слот автоматаар цуцлагдана.",
        )}
      </div>

      {noSchedule ? (
        <div className="rounded-2xl border border-[#d6bea2] bg-white p-5 text-sm text-[#5a412d]">
          {tr(
            locale,
            "Open Deck schedule is not available.",
            "Open Deck хуваарь байхгүй байна.",
          )}
        </div>
      ) : (
        <div className="ger-surface-soft mb-4 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a5d42]">
            {tr(locale, "Active Open Deck Date", "Идэвхтэй Open Deck өдөр")}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#2f2116]">
            {chosen
              ? fmtDateOnly(chosen.eventDate)
              : tr(locale, "Select a slot below", "Доорх слотоос сонгоно уу")}
          </p>
        </div>
      )}

      <div
        className={`grid gap-4 ${noSchedule ? "xl:grid-cols-1" : "xl:grid-cols-[1.2fr_0.8fr]"}`}
      >
        {!noSchedule ? (
          <div className="ger-surface-soft rounded-2xl border border-[#dcc7b1] bg-[linear-gradient(160deg,#fff8f0_0%,#fff2e4_100%)] p-4">
            <p className="text-sm font-semibold text-[#2f2116]">
              {tr(locale, "Open Deck Registration", "Open Deck бүртгэл")}
            </p>
            <p className="mt-1 text-xs text-[#6f543d]">
              {tr(
                locale,
                "Fill your details and choose one available slot.",
                "Өөрийн мэдээллээ бөглөөд нэг сул слот сонгоно уу.",
              )}
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                  {tr(locale, "Your Name", "Таны нэр")}
                </span>
                <input
                  className="h-11 rounded-xl border border-[#d6bea2] bg-white/90 px-3 text-sm text-[#2f2116]"
                  placeholder={tr(
                    locale,
                    "Enter full name",
                    "Бүтэн нэр оруулна уу",
                  )}
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                  {tr(locale, "Phone", "Утас")}
                </span>
                <input
                  className="h-11 rounded-xl border border-[#d6bea2] bg-white/90 px-3 text-sm text-[#2f2116]"
                  placeholder={tr(locale, "Your phone number", "Утасны дугаар")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                  {tr(locale, "DJ Name", "DJ нэр")}
                </span>
                <input
                  className="h-11 rounded-xl border border-[#d6bea2] bg-white/90 px-3 text-sm text-[#2f2116]"
                  placeholder={tr(locale, "Stage name", "Тайзны нэр")}
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                  {tr(locale, "Type", "Төрөл")}
                </span>
                <input
                  className="h-11 rounded-xl border border-[#d6bea2] bg-white/90 px-3 text-sm text-[#2f2116]"
                  placeholder={tr(locale, "Techno, House", "Techno, House")}
                  value={djType}
                  onChange={(e) => setDjType(e.target.value)}
                />
              </label>
              <label className="grid gap-1 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5d42]">
                  {tr(
                    locale,
                    "Social Link (Optional)",
                    "Сошиал линк (заавал биш)",
                  )}
                </span>
                <input
                  className="h-11 rounded-xl border border-[#d6bea2] bg-white/90 px-3 text-sm text-[#2f2116]"
                  placeholder={tr(
                    locale,
                    "Instagram / SoundCloud / Mixcloud URL",
                    "Instagram / SoundCloud / Mixcloud URL",
                  )}
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-[#d9c4ad] bg-[#fffaf4] px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                {tr(locale, "Selected Slot", "Сонгосон слот")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f2116]">
                {chosen
                  ? `${fmtDateOnly(chosen.eventDate)} • ${fmtTime(chosen.startsAt)} - ${fmtTime(chosen.endsAt)}`
                  : tr(locale, "No slot selected", "Слот сонгоогүй байна")}
              </p>
            </div>

            <div className="mt-3 grid gap-3">
              {daysState.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-[#e7d8c7] bg-[#fffaf4] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                    {fmtDateOnly(d.eventDate)}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {d.slots.map((s) => {
                      const isTaken = !!(
                        s.reservation &&
                        ["pending", "approved"].includes(s.reservation.status)
                      );
                      const disabled = !s.isOpen || isTaken;
                      const selected = selectedSlot === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => !disabled && setSelectedSlot(s.id)}
                          disabled={disabled}
                          className={[
                            "rounded-lg border px-3 py-2.5 text-left text-xs transition",
                            selected
                              ? "border-[#8f6b48] bg-[#f0ddc7] text-[#2f2116] shadow-[0_2px_10px_rgba(143,107,72,0.15)]"
                              : disabled
                                ? "border-[#d8c9b7] bg-[#f4eee6] text-[#9a8772] cursor-not-allowed"
                                : "border-[#d6bea2] bg-white text-[#2f2116] hover:bg-[#f8efe4]",
                          ].join(" ")}
                        >
                          <div className="font-semibold tracking-wide">
                            {fmtTime(s.startsAt)} - {fmtTime(s.endsAt)}
                          </div>
                          <div className="mt-1 inline-flex rounded-full border border-[#d9c6b2] bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                            {!s.isOpen
                              ? tr(locale, "Closed", "Хаалттай")
                              : isTaken
                                ? tr(locale, "Booked", "Авсан")
                                : tr(locale, "Available", "Сул")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={submit}
                disabled={saving || noSchedule}
                className="ger-btn-primary min-w-[190px] rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {saving
                  ? tr(locale, "Please wait...", "Түр хүлээнэ үү...")
                  : tr(locale, "Register Slot", "Слот бүртгүүлэх")}
              </button>
            </div>
            {msg ? (
              <div className="mt-3 rounded-xl border border-[#dfc8ad] bg-[#fff8ef] px-3 py-2 text-sm text-[#5a412d]">
                {msg}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ger-surface-soft rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#2f2116]">
            {tr(locale, "Open Deck DJs", "Open Deck DJ-нууд")}
          </p>
          <div className="mt-3 grid gap-3">
            {approvedDays.map((day) => (
              <div
                key={day}
                className="rounded-xl border border-[#e7d8c7] bg-[#fffaf4] p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5d42]">
                  {day}
                </p>
                <div className="mt-2 grid gap-2">
                  {approvedGrouped[day].map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-[#e4d2be] bg-white p-2"
                    >
                      {(() => {
                        const type = extractType(row.genre);
                        return (
                          <>
                            <p className="text-sm font-semibold text-[#2f2116]">
                              {row.djName}
                            </p>
                            <p className="mt-1">
                              <span className="rounded-full border border-[#dfccb6] bg-[#fff8ef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a503a]">
                                {type || tr(locale, "Type", "Төрөл")}
                              </span>
                            </p>
                            <p className="text-xs text-[#6a503a]">
                              {row.slot
                                ? `${fmtTime(row.slot.startsAt)} - ${fmtTime(row.slot.endsAt)}`
                                : "-"}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {approvedState.length === 0 ? (
              <p className="text-sm text-[#6a503a]">
                {tr(
                  locale,
                  "No approved slots yet.",
                  "Одоогоор батлагдсан слот алга.",
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {statusDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-300/30 bg-[#1d140e] p-5 text-amber-50 shadow-2xl">
            {trackingStatus === "pending" ? (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 animate-spin rounded-full border-2 border-amber-200/35 border-t-amber-200" />
                <div>
                  <p className="text-lg font-semibold">
                    {tr(locale, "Please wait...", "Түр хүлээнэ үү...")}
                  </p>
                  <p className="mt-1 text-sm text-amber-100/80">
                    {tr(
                      locale,
                      "Your request is sent. Waiting for admin approval in realtime.",
                      "Таны хүсэлт илгээгдсэн. Админы баталгаажуулалтыг realtime хүлээж байна.",
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            {trackingStatus === "approved" ? (
              <div>
                <p className="text-lg font-semibold text-emerald-300">
                  {tr(locale, "Approved", "Баталгаажсан")}
                </p>
                <p className="mt-1 text-sm text-amber-100/80">
                  {tr(
                    locale,
                    "Your Open Deck request is approved.",
                    "Таны Open Deck хүсэлт баталгаажсан.",
                  )}
                </p>
              </div>
            ) : null}

            {trackingStatus === "rejected" ? (
              <div>
                <p className="text-lg font-semibold text-rose-300">
                  {tr(locale, "Rejected", "Татгалзсан")}
                </p>
                <p className="mt-1 text-sm text-amber-100/80">
                  {tr(
                    locale,
                    "Your request was rejected by admin.",
                    "Таны хүсэлтийг админ татгалзлаа.",
                  )}
                </p>
              </div>
            ) : null}

            {trackingStatus === "cancelled" ? (
              <div>
                <p className="text-lg font-semibold text-amber-200">
                  {tr(locale, "Cancelled", "Цуцлагдсан")}
                </p>
                <p className="mt-1 text-sm text-amber-100/80">
                  {tr(
                    locale,
                    "Your request was cancelled.",
                    "Таны хүсэлт цуцлагдсан байна.",
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

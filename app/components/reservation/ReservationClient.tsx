/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Armchair } from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabase/browser";
import { useLocale } from "@/app/components/use-locale";
import { tr } from "@/lib/i18n";
import {
  combineDateAndTime,
  pad2,
  toDateInput,
  toTimeInput,
} from "@/lib/datetime";
import { getReservationSurcharge } from "@/lib/reservation-pricing";

type Props = {
  eventId?: string | null;
  eventTitle: string;
  eventPrice: number;
  eventCurrency: string;
  djName?: string | null;
  djType?: string | null;
  startsAt: string;
  endsAt: string | null;
  eventDescription?: string | null;
  eventImageUrl?: string | null;
  venue?: string | null;
  paymentRequired?: boolean;
};

type Zone = "left" | "center" | "rightEntrance" | "rightCorner";
type SeatRange = "2-3" | "4-6";

type Table = {
  id: string;
  label: string;
  zone: Zone;
  seats: SeatRange;
  status: "available" | "reserved";
};

type PaymentTicket = {
  reservationId: string;
  tableNo: number;
  amount: number;
  surchargeAmount: number;
  currency: string;
  reference: string;
  status: "pending_payment" | "confirmed" | "cancelled" | "rejected";
};

const BANK_ACCOUNT_NAME = "Гансүх Маралмаа";
const BANK_NAME = "Khan Bank";
const BANK_ACCOUNT_NO = "5300547070";

const BASE_TABLES: Omit<Table, "status">[] = [
  { id: "T1", label: "1", zone: "left", seats: "4-6" },
  { id: "T2", label: "2", zone: "left", seats: "4-6" },
  { id: "T3", label: "3", zone: "left", seats: "4-6" },
  { id: "T4", label: "4", zone: "left", seats: "2-3" },
  { id: "T5", label: "5", zone: "left", seats: "2-3" },
  { id: "T6", label: "6", zone: "center", seats: "2-3" },
  { id: "T7", label: "7", zone: "center", seats: "2-3" },
  { id: "T8", label: "8", zone: "center", seats: "2-3" },
  { id: "T9", label: "9", zone: "center", seats: "2-3" },
  { id: "T10", label: "10", zone: "center", seats: "2-3" },
  { id: "T11", label: "11", zone: "center", seats: "2-3" },
  { id: "T12", label: "12", zone: "rightEntrance", seats: "2-3" },
  { id: "T13", label: "13", zone: "rightEntrance", seats: "2-3" },
  { id: "T14", label: "14", zone: "rightEntrance", seats: "2-3" },
  { id: "T15", label: "15", zone: "rightEntrance", seats: "2-3" },
  { id: "T16", label: "16", zone: "rightEntrance", seats: "2-3" },
  { id: "T17", label: "17", zone: "rightEntrance", seats: "2-3" },
  { id: "T18", label: "18", zone: "rightCorner", seats: "2-3" },
  { id: "T19", label: "19", zone: "rightCorner", seats: "4-6" },
  { id: "T20", label: "20", zone: "rightCorner", seats: "4-6" },
  { id: "T21", label: "21", zone: "rightCorner", seats: "4-6" },
  { id: "T22", label: "22", zone: "rightCorner", seats: "4-6" },
];

const cn = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(" ");

function parseSeats(range: SeatRange) {
  const [a, b] = range.split("-").map((x) => Number(x));
  return { min: a, max: b };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

function maxTime(a: string, b: string) {
  return a >= b ? a : b;
}

function ZoneBlock({
  title,
  tables,
  selected,
  onSelect,
  locale,
}: {
  title: string;
  tables: Table[];
  selected: string | null;
  onSelect: (id: string) => void;
  locale: "en" | "mn";
}) {
  return (
    <div className="reservation-soft rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-amber-100/70">{title}</p>

      <div className="grid grid-cols-2 gap-3">
        {tables.map((t) => {
          const isSelected = selected === t.id;
          const isReserved = t.status === "reserved";
          const seat = parseSeats(t.seats);

          return (
            <button
              key={t.id}
              type="button"
              disabled={isReserved}
              onClick={() => onSelect(t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                isReserved &&
                  "cursor-not-allowed border-neutral-500/50 bg-neutral-900/50 text-neutral-400",
                !isReserved &&
                  !isSelected &&
                  "border-amber-300/30 bg-black/25 text-amber-50 hover:border-amber-300/60 hover:bg-amber-300/15",
                isSelected &&
                  "border-amber-200 bg-[linear-gradient(180deg,#f5d7aa_0%,#e9b873_100%)] text-neutral-900",
              )}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>
                  {tr(locale, "Table", "Ширээ")} {t.label}
                </span>
              </div>

              <span>
                {seat.min}-{seat.max} {tr(locale, "people", "хүн")}
              </span>

              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: seat.max }).map((_, i) => (
                  <Armchair key={i} className="h-4 w-4 opacity-90" />
                ))}
              </div>

              {isReserved && (
                <p className="mt-2 text-[11px] font-semibold text-neutral-500">
                  RESERVED
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReservationClient({
  eventId,
  eventTitle,
  eventPrice,
  eventCurrency,
  djName,
  djType,
  startsAt,
  endsAt,
  eventDescription,
  eventImageUrl,
  venue,
  paymentRequired = true,
}: Props) {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [people, setPeople] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [paymentTicket, setPaymentTicket] = useState<PaymentTicket | null>(
    null,
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const defaultEventDate = useMemo(() => toDateInput(startsAt), [startsAt]);
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const defaultReservationTime = useMemo(
    () => maxTime(toTimeInput(startsAt), "18:00"),
    [startsAt],
  );
  const [reservedTime, setReservedTime] = useState(defaultReservationTime);
  const reservedForLocal = useMemo(
    () => combineDateAndTime(eventDate, reservedTime),
    [eventDate, reservedTime],
  );

  const [reservedSet, setReservedSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setEventDate(defaultEventDate);
  }, [defaultEventDate]);

  useEffect(() => {
    setReservedTime(defaultReservationTime);
  }, [defaultReservationTime]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseClient.auth.getSession();
      const t = data.session?.access_token ?? null;
      setToken(t);
      setIsLoggedIn(!!t);
    };

    load();

    const { data: sub } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        const t = session?.access_token ?? null;
        setToken(t);
        setIsLoggedIn(!!t);
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const run = async () => {
      setMsg(null);
      setSelected(null);
      if (!reservedForLocal) return;

      const iso = new Date(reservedForLocal).toISOString();
      const sp = new URLSearchParams();
      if (eventId) sp.set("eventId", eventId);
      sp.set("reservedFor", iso);
      const res = await fetch(
        `/api/reservations?${sp.toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;

      const data = await res.json();
      setReservedSet(new Set<number>((data?.reserved || []) as number[]));
    };

    run();
  }, [reservedForLocal, eventId]);

  const tables: Table[] = useMemo(() => {
    return BASE_TABLES.map((t) => ({
      ...t,
      status: reservedSet.has(Number(t.label)) ? "reserved" : "available",
    }));
  }, [reservedSet]);

  const left = tables.filter((t) => t.zone === "left");
  const center = tables.filter((t) => t.zone === "center");
  const rightEntrance = tables.filter((t) => t.zone === "rightEntrance");
  const rightCorner = tables.filter((t) => t.zone === "rightCorner");

  const current = useMemo(
    () => tables.find((t) => t.id === selected) ?? null,
    [tables, selected],
  );

  const seat = current ? parseSeats(current.seats) : { min: 1, max: 2 };
  const minPeople = seat.min;
  const maxPeople = seat.max;
  const safePeople = Math.min(Math.max(minPeople, people), maxPeople);
  const surchargeAmount = useMemo(
    () =>
      paymentRequired
        ? getReservationSurcharge(reservedForLocal, reservedSet.size)
        : 0,
    [paymentRequired, reservedForLocal, reservedSet],
  );
  const totalPrice = safePeople * eventPrice + surchargeAmount;

  useEffect(() => {
    if (!current) return;
    setPeople(parseSeats(current.seats).min);
  }, [current]);

  const refreshReserved = async () => {
    if (!reservedForLocal) return;
    const iso = new Date(reservedForLocal).toISOString();
    const sp = new URLSearchParams();
    if (eventId) sp.set("eventId", eventId);
    sp.set("reservedFor", iso);
    const res = await fetch(
      `/api/reservations?${sp.toString()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return;
    const data = await res.json();
    setReservedSet(new Set<number>((data?.reserved || []) as number[]));
  };

  const submitReservation = async () => {
    if (!reservedForLocal) {
      setMsg(
        tr(
          locale,
          "Please choose a reservation time.",
          "Захиалах цагаа сонгоно уу.",
        ),
      );
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        guests: safePeople,
        tableNo: Number(current?.label),
        reservedFor: new Date(reservedForLocal).toISOString(),
        note: note.trim() || undefined,
        acceptedPolicy: true,
      };
      if (eventId) payload.eventId = eventId;

      if (!token) {
        payload.name = name.trim();
        payload.phone = phone.trim();
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data = await res.json().catch(() => null);
        const reservationId = String(data?.reservation?.id ?? "");

        setMsg(
          paymentRequired
            ? tr(
                locale,
                "Reservation request sent. Complete bank transfer and wait for admin approval.",
                "Захиалгын хүсэлт илгээгдлээ. Дансаар төлбөрөө хийж админы баталгаажуулалтыг хүлээнэ үү.",
              )
            : tr(
                locale,
                "Reservation confirmed.",
                "Захиалга баталгаажлаа.",
              ),
        );

        if (reservationId && paymentRequired) {
          const tableNo = Number(current?.label ?? 0);
          const reference = String(
            data?.payment?.reference ??
              `RSV-T${tableNo}-${reservationId.slice(0, 8).toUpperCase()}`,
          );
          setPaymentTicket({
            reservationId,
            tableNo,
            amount: Number(data?.payment?.totalAmount ?? totalPrice),
            surchargeAmount: Number(data?.payment?.surchargeAmount ?? surchargeAmount),
            currency: eventCurrency,
            reference,
            status: "pending_payment",
          });
          setPaymentDialogOpen(true);
        }

        await refreshReserved();
        setSelected(null);
        setNote("");
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setMsg(
          data?.message ||
            tr(
              locale,
              "Sorry, this table was just reserved by another customer.",
              "Уучлаарай, энэ ширээг яг одоо өөр хүн захиалчихлаа.",
            ),
        );
        await refreshReserved();
        setSelected(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(
          data?.message || tr(locale, "Something went wrong.", "Алдаа гарлаа."),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    setMsg(null);

    if (!current)
      return setMsg(
        tr(locale, "Please select a table first.", "Эхлээд ширээ сонгоно уу."),
      );
    if (current.status === "reserved") {
      return setMsg(
        tr(
          locale,
          "This table is already reserved. Please choose another table.",
          "Энэ ширээ дүүрсэн байна. Өөр ширээ сонгоно уу.",
        ),
      );
    }

    if (!token && (!name.trim() || !phone.trim())) {
      return setMsg(
        tr(
          locale,
          "If you are not logged in, name and phone are required.",
          "Нэвтрээгүй бол нэр болон утас заавал бөглөнө.",
        ),
      );
    }

    if (!acceptedPolicy) {
      setPolicyOpen(true);
      return;
    }

    await submitReservation();
  };

  const agreePolicyAndReserve = async () => {
    setAcceptedPolicy(true);
    setPolicyOpen(false);
    await submitReservation();
  };

  useEffect(() => {
    if (!paymentTicket || !token) return;

    let alive = true;
    const tick = async () => {
      const res = await fetch("/api/my/reservations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }).catch(() => null);
      if (!alive || !res?.ok) return;
      const rows = (await res.json()) as Array<{ id: string; status: string }>;
      const match = rows.find((r) => r.id === paymentTicket.reservationId);
      if (!match) return;
      if (
        match.status === "pending_payment" ||
        match.status === "confirmed" ||
        match.status === "cancelled" ||
        match.status === "rejected"
      ) {
        setPaymentTicket((prev) =>
          prev
            ? { ...prev, status: match.status as PaymentTicket["status"] }
            : prev,
        );
      }
    };

    tick();
    const timer = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [paymentTicket, token]);

  useEffect(() => {
    if (!paymentDialogOpen || !paymentTicket) return;
    if (paymentTicket.status !== "confirmed") return;

    const timer = setTimeout(async () => {
      setPaymentDialogOpen(false);
      await refreshReserved();
    }, 1400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentDialogOpen, paymentTicket?.status]);

  return (
    <main className="reservation-shell mx-auto max-w-6xl px-3 py-16 sm:px-4 sm:py-20">
      <section className="reservation-panel mb-8 overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-[260px_1fr]">
          <div className="relative h-44 sm:h-52 md:h-full">
            {eventImageUrl ? (
              <img
                src={eventImageUrl}
                alt={eventTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,215,170,0.18),transparent_58%),linear-gradient(180deg,rgba(51,35,24,0.96)_0%,rgba(23,16,12,0.98)_100%)] text-sm text-amber-100/70">
                {tr(locale, "No image", "Зураг алга")}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 md:bg-gradient-to-r md:from-black/25 md:via-black/0 md:to-black/0" />
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <p className="jazz-heading text-sm text-amber-200">
              {tr(locale, "Event", "Эвент")}
            </p>
            <h1 className="jazz-heading mt-1 text-[2rem] text-amber-50 sm:text-4xl">
              {eventTitle}
            </h1>

            <div className="mt-2 text-sm text-amber-100/80">
              <p>
                🗓 {formatDateTime(startsAt)}
                {endsAt ? ` — ${formatDateTime(endsAt)}` : ""}
              </p>
              <p className="mt-1">📍 {venue || "78MusicBar"}</p>
              {djName ? (
                <p className="mt-2 text-amber-50/80">
                  {tr(locale, "DJ name", "DJ нэр")}:{" "}
                  <span className="font-semibold text-amber-100">{djName}</span>
                </p>
              ) : null}
              {djType ? (
                <p className="mt-2 inline-flex rounded-full border border-amber-300/35 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">
                  {tr(locale, "DJ type", "DJ төрөл")}: {djType}
                </p>
              ) : null}
              {paymentRequired ? (
                <>
                  <p className="mt-1">
                    💳 {tr(locale, "Price per person", "1 хүний үнэ")}:{" "}
                    <span className="font-semibold text-amber-200">
                      {eventPrice.toLocaleString()} {eventCurrency}
                    </span>
                  </p>
                  <p className="mt-1">
                    💰 {tr(locale, "Total", "Нийт")}:{" "}
                    <span className="font-semibold text-amber-200">
                      {totalPrice.toLocaleString()} {eventCurrency}
                    </span>
                  </p>
                </>
              ) : null}
              {paymentRequired && surchargeAmount > 0 ? (
                <p className="mt-1 text-amber-100/90">
                  ⚠ {tr(locale, "Busy / late surcharge", "Ачаалал / оройн нэмэгдэл")}:{" "}
                  <span className="font-semibold text-amber-200">
                    +{surchargeAmount.toLocaleString()} {eventCurrency}
                  </span>
                </p>
              ) : null}
            </div>

            {eventDescription ? (
              <p className="mt-4 text-sm leading-relaxed text-amber-100/80">
                {eventDescription}
              </p>
            ) : (
              <p className="mt-4 text-sm text-amber-100/70">
                {tr(locale, "No description.", "Тайлбар оруулаагүй байна.")}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <div className="reservation-panel rounded-2xl p-4">
          <div className="mb-4 rounded-xl bg-[linear-gradient(180deg,#f5d7aa_0%,#e9b873_100%)] py-3 text-center text-sm font-semibold text-neutral-900">
            {tr(locale, "STAGE", "ТАЙЗ")}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ZoneBlock
              title={tr(locale, "LEFT SIDE (1-5)", "ЗҮҮН ТАЛ (1-5)")}
              tables={left}
              selected={selected}
              onSelect={setSelected}
              locale={locale}
            />
            <ZoneBlock
              title={tr(locale, "CENTER (6-11)", "ГОЛ (6-11)")}
              tables={center}
              selected={selected}
              onSelect={setSelected}
              locale={locale}
            />

            <div className="grid gap-4">
              <ZoneBlock
                title={tr(locale, "RIGHT SIDE (12-16)", "БАРУУН ТАЛ (12-16)")}
                tables={rightEntrance}
                selected={selected}
                onSelect={setSelected}
                locale={locale}
              />
              <ZoneBlock
                title={tr(
                  locale,
                  "RIGHT CORNER (17-22)",
                  "БАРУУН БУЛАН (17-22)",
                )}
                tables={rightCorner}
                selected={selected}
                onSelect={setSelected}
                locale={locale}
              />
            </div>
          </div>

          <div className="reservation-soft mt-4 rounded-xl py-3 text-center text-sm text-amber-50">
            {tr(locale, "ENTRANCE", "ҮҮД")}
          </div>
        </div>

        <div className="reservation-panel rounded-2xl p-4 sm:p-5 shadow-sm">
          <h3 className="jazz-heading text-[1.7rem] text-amber-50 sm:text-2xl">
            {tr(locale, "Reservation Details", "Захиалгын мэдээлэл")}
          </h3>

          <div className="mt-4 grid gap-3">
            <div className="reservation-soft rounded-xl px-4 py-3">
              <p className="text-sm text-amber-100/70">
                {tr(locale, "Date / Time", "Огноо / цаг")}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-amber-100/60">
                    {tr(locale, "Event day", "Эвентийн өдөр")}
                  </p>
                  <input
                    type="date"
                    value={eventDate}
                    readOnly
                    className="mt-1 w-full rounded-md px-3 py-2 text-amber-50 opacity-80"
                  />
                </div>
                <div>
                  <p className="text-xs text-amber-100/60">
                    {tr(locale, "Reservation time", "Захиалах цаг")}
                  </p>
                  <input
                    type="time"
                    step={300}
                    min="18:00"
                    value={reservedTime}
                    onChange={(e) => setReservedTime(e.target.value)}
                    className="mt-1 w-full rounded-md px-3 py-2 text-amber-50"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-100/70">
                {tr(
                  locale,
                  "Choose your arrival time from 18:00 on this event day.",
                  "Энэ өдрийн 18:00 цагаас хойших ирэх цагаа сонгоно уу.",
                )}
              </p>
              <p className="mt-2 text-xs text-amber-100/70">
                {isLoggedIn
                  ? tr(
                      locale,
                      "You are logged in. We use your account details.",
                      "Та нэвтэрсэн байна. Бүртгэлийн мэдээлэл ашиглана.",
                    )
                  : tr(
                      locale,
                      "If not logged in, name and phone are required.",
                      "Нэвтрээгүй бол нэр/утас бөглөнө.",
                    )}
              </p>
            </div>

            <div className="reservation-soft flex items-center justify-between rounded-xl px-4 py-3 text-sm">
              <span className="text-amber-100/70">
                {tr(locale, "Selected table", "Сонгосон ширээ")}
              </span>
              <span className="font-semibold text-amber-50">
                {current ? `№${current.label}` : "—"}
              </span>
            </div>

            <div className="reservation-soft rounded-xl px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-100/70">
                  {tr(locale, "Guests", "Хүний тоо")}
                </span>
                <span className="font-semibold text-amber-50">
                  {safePeople}
                </span>
              </div>

              <input
                className="mt-3 w-full"
                type="range"
                min={minPeople}
                max={maxPeople}
                value={safePeople}
                onChange={(e) => setPeople(Number(e.target.value))}
                disabled={!current}
              />

              <p className="mt-2 text-xs text-amber-100/70">
                {current
                  ? tr(
                      locale,
                      `This table is for ${minPeople}-${maxPeople} people`,
                      `Энэ ширээ ${minPeople}-${maxPeople} хүн`,
                    )
                  : tr(
                      locale,
                      "Select a table first",
                      "Эхлээд ширээ сонгоно уу",
                    )}
              </p>
            </div>

            {!isLoggedIn && (
              <>
                <div className="reservation-soft rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-100/70">
                    {tr(locale, "Name", "Нэр")}
                  </p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-md px-3 py-2 text-amber-50"
                  />
                </div>

                <div className="reservation-soft rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-100/70">
                    {tr(locale, "Phone", "Утас")}
                  </p>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-md px-3 py-2 text-amber-50"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-red-300/35 bg-red-500/10 p-3 text-xs text-red-100">
            <p className="font-semibold">
              {tr(locale, "Reservation Policy", "Захиалгын нөхцөл")}
            </p>
            <p className="mt-1">
              {tr(
                locale,
                "If you are more than 10 minutes late, your reservation may be cancelled.",
                "10 минутаас дээш хоцорвол захиалга цуцлагдаж болно.",
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={!current || loading}
            className={cn(
              "mt-6 h-11 w-full rounded-xl font-medium transition cursor-pointer",
              current && !loading
                ? "ger-btn-primary"
                : "bg-neutral-200 text-neutral-400",
            )}
            onClick={handleReserve}
          >
            {loading
              ? tr(locale, "Submitting...", "Илгээж байна...")
              : paymentRequired
                ? tr(
                    locale,
                    "Reserve & Proceed to Payment",
                    "Захиалах ба төлбөр рүү үргэлжлүүлэх",
                  )
                : tr(locale, "Reserve Table", "Ширээ захиалах")}
          </button>

          <button
            type="button"
            className="ger-btn-secondary mt-3 h-10 w-full rounded-xl cursor-pointer"
            onClick={refreshReserved}
          >
            {tr(locale, "Refresh Status", "Статус шинэчлэх")}
          </button>

          {msg && <p className="mt-3 text-sm text-amber-100/80">{msg}</p>}

          {paymentTicket && (
            <button
              type="button"
              className="ger-btn-secondary mt-4 h-10 w-full rounded-xl"
              onClick={() => setPaymentDialogOpen(true)}
            >
              {tr(locale, "Open Payment Status", "Төлбөрийн төлөв харах")}
            </button>
          )}
        </div>
      </div>

      {policyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-300/35 bg-[linear-gradient(165deg,rgba(35,26,20,0.98)_0%,rgba(26,20,15,0.98)_100%)] p-6">
            <p className="jazz-heading text-xl text-amber-100">
              {paymentRequired
                ? tr(locale, "Before Payment", "Төлбөр хийхийн өмнө")
                : tr(locale, "Before Reservation", "Захиалга хийхийн өмнө")}
            </p>
            <p className="mt-3 text-sm text-amber-100/90">
              {tr(
                locale,
                "If you are more than 10 minutes late, your reservation may be cancelled.",
                "Та 10 минутаас дээш хоцорвол захиалга цуцлагдаж болно.",
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="ger-btn-secondary h-10 flex-1 rounded-xl"
                onClick={() => setPolicyOpen(false)}
              >
                {tr(locale, "Cancel", "Болих")}
              </button>
              <button
                type="button"
                className="ger-btn-primary h-10 flex-1 rounded-xl font-semibold"
                onClick={agreePolicyAndReserve}
                disabled={loading}
              >
                {tr(locale, "I Agree", "Зөвшөөрч байна")}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentDialogOpen && paymentTicket && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-300/35 bg-[linear-gradient(165deg,rgba(35,26,20,0.98)_0%,rgba(26,20,15,0.98)_100%)] p-6">
            <p className="jazz-heading text-2xl text-amber-100">
              {tr(locale, "Payment Details", "Төлбөрийн мэдээлэл")}
            </p>

            <div className="mt-3 space-y-1 text-sm text-amber-100/90">
              <p>
                {tr(locale, "Amount", "Дүн")}:{" "}
                <span className="font-semibold">
                  {paymentTicket.amount.toLocaleString()}{" "}
                  {paymentTicket.currency}
                </span>
              </p>
              {paymentTicket.surchargeAmount > 0 ? (
                <p>
                  {tr(locale, "Surcharge", "Нэмэгдэл")}:{" "}
                  <span className="font-semibold">
                    +{paymentTicket.surchargeAmount.toLocaleString()}{" "}
                    {paymentTicket.currency}
                  </span>
                </p>
              ) : null}
              <p>
                {tr(locale, "Bank", "Банк")}:{" "}
                <span className="font-semibold">{BANK_NAME}</span>
              </p>
              <p>
                {tr(locale, "Account Name", "Данс эзэмшигч")}:{" "}
                <span className="font-semibold">{BANK_ACCOUNT_NAME}</span>
              </p>
              <p>
                {tr(locale, "Account Number", "Данс")}:{" "}
                <span className="font-semibold">{BANK_ACCOUNT_NO}</span>
              </p>
              <p>
                {tr(locale, "Payment reference", "Гүйлгээний утга")}:{" "}
                <span className="font-semibold">{paymentTicket.reference}</span>
              </p>
            </div>

            <div className="reservation-soft mt-4 rounded-xl p-3">
              {paymentTicket.status === "pending_payment" && (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-200" />
                  <div>
                    <p className="text-sm font-semibold text-amber-100">
                      {tr(locale, "Please wait...", "Түр хүлээнэ үү...")}
                    </p>
                    <p className="text-xs text-amber-100/75">
                      {tr(
                        locale,
                        "Waiting for admin payment approval.",
                        "Админы төлбөрийн баталгаажуулалтыг хүлээж байна.",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {paymentTicket.status === "confirmed" && (
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {tr(locale, "Confirmed", "Баталгаажсан")}
                  </p>
                  <p className="text-xs text-amber-100/75">
                    {tr(
                      locale,
                      "Payment approved. Reservation section is refreshing.",
                      "Төлбөр баталгаажлаа. Захиалгын хэсгийг шинэчилж байна.",
                    )}
                  </p>
                </div>
              )}

              {paymentTicket.status === "rejected" && (
                <p className="text-sm font-semibold text-red-300">
                  {tr(locale, "Payment Rejected", "Төлбөр татгалзсан")}
                </p>
              )}

              {paymentTicket.status === "cancelled" && (
                <p className="text-sm font-semibold text-neutral-200">
                  {tr(locale, "Reservation Cancelled", "Захиалга цуцлагдсан")}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="ger-btn-secondary h-10 flex-1 rounded-xl"
                onClick={() => setPaymentDialogOpen(false)}
              >
                {tr(locale, "Close", "Хаах")}
              </button>
              <button
                type="button"
                className="ger-btn-primary h-10 flex-1 rounded-xl font-semibold"
                onClick={refreshReserved}
              >
                {tr(locale, "Refresh", "Шинэчлэх")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

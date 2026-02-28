/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Armchair } from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabase/browser";
import { useLocale } from "@/app/components/use-locale";
import { tr } from "@/lib/i18n";

type Props = {
  eventId: string;
  eventTitle: string;
  eventPrice: number;
  eventCurrency: string;
  startsAt: string;
  endsAt: string | null;
  eventDescription?: string | null;
  eventImageUrl?: string | null;
  venue?: string | null;
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
  currency: string;
  reference: string;
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateTimeLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
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
    <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
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
                  "cursor-not-allowed border-neutral-600 bg-neutral-800 text-neutral-400",
                !isReserved &&
                  !isSelected &&
                  "border-amber-300/30 bg-black/30 text-amber-50 hover:border-amber-300/60",
                isSelected && "border-amber-300 bg-amber-300 text-neutral-900",
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
  startsAt,
  endsAt,
  eventDescription,
  eventImageUrl,
  venue,
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

  const [reservedForLocal, setReservedForLocal] = useState(() => {
    const d = new Date(startsAt);
    d.setSeconds(0, 0);
    return toDateTimeLocal(d);
  });

  const [reservedSet, setReservedSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

      const iso = new Date(reservedForLocal).toISOString();
      const res = await fetch(
        `/api/reservations?eventId=${encodeURIComponent(eventId)}&reservedFor=${encodeURIComponent(iso)}`,
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
  const totalPrice = safePeople * eventPrice;

  useEffect(() => {
    if (!current) return;
    setPeople(parseSeats(current.seats).min);
  }, [current]);

  const refreshReserved = async () => {
    const iso = new Date(reservedForLocal).toISOString();
    const res = await fetch(
      `/api/reservations?eventId=${encodeURIComponent(eventId)}&reservedFor=${encodeURIComponent(iso)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return;
    const data = await res.json();
    setReservedSet(new Set<number>((data?.reserved || []) as number[]));
  };

  const submitReservation = async () => {
    setLoading(true);
    try {
      const payload: any = {
        eventId,
        guests: safePeople,
        tableNo: Number(current?.label),
        reservedFor: new Date(reservedForLocal).toISOString(),
        note: note.trim() || undefined,
        acceptedPolicy: true,
      };

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
          tr(
            locale,
            "Reservation request sent. Complete bank transfer and wait for admin approval.",
            "Захиалгын хүсэлт илгээгдлээ. Дансаар төлбөрөө хийж админы баталгаажуулалтыг хүлээнэ үү.",
          ),
        );

        if (reservationId) {
          const tableNo = Number(current?.label ?? 0);
          const reference = `RSV-T${tableNo}-${reservationId.slice(0, 8).toUpperCase()}`;
          setPaymentTicket({
            reservationId,
            tableNo,
            amount: totalPrice,
            currency: eventCurrency,
            reference,
          });
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-20">
      <section className="jazz-panel mb-8 overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-[260px_1fr]">
          <div className="relative h-52 md:h-full">
            {eventImageUrl ? (
              <img
                src={eventImageUrl}
                alt={eventTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black/30 text-sm text-amber-100/70">
                {tr(locale, "No image", "Зураг алга")}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 md:bg-gradient-to-r md:from-black/25 md:via-black/0 md:to-black/0" />
          </div>

          <div className="p-5 md:p-6">
            <p className="jazz-heading text-sm text-amber-200">
              {tr(locale, "Event", "Эвент")}
            </p>
            <h1 className="jazz-heading mt-1 text-4xl text-amber-50">
              {eventTitle}
            </h1>

            <div className="mt-2 text-sm text-amber-100/80">
              <p>
                🗓 {formatDateTime(startsAt)}
                {endsAt ? ` — ${formatDateTime(endsAt)}` : ""}
              </p>
              <p className="mt-1">📍 {venue || "78MusicBar"}</p>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4">
          <div className="mb-4 rounded-xl bg-amber-300 py-3 text-center text-sm font-semibold text-neutral-900">
            {tr(locale, "STAGE / LIVE MUSIC", "ТАЙЗ / АМЬД ХӨГЖИМ")}
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

          <div className="mt-4 rounded-xl border border-amber-300/25 bg-black/30 py-3 text-center text-sm text-amber-50">
            {tr(locale, "ENTRANCE", "ОРЦ")}
          </div>
        </div>

        <div className="jazz-panel rounded-2xl p-5 shadow-sm">
          <h3 className="jazz-heading text-2xl text-amber-50">
            {tr(locale, "Reservation Details", "Захиалгын мэдээлэл")}
          </h3>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-amber-300/25 bg-black/20 px-4 py-3">
              <p className="text-sm text-amber-100/70">
                {tr(locale, "Date / Time", "Огноо / цаг")}
              </p>
              <input
                type="datetime-local"
                value={reservedForLocal}
                onChange={(e) => setReservedForLocal(e.target.value)}
                className="mt-2 w-full rounded-md border border-amber-300/30 bg-black/30 px-3 py-2 text-amber-50"
              />
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

            <div className="flex items-center justify-between rounded-xl border border-amber-300/25 bg-black/20 px-4 py-3 text-sm">
              <span className="text-amber-100/70">
                {tr(locale, "Selected table", "Сонгосон ширээ")}
              </span>
              <span className="font-semibold text-amber-50">
                {current ? `№${current.label}` : "—"}
              </span>
            </div>

            <div className="rounded-xl border border-amber-300/25 bg-black/20 px-4 py-3">
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
                <div className="rounded-xl border border-amber-300/25 bg-black/20 px-4 py-3">
                  <p className="text-sm text-amber-100/70">
                    {tr(locale, "Name", "Нэр")}
                  </p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-md border border-amber-300/30 bg-black/30 px-3 py-2 text-amber-50"
                  />
                </div>

                <div className="rounded-xl border border-amber-300/25 bg-black/20 px-4 py-3">
                  <p className="text-sm text-amber-100/70">
                    {tr(locale, "Phone", "Утас")}
                  </p>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-md border border-amber-300/30 bg-black/30 px-3 py-2 text-amber-50"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-xs text-red-100">
            <p className="font-semibold">
              {tr(locale, "Reservation Policy", "Захиалгын нөхцөл")}
            </p>
            <p className="mt-1">
              {tr(
                locale,
                "If you are more than 30 minutes late, your reservation is cancelled and payment is non-refundable.",
                "30 минутаас дээш хоцорвол захиалга автоматаар цуцлагдаж, төлбөр буцаан олгогдохгүй.",
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={!current || loading}
            className={cn(
              "mt-6 h-11 w-full rounded-xl font-medium transition",
              current && !loading
                ? "bg-amber-300 text-neutral-900 hover:bg-amber-200"
                : "bg-neutral-200 text-neutral-400",
            )}
            onClick={handleReserve}
          >
            {loading
              ? tr(locale, "Submitting...", "Илгээж байна...")
              : tr(
                  locale,
                  "Reserve & Proceed to Payment",
                  "Захиалах ба төлбөр рүү үргэлжлүүлэх",
                )}
          </button>

          <button
            type="button"
            className="mt-3 h-10 w-full rounded-xl border border-amber-300/40 text-amber-50 transition hover:bg-amber-300/15"
            onClick={refreshReserved}
          >
            {tr(locale, "Refresh Status", "Статус шинэчлэх")}
          </button>

          {msg && <p className="mt-3 text-sm text-amber-100/80">{msg}</p>}

          {paymentTicket && (
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-emerald-100">
              <p className="text-sm font-semibold">
                {tr(
                  locale,
                  "Payment Pending Approval",
                  "Төлбөр шалгагдах хүлээлттэй",
                )}
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  {tr(locale, "Amount", "Дүн")}:{" "}
                  <span className="font-semibold">
                    {paymentTicket.amount.toLocaleString()}{" "}
                    {paymentTicket.currency}
                  </span>
                </p>
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
              <p className="mt-3 text-xs text-emerald-100/90">
                {tr(
                  locale,
                  "After transfer, admin checks your payment and approves your reservation.",
                  "Төлбөр шилжүүлсний дараа админ шалгаад таны захиалгыг баталгаажуулна.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {policyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-neutral-950 p-6">
            <p className="jazz-heading text-xl text-amber-100">
              {tr(locale, "Before Payment", "Төлбөр хийхийн өмнө")}
            </p>
            <p className="mt-3 text-sm text-amber-100/90">
              {tr(
                locale,
                "If you are 30 minutes late, your reservation is cancelled and payment cannot be refunded.",
                "Та 30 минут хоцорвол захиалга цуцлагдаж, төлбөр буцаагдахгүй.",
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="h-10 flex-1 rounded-xl border border-amber-300/40 text-amber-50 transition hover:bg-amber-300/15"
                onClick={() => setPolicyOpen(false)}
              >
                {tr(locale, "Cancel", "Болих")}
              </button>
              <button
                type="button"
                className="h-10 flex-1 rounded-xl bg-amber-300 font-semibold text-neutral-900 transition hover:bg-amber-200"
                onClick={agreePolicyAndReserve}
                disabled={loading}
              >
                {tr(locale, "I Agree", "Зөвшөөрч байна")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

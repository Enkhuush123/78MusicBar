"use client";

import { useMemo, useState } from "react";
import { supabase as supabaseClient } from "@/lib/supabase/browser";
import { Locale, tr } from "@/lib/i18n";

type Review = {
  id: string;
  displayName: string;
  comment: string;
  rating: number;
};

type Props = {
  locale: Locale;
  initialReviews: Review[];
  embedded?: boolean;
};

export default function ReviewsSection({
  locale,
  initialReviews,
  embedded = false,
}: Props) {
  const [reviews] = useState<Review[]>(initialReviews);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stars = useMemo(
    () => "★".repeat(Math.max(1, Math.min(5, rating))),
    [rating],
  );

  const submit = async () => {
    setMsg(null);
    if (comment.trim().length < 6) {
      setMsg(tr(locale, "Comment is too short.", "Сэтгэгдэл хэт богино байна."));
      return;
    }

    setSaving(true);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMsg(tr(locale, "Please login first.", "Эхлээд нэвтэрнэ үү."));
        return;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment, rating }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body?.message || "Submit failed");
        return;
      }

      setComment("");
      setRating(5);
      setMsg(
        tr(
          locale,
          "Thanks! Your review was submitted for approval.",
          "Баярлалаа! Таны сэтгэгдэл баталгаажуулахаар илгээгдлээ.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={embedded ? "" : "mx-auto max-w-6xl px-4 pb-12"}>
      <div className="jazz-panel min-w-0 rounded-3xl p-4 sm:p-6 md:p-8">
        <div className="mb-5">
          <p className="ger-kicker text-amber-200">
            {tr(locale, "Community", "Хэрэглэгчдийн Сэтгэгдэл")}
          </p>
          <h2 className="jazz-heading text-[1.9rem] text-amber-50 sm:text-4xl">
            {tr(locale, "Customer Reviews", "Үйлчлүүлэгчдийн Үнэлгээ")}
          </h2>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {reviews.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="min-w-0 rounded-2xl border border-amber-300/25 bg-black/20 p-4"
            >
              <p className="text-sm font-semibold text-amber-50">
                @{r.displayName}
              </p>
              <p className="mt-1 text-xs text-amber-200">
                {"★".repeat(Math.max(1, Math.min(5, r.rating)))}
              </p>
              <p className="mt-2 text-amber-100/85">{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-amber-100/75">
              {tr(locale, "No approved reviews yet.", "Одоогоор батлагдсан сэтгэгдэл алга.")}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300/25 bg-black/20 p-4">
          <p className="text-sm font-semibold text-amber-100">
            {tr(locale, "Leave a review", "Сэтгэгдэл үлдээх")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-amber-100/80">
              {tr(locale, "Rating", "Үнэлгээ")}:
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <span className="text-amber-200">{stars}</span>
          </div>

          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-3 w-full rounded-xl border border-amber-300/30 bg-black/30 px-3 py-2 text-amber-50"
            placeholder={tr(
              locale,
              "Share your experience...",
              "Өөрийн туршлагаас хуваалцаарай...",
            )}
          />

          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              onClick={submit}
              disabled={saving}
              className="ger-btn-secondary w-full rounded-xl px-4 py-2 text-sm font-semibold sm:w-auto"
            >
              {saving
                ? tr(locale, "Submitting...", "Илгээж байна...")
                : tr(locale, "Submit Review", "Сэтгэгдэл Илгээх")}
            </button>
            {msg && <p className="text-sm text-amber-100/80">{msg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

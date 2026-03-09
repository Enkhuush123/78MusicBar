"use client";

import { tr, type Locale } from "@/lib/i18n";

type Props = {
  open: boolean;
  locale: Locale;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "amber" | "red";
  onCancel: () => void;
  onConfirm: () => void;
};

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

export default function AdminConfirmDialog({
  open,
  locale,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "amber",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-300/35 bg-[#1b130d]/95 p-5 shadow-2xl">
        <p className="jazz-heading text-2xl text-amber-100">{title}</p>
        {body ? <p className="mt-3 text-sm text-amber-100/85">{body}</p> : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 flex-1 rounded-xl border border-amber-300/40 text-amber-50 transition hover:bg-amber-300/15"
          >
            {cancelLabel || tr(locale, "Cancel", "Болих")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-10 flex-1 rounded-xl font-semibold transition",
              tone === "red"
                ? "bg-red-400 text-neutral-900 hover:bg-red-300"
                : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
            )}
          >
            {confirmLabel || tr(locale, "Confirm", "Батлах")}
          </button>
        </div>
      </div>
    </div>
  );
}

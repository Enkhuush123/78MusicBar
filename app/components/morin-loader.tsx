/* eslint-disable @next/next/no-img-element */
import { tr, type Locale } from "@/lib/i18n";

export function MorinLoader({ locale = "en" }: { locale?: Locale }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8f1e6] px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-[#b18c66]/30 bg-white/80 p-10 text-center shadow-xl backdrop-blur">
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 animate-spin rounded-full bg-[radial-gradient(circle_at_center,#1d1d1d_0%,#0f0f0f_45%,#050505_75%,#1b1b1b_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.35)]" />
          <div className="absolute inset-[6px] rounded-full border border-white/15" />
          <div className="absolute inset-[14px] rounded-full border border-white/10" />
          <div className="absolute inset-[22px] rounded-full border border-white/10" />
          <div className="absolute inset-[30px] rounded-full bg-[#e7c687] shadow-inner" />
          <div className="absolute inset-[40px] rounded-full bg-[#f6e8cc]" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7a562f]" />
          <div className="absolute -right-6 top-1/2 h-[3px] w-8 -translate-y-1/2 rounded-full bg-[#7e6143]" />
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#b89368]" />
        </div>
        <p className="jazz-heading text-3xl text-[#3a2818]">
          {tr(locale, "78MusicBar", "78MusicBar")}
        </p>
        <p className="text-sm text-[#5f4630]/80">
          {tr(locale, "Loading...", "Ачааллаж байна...")}
        </p>
      </div>
    </div>
  );
}

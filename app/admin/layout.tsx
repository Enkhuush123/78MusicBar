import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { AdminReservationNotifier } from "./_components/admin-reservation-notifier";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const locale = await getServerLocale();

  return (
    <main className="pt-24">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="jazz-shell mb-6 flex flex-wrap gap-2 rounded-2xl p-3">
          <AdminReservationNotifier locale={locale} />
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin"
          >
            {tr(locale, "Dashboard", "Хянах Самбар")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/events"
          >
            {tr(locale, "Events", "Эвент")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/menu/drinks"
          >
            {tr(locale, "Drinks Menu", "Уух зүйлсийн меню")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/menu/food"
          >
            {tr(locale, "Food Menu", "Хоолны меню")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/about"
          >
            {tr(locale, "About Us", "Бидний тухай")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/reservations"
          >
            {tr(locale, "Reservations", "Захиалгууд")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/reviews"
          >
            {tr(locale, "Reviews", "Сэтгэгдэл")}
          </Link>
          <Link
            className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-100 hover:bg-amber-200/10 transition"
            href="/admin/home"
          >
            {tr(locale, "Home", "Нүүр")}
          </Link>
        </div>

        {children}
      </div>
    </main>
  );
}

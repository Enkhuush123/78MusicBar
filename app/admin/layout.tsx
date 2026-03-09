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
  const topLinks = [
    { href: "/admin", label: tr(locale, "Dashboard", "Хянах Самбар") },
    { href: "/admin/home", label: tr(locale, "Homepage", "Нүүр") },
  ];
  const contentLinks = [
    { href: "/admin/events", label: tr(locale, "Events", "Эвент") },
    { href: "/admin/about", label: tr(locale, "About Us", "Бидний тухай") },
    { href: "/admin/reviews", label: tr(locale, "Reviews", "Сэтгэгдэл") },
    {
      href: "/admin/collections",
      label: tr(locale, "Collections", "Collection"),
    },
  ];
  const opsLinks = [
    {
      href: "/admin/reservations",
      label: tr(locale, "Reservations", "Захиалгууд"),
    },
    { href: "/admin/open-deck", label: tr(locale, "Open Deck", "Open Deck") },
    {
      href: "/admin/menu/drinks",
      label: tr(locale, "Drinks Menu", "Уух зүйлсийн меню"),
    },
    { href: "/admin/menu/food", label: tr(locale, "Food Menu", "Хоолны меню") },
  ];

  return (
    <main className="admin-theme pt-24">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:items-start md:grid-cols-[260px_1fr]">
        <aside className="admin-sidebar h-fit rounded-3xl p-4 md:sticky md:top-28">
          <p className="jazz-heading px-2 text-xs tracking-[0.08em] text-amber-200">
            {tr(locale, "78MusicBar Admin", "78MusicBar Админ")}
          </p>

          <div className="mt-3 rounded-xl border border-red-300/35 bg-red-500/10 p-2">
            <AdminReservationNotifier locale={locale} />
          </div>

          <div className="mt-4 grid gap-2">
            {topLinks.map((item) => (
              <Link key={item.href} className="admin-nav-link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <p className="admin-kicker mt-5 px-2">
            {tr(locale, "Content", "Контент")}
          </p>
          <div className="mt-2 grid gap-2">
            {contentLinks.map((item) => (
              <Link key={item.href} className="admin-nav-link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <p className="admin-kicker mt-5 px-2">
            {tr(locale, "Operations", "Үйл ажиллагаа")}
          </p>
          <div className="mt-2 grid gap-2">
            {opsLinks.map((item) => (
              <Link key={item.href} className="admin-nav-link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">{children}</section>
      </div>
    </main>
  );
}

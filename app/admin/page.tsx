import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getServerLocale();
  const shortcuts = [
    {
      href: "/admin/home",
      title: tr(locale, "Homepage", "Нүүр хуудас"),
      text: tr(
        locale,
        "Hero, slider, gallery and featured sections.",
        "Hero, slider, gallery болон featured хэсгүүд.",
      ),
    },
    {
      href: "/admin/events",
      title: tr(locale, "Events", "Эвент"),
      text: tr(
        locale,
        "Create and edit event schedule and pricing.",
        "Эвентийн хуваарь, үүсгэж засварлах.",
      ),
    },
    {
      href: "/admin/reservations",
      title: tr(locale, "Reservations", "Захиалгууд"),
      text: tr(
        locale,
        "Approve, reject, cancel, and track payments.",
        "Батлах, татгалзах, цуцлах, төлбөр хянах.",
      ),
    },
    {
      href: "/admin/about",
      title: tr(locale, "About Page", "Бидний тухай"),
      text: tr(
        locale,
        "Manage text and gallery visuals.",
        "Текст болон gallery зураг удирдах.",
      ),
    },
    {
      href: "/admin/menu/drinks",
      title: tr(locale, "Drinks Menu", "Уух зүйлсийн меню"),
      text: tr(
        locale,
        "Update drinks list and featured cocktail.",
        " Уух зүйлсийн жагсаалт болон тусгай коктейлийг нэмэх.",
      ),
    },
  ];

  return (
    <>
      <section className="jazz-panel rounded-2xl p-6">
        <p className="jazz-heading text-amber-200">
          {tr(locale, "Control Room", "Удирдлагын Хэсэг")}
        </p>
        <h1 className="jazz-heading mt-2 text-4xl text-amber-50">
          {tr(locale, "Admin Dashboard", "Админ Самбар")}
        </h1>
        <p className="mt-3 text-lg text-amber-100/80">
          {tr(
            locale,
            "Everything is connected here: pages, events, menus, reservations and media assets.",
            "Эндээс бүх зүйл нэг дор удирдагдана: хуудсууд, эвент, меню, захиалга, зураг.",
          )}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-amber-300/25 bg-[linear-gradient(160deg,rgba(60,43,30,0.96)_0%,rgba(40,30,23,0.96)_100%)] p-5 transition hover:border-amber-200/45 hover:bg-[linear-gradient(160deg,rgba(66,47,33,0.98)_0%,rgba(44,33,25,0.98)_100%)]"
          >
            <p className="jazz-heading text-2xl text-amber-100">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/75">
              {item.text}
            </p>
          </Link>
        ))}
      </section>
    </>
  );
}

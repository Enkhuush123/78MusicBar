import { requireAdmin } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getServerLocale();

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <p className="jazz-heading text-amber-200">{tr(locale, "Control Room", "Удирдлагын Хэсэг")}</p>
      <h1 className="jazz-heading mt-2 text-4xl text-amber-50">
        {tr(locale, "Admin Dashboard", "Админ Самбар")}
      </h1>
      <p className="mt-3 text-lg text-amber-100/80">
        {tr(
          locale,
          "Events, menu, home visuals, about content, and reservations are managed from this panel.",
          "Эвент, меню, нүүр зураг, танилцуулга болон захиалгыг энэ хэсгээс удирдана.",
        )}
      </p>
    </section>
  );
}

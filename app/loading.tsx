import { getServerLocale } from "@/lib/i18n-server";
import { MorinLoader } from "./components/morin-loader";

export default async function Loading() {
  const locale = await getServerLocale();
  return <MorinLoader locale={locale} />;
}

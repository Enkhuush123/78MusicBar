import Link from "next/link";
import { FaFacebookSquare, FaInstagramSquare } from "react-icons/fa";
import { Locale, tr } from "@/lib/i18n";

type FooterProps = {
  locale: Locale;
};

export const Footer = ({ locale }: FooterProps) => {
  return (
    <footer className="mt-16 border-t border-amber-300/20 bg-[#100c09] text-amber-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="jazz-heading text-2xl">78 Music Bar</p>
          <p className="mt-3 text-sm text-amber-100/80">
            {tr(
              locale,
              "Live jazz. Crafted drinks. Late-night tables.",
              "Амьд хөгжмийн үдэш. Тусгай коктейль. Оройн захиалга.",
            )}
          </p>
        </div>

        <div>
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Visit", "Хаяг")}
          </p>
          <p className="mt-3 text-sm text-amber-100/80">Ulaanbaatar, B1</p>
          <a
            className="mt-2 inline-block text-sm underline underline-offset-4"
            href="https://www.google.com/maps/place/GERMOOD/@47.9184203,106.9116743,17z/data=!3m1!4b1!4m6!3m5!1s0x5d9693006c2af817:0x7456cb07c6f2e334!8m2!3d47.9184203!4d106.9142492!16s%2Fg%2F11xs9d5gw5?entry=ttu&g_ep=EgoyMDI2MDIxNi4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noreferrer"
          >
            {tr(locale, "Open map", "Газрын зураг")}
          </a>
        </div>

        <div>
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Contact", "Холбоо барих")}
          </p>
          <p className="mt-3 text-sm text-amber-100/80">+976 8065 1328</p>
          <p className="text-sm text-amber-100/80">musicbar78@gmail.com</p>
        </div>

        <div>
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Explore", "Цэс")}
          </p>
          <div className="mt-3 grid gap-1 text-sm">
            <Link href="/events">{tr(locale, "Events", "Эвент")}</Link>
            <Link href="/menu/drinks">{tr(locale, "Drinks", "Уух зүйлс")}</Link>
            <Link href="/menu/food">{tr(locale, "Food", "Хоол")}</Link>
          </div>
          <div className="mt-4 flex gap-3">
            <a href="https://facebook.com/Cafe78barcafecoffee" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookSquare size={22} />
            </a>
            <a href="https://instagram.com/78musicbar/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagramSquare size={22} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

import Link from "next/link";
import { FaFacebookSquare, FaInstagramSquare } from "react-icons/fa";
import { Locale, tr } from "@/lib/i18n";
import Image from "next/image";

type FooterProps = {
  locale: Locale;
};

export const Footer = ({ locale }: FooterProps) => {
  return (
    <footer className="mt-10 border-t border-[#ccb89f] bg-[linear-gradient(180deg,#f7efe3_0%,#efe2d1_100%)] text-[#2d241b] sm:mt-16">
      <div className="mx-auto grid max-w-6xl gap-3 px-3 py-7 sm:gap-6 sm:px-4 sm:py-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#ddcab2] bg-white/55 p-4 lg:border-0 lg:bg-transparent lg:p-0">
          <div className="flex items-center gap-2">
            <Image
              src="/78MusicBar.png"
              width={32}
              height={32}
              alt="78MusicBar Logo"
              className="h-8 w-8 rounded-md object-cover"
            />
            <p className="jazz-heading text-2xl">78MusicBar</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#4a3f34]/85">
            {tr(
              locale,
              "Events, Special cocktails, Reserves.",
              "Эвентүүд, Тусгай коктейль, Ширээ захиалга",
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ddcab2] bg-white/55 p-4 lg:border-0 lg:bg-transparent lg:p-0">
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Visit", "Хаяг")}
          </p>
          <p className="mt-3 text-sm text-[#4a3f34]/85">Ulaanbaatar, B1</p>
          <a
            className="mt-2 inline-block text-sm underline underline-offset-4"
            href="https://www.google.com/maps/place/GERMOOD/@47.9184203,106.9116743,17z/data=!3m1!4b1!4m6!3m5!1s0x5d9693006c2af817:0x7456cb07c6f2e334!8m2!3d47.9184203!4d106.9142492!16s%2Fg%2F11xs9d5gw5?entry=ttu&g_ep=EgoyMDI2MDIxNi4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noreferrer"
          >
            {tr(locale, "Open map", "Газрын зураг")}
          </a>
        </div>

        <div className="rounded-2xl border border-[#ddcab2] bg-white/55 p-4 lg:border-0 lg:bg-transparent lg:p-0">
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Contact", "Холбоо барих")}
          </p>
          <p className="mt-3 text-sm text-[#4a3f34]/85">+976 8065 1328</p>
          <p className="break-all text-sm text-[#4a3f34]/85">78musicbar@gmail.com</p>
        </div>

        <div className="rounded-2xl border border-[#ddcab2] bg-white/55 p-4 lg:border-0 lg:bg-transparent lg:p-0">
          <p className="jazz-heading text-sm tracking-[0.18em]">
            {tr(locale, "Explore", "Цэс")}
          </p>
          <div className="mt-3 grid gap-1 text-sm">
            <Link href="/events">{tr(locale, "Events", "Эвент")}</Link>
            <Link href="/menu/drinks">{tr(locale, "Drinks", "Уух зүйлс")}</Link>
            <Link href="/menu/food">{tr(locale, "Food", "Хоол")}</Link>
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://facebook.com/Cafe78barcafecoffee"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookSquare size={22} />
            </a>
            <a
              href="https://instagram.com/78musicbar/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagramSquare size={22} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

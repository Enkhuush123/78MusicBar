import type { Metadata } from "next";
import { Bebas_Neue, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { getServerLocale } from "@/lib/i18n-server";
import GlobalImageLightbox from "./components/global-image-lightbox";

const display = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const body = Cormorant_Garamond({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "78MusicBar",
  description: "Live music nights, events, and reservations at 78MusicBar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div>
          <Header initialLocale={locale} />
        </div>

        {children}
        <Footer locale={locale} />
        <GlobalImageLightbox />
      </body>
    </html>
  );
}

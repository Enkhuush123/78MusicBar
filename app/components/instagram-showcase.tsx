/* eslint-disable @next/next/no-img-element */
import { Instagram, Heart, MessageCircle, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n";
import type { HomeInstagramPost } from "@/lib/home-instagram-posts";

type Props = {
  locale: Locale;
  posts: HomeInstagramPost[];
  profileUrl: string;
  handle: string;
};

export default function InstagramShowcase({
  locale,
  posts,
  profileUrl,
  handle,
}: Props) {
  if (!posts.length) return null;

  const [featured, ...rest] = posts;
  const featuredHref = featured.postUrl || profileUrl;

  return (
    <section className="mx-auto mt-7 max-w-7xl px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-[28px] border border-[#d4b89b] bg-[linear-gradient(155deg,#f7ebda_0%,#e9d5be_48%,#d7b08c_100%)] p-3 shadow-[0_24px_56px_rgba(66,42,23,0.16)] sm:rounded-[32px] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(255,255,255,0.62),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(88,50,23,0.16),transparent_28%)]" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="ger-kicker text-[#7b5a40]">
              {tr(locale, "Instagram Feed", "Instagram Feed")}
            </p>
            <h2 className="jazz-heading mt-2 text-3xl text-[#24170f] sm:text-4xl md:text-5xl">
              78MusicBar
            </h2>
          </div>

          <a
            href={featuredHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#6d452b] bg-[#2a1a11] px-4 py-2.5 text-sm font-semibold text-[#fff4e5] transition hover:bg-[#1d120b] sm:w-auto sm:py-3"
          >
            <Instagram className="h-4 w-4" />
            @{handle}
          </a>
        </div>

        <div className="relative mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <a
            href={featuredHref}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-[28px] border border-[#dfc6ad] bg-[linear-gradient(180deg,#fffaf3_0%,#f7ecdf_100%)] shadow-[0_18px_40px_rgba(61,36,18,0.12)]"
          >
            <div className="flex items-center gap-3 border-b border-[#ecd9c6] px-4 py-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(180deg,#4c2d1b_0%,#2a1910_100%)] text-[#f5d0a0]">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#24170f]">@{handle}</p>
              </div>
            </div>

            <div className="overflow-hidden">
              <img
                src={featured.imageUrl}
                alt="instagram featured"
                className="h-[260px] w-full object-cover object-center transition duration-700 group-hover:scale-[1.03] sm:h-[440px]"
              />
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-4 text-[#3a2618]">
                <Heart className="h-4 w-4" />
                <MessageCircle className="h-4 w-4" />
                <Send className="h-4 w-4" />
              </div>
              <p className="text-sm leading-relaxed text-[#5c4330]">
                <span className="font-semibold text-[#24170f]">@{handle}</span>{" "}
                {featured.caption}
              </p>
            </div>
          </a>

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((post, index) => (
              <a
                key={`${post.imageUrl}-${index}`}
                href={post.postUrl || profileUrl}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-[24px] border border-[#dbc1a5] bg-[linear-gradient(180deg,#fffaf4_0%,#f4e6d5_100%)] shadow-[0_16px_32px_rgba(61,36,18,0.1)]"
              >
                <div className="flex items-center justify-between border-b border-[#ead5bf] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(180deg,#4c2d1b_0%,#2a1910_100%)] text-[#f5d0a0]">
                      <Instagram className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-[#24170f]">@{handle}</p>
                  </div>
                </div>

                <img
                  src={post.imageUrl}
                  alt={`instagram-${index + 2}`}
                  className="h-44 w-full object-cover object-center transition duration-700 group-hover:scale-[1.03] sm:h-52"
                />

                <div className="space-y-2 px-3 py-3">
                  <div className="flex items-center gap-3 text-[#3a2618]">
                    <Heart className="h-4 w-4" />
                    <MessageCircle className="h-4 w-4" />
                    <Send className="h-4 w-4" />
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-[#5c4330]">
                    <span className="font-semibold text-[#24170f]">@{handle}</span>{" "}
                    {post.caption}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

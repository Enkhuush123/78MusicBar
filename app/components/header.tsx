/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Menu as MenuIcon, ChevronDown, LogOut } from "lucide-react";

import { supabase as supabaseClient } from "@/lib/supabase/browser";
import { LoginModal } from "./auth/login";
import { Locale, tr } from "@/lib/i18n";
import { useLocale } from "./use-locale";

const nav = [
  { en: "Home", mn: "Нүүр", href: "/" },
  { en: "Events", mn: "Эвент", href: "/events" },
  { en: "About", mn: "Бидний тухай", href: "/about" },
];

function getInitial(email?: string | null) {
  if (!email) return "U";
  return email.trim()[0]?.toUpperCase() ?? "U";
}

type HeaderProps = {
  initialLocale?: Locale;
};

export function Header({ initialLocale = "en" }: HeaderProps) {
  const pathname = usePathname();
  const { locale, toggleLocale } = useLocale(initialLocale);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const [openLogin, setOpenLogin] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadAdminRole = async (active: boolean) => {
    if (!active) {
      setIsAdmin(false);
      return;
    }
    const res = await fetch("/api/me/admin", { cache: "no-store" }).catch(
      () => null,
    );
    if (!res?.ok) return setIsAdmin(false);
    const data = (await res.json()) as { isAdmin?: boolean };
    setIsAdmin(!!data?.isAdmin);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseClient.auth.getSession();
      const user = data.session?.user ?? null;

      setLoggedIn(!!user);
      setUserEmail(user?.email ?? null);
      setIsAdmin(false);

      const meta: any = user?.user_metadata ?? {};
      setAvatarUrl(meta?.avatar_url ?? null);
      await loadAdminRole(!!user);
    };

    load();

    const { data: sub } = supabaseClient.auth.onAuthStateChange(
      (_e, session) => {
        const user = session?.user ?? null;

        setLoggedIn(!!user);
        setUserEmail(user?.email ?? null);
        setIsAdmin(false);

        const meta: any = user?.user_metadata ?? {};
        setAvatarUrl(meta?.avatar_url ?? null);
        void loadAdminRole(!!user);
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabaseClient.auth.signOut();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4">
        <div className="mx-auto mt-3 flex h-16 max-w-6xl items-center justify-between rounded-2xl border border-amber-400/30 bg-neutral-950/80 px-4 text-amber-100 backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md border border-amber-300/40 bg-amber-300/10" />
            <span className="jazz-heading text-lg tracking-[0.16em]">
              78 Music Bar
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {nav.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActive(item.href) ? "default" : "ghost"}
                className={
                  isActive(item.href)
                    ? "bg-amber-300 text-neutral-900 hover:bg-amber-200"
                    : "text-amber-100 hover:bg-amber-200/15 hover:text-amber-50"
                }
              >
                <Link href={item.href}>{tr(locale, item.en, item.mn)}</Link>
              </Button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  {tr(locale, "Menu", "Меню")} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/menu/drinks">{tr(locale, "Drinks", "Уух зүйлс")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/menu/food">{tr(locale, "Food", "Хоол")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              className="border-amber-300/40 bg-transparent text-amber-100 hover:bg-amber-200/15"
              onClick={toggleLocale}
            >
              {locale.toUpperCase()}
            </Button>
            {!loggedIn ? (
              <Button variant="outline" onClick={() => setOpenLogin(true)}>
                {tr(locale, "Login", "Нэвтрэх")}
              </Button>
            ) : (
              <>
                {isAdmin && (
                  <Button
                    asChild
                    className="bg-amber-300 text-neutral-900 hover:bg-amber-200"
                  >
                    <Link href="/admin">{tr(locale, "Admin", "Админ")}</Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full border p-0.5 hover:bg-neutral-50 transition"
                      aria-label="Open profile menu"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
                        <AvatarFallback>{getInitial(userEmail)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        {tr(locale, "Signed in:", "Нэвтэрсэн:")}
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {userEmail}
                      </p>
                    </div>

                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">{tr(locale, "Admin Panel", "Админ самбар")}</Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/reservation">
                        {tr(locale, "My Reservations", "Миний захиалгууд")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={logout} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      {tr(locale, "Logout", "Гарах")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>{tr(locale, "Menu", "Цэс")}</SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-amber-300/40 bg-transparent text-amber-100 hover:bg-amber-200/15"
                    onClick={toggleLocale}
                  >
                    {tr(locale, "Language", "Хэл")}: {locale.toUpperCase()}
                  </Button>

                  {nav.map((item) => (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="justify-start"
                    >
                      <Link href={item.href}>{tr(locale, item.en, item.mn)}</Link>
                    </Button>
                  ))}

                  <div className="mt-2 grid gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {tr(locale, "Menu", "Меню")}
                    </div>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/menu/drinks">{tr(locale, "Drinks", "Уух зүйлс")}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/menu/food">{tr(locale, "Food", "Хоол")}</Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {!loggedIn ? (
                      <Button
                        className="w-full"
                        onClick={() => setOpenLogin(true)}
                      >
                        {tr(locale, "Login", "Нэвтрэх")}
                      </Button>
                    ) : (
                      <>
                        {isAdmin && (
                          <Button
                            asChild
                            className="w-full justify-start bg-amber-300 text-neutral-900 hover:bg-amber-200"
                          >
                            <Link href="/admin">{tr(locale, "Admin", "Админ")}</Link>
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Link href="/reservation">
                            {tr(locale, "My Reservations", "Миний захиалгууд")}
                          </Link>
                        </Button>

                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={logout}
                        >
                          {tr(locale, "Logout", "Гарах")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <LoginModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        locale={locale}
      />
    </>
  );
}

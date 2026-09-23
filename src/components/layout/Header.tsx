import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function Header() {
  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  const dict = getDictionary(lang);

  const loggedInLinks: { href: string; label: string }[] = [
    { href: "/dashboard", label: dict.nav.dashboard },
    { href: "/assessment", label: dict.nav.assessment },
    { href: "/learn", label: dict.nav.learn },
    { href: "/organizations", label: dict.nav.organizations },
    { href: "/interview", label: dict.nav.interview },
    { href: "/progress", label: dict.nav.progress },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-900 text-sm font-bold text-paper">
            Y
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">{dict.common.appName}</span>
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {user ? (
            loggedInLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-alt hover:text-ink"
              >
                {link.label}
              </Link>
            ))
          ) : (
            <a
              href="#how-it-works"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-alt hover:text-ink"
            >
              {dict.landing.howItWorksTitle}
            </a>
          )}
          {user?.is_admin && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-alt hover:text-ink"
            >
              {dict.nav.admin}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher lang={lang} />
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-alt hover:text-ink"
              >
                {dict.nav.logout}
              </button>
            </form>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-alt hover:text-ink"
              >
                {dict.nav.login}
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-navy-900 px-3.5 py-2 text-sm font-medium text-paper hover:bg-navy-800"
              >
                {dict.nav.startPreparing}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

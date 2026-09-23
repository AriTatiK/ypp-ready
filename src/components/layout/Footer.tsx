import type { Dictionary } from "@/lib/i18n";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="border-t border-border-subtle bg-navy-950 text-paper/90">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper text-sm font-bold text-navy-900">
                Y
              </span>
              <span className="text-base font-semibold">{dict.common.appName}</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-paper/60">{dict.common.tagline}</p>
          </div>
          <div className="max-w-xl text-xs leading-relaxed text-paper/60">
            <p>{dict.footer.disclaimer}</p>
            <p className="mt-2">{dict.footer.practiceNotice}</p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-paper/40">
          © {new Date().getFullYear()} {dict.common.appName}. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}

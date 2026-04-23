import { LINKS, SITE } from "@/lib/site-links";
import { TIP } from "@/lib/ui-tips";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/50">
      <div className="flex w-full">
        <div className="hidden w-80 shrink-0 md:block" aria-hidden />
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-200" title={TIP.brand}>
            {SITE.shortTagline}
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            <a
              href={LINKS.bounty}
              target="_blank"
              rel="noreferrer"
              className="text-sky-500/90 underline decoration-sky-500/30 transition hover:text-sky-300"
              title={TIP.footerBounty}
            >
              Frontier / Cloak track
            </a>
            <span className="mx-2 text-slate-600">·</span>
            <a
              href={LINKS.cloak}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 transition hover:text-slate-300"
              title={TIP.footerCloak}
            >
              Cloak
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

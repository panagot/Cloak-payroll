import { clusterShortTagline } from "@/lib/constants";
import { LINKS } from "@/lib/site-links";
import { TIP } from "@/lib/ui-tips";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-indigo-100/50 bg-white/70 backdrop-blur-sm">
      <div className="flex w-full">
        <div className="hidden w-80 shrink-0 md:block" aria-hidden />
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-800" title={TIP.brand}>
            {clusterShortTagline()}
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            <a
              href={LINKS.bounty}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 underline decoration-indigo-300/80 transition hover:text-indigo-900"
              title={TIP.footerBounty}
            >
              Frontier / Cloak track
            </a>
            <span className="mx-2 text-slate-300">·</span>
            <a
              href={LINKS.cloak}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 transition hover:text-indigo-700"
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

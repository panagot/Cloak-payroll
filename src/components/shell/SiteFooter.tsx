import { SITE } from "@/lib/site-links";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/50">
      <div className="flex w-full">
        <div className="hidden w-80 shrink-0 md:block" aria-hidden />
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-200">
            {SITE.shortTagline}
          </p>
        </div>
      </div>
    </footer>
  );
}

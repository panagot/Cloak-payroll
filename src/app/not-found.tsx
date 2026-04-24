import Link from "next/link";
import { SITE } from "@/lib/site-links";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{SITE.name}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        That URL does not exist. Use the main flows below or the nav in the header.
      </p>
      <div className="mt-6 flex max-w-xs flex-col gap-2 text-sm sm:mx-auto">
        <Link className="btn-primary w-full text-center" href="/">
          Treasury
        </Link>
        <Link className="btn-secondary w-full text-center no-underline" href="/payee">
          Payee
        </Link>
        <Link className="btn-secondary w-full text-center no-underline" href="/withdraw">
          Get paid
        </Link>
        <Link className="btn-secondary w-full text-center no-underline" href="/demo">
          Walkthrough (demo)
        </Link>
      </div>
    </div>
  );
}

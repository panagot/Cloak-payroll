"use client";

import { useId } from "react";

type Props = {
  text: string;
  /** Optional shorter native tooltip (e.g. mobile long-press). Defaults to `text` truncated. */
  titleOverride?: string;
  className?: string;
};

/**
 * Accessible inline help: focusable “?” with hover + focus-within popover. Does not add deps.
 * Native `title` is set on the button for basic mobile fallback.
 */
export function InfoTip({ text, titleOverride, className = "" }: Props) {
  const id = useId();
  const nativeTitle = titleOverride ?? (text.length > 120 ? `${text.slice(0, 118)}…` : text);
  return (
    <span className={`group/inf relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        className="ms-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/40 text-[10px] font-bold text-slate-500 transition hover:border-sky-500/50 hover:bg-slate-800/80 hover:text-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 motion-safe:duration-150"
        aria-describedby={id}
        title={nativeTitle}
      >
        <span className="sr-only">Details</span>
        <span aria-hidden>?</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-[60] mt-1.5 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-600/80 bg-slate-900/98 p-0 opacity-0 shadow-lg shadow-black/50 ring-1 ring-white/5 transition-opacity duration-150 [text-wrap:pretty] group-hover/inf:opacity-100 group-focus-within/inf:opacity-100 motion-reduce:transition-none"
      >
        <span className="block max-h-64 overflow-y-auto px-3 py-2.5 text-left text-xs font-normal font-sans not-italic leading-relaxed text-slate-200 normal-case">
          {text}
        </span>
      </span>
    </span>
  );
}

/** Renders the uppercase `.app-label` row with a `?` tip. Wrap with `<label>` in the parent so inputs stay associated. */
export function AppLabelWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="app-label flex w-full items-baseline justify-between gap-1">
      <span className="tracking-wide">{label}</span>
      <InfoTip text={tip} className="translate-y-px" />
    </span>
  );
}

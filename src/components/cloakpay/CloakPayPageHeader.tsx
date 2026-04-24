import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: string;
  description?: ReactNode;
  className?: string;
  id?: string;
};

export function CloakPayPageHeader({ kicker, title, description, className = "", id }: Props) {
  return (
    <div id={id} className={`mb-8 scroll-mt-24 border-b border-indigo-100/50 pb-8 ${className}`}>
      {kicker ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/90">{kicker}</p>
      ) : null}
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description ? <div className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</div> : null}
    </div>
  );
}

import React from "react";

type Props = React.PropsWithChildren<{
  title?: string;
  className?: string;
  footer?: React.ReactNode;
}>;

export default function Card({ title, className, footer, children }: Props) {
  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm ${className ?? ""}`}>
      {title && <div className="mb-3 text-sm font-semibold text-neutral-200">{title}</div>}
      <div className="text-neutral-100">{children}</div>
      {footer && <div className="mt-3 border-t border-neutral-800 pt-3 text-neutral-300 text-xs">{footer}</div>}
    </div>
  );
}

import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  styleClass?: string;
}

export function Badge({ className, styleClass, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        styleClass || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
        className
      )}
      {...props}
    />
  );
}

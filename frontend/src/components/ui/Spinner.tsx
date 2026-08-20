import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className, label = "Loading..." }: { className?: string; label?: string }) {
  return (
    <div className={clsx("flex items-center justify-center gap-2 py-12 text-slate-500", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

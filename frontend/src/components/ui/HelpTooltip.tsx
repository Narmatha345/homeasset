import { HelpCircle } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface HelpTooltipProps {
  text: string;
  label?: string;
}

/** A small "(?)" icon that explains a term (Asset, Location, Service Order, Maintenance...) on hover/focus. */
export function HelpTooltip({ text, label = "More information" }: HelpTooltipProps) {
  return (
    <Tooltip text={text}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        aria-label={label}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

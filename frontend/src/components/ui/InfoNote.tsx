import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface InfoNoteProps {
  children: ReactNode;
}

/** A short, dismissible-free inline banner for page-level guidance ("Create a house first, then add rooms..."). */
export function InfoNote({ children }: InfoNoteProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3.5 py-2.5 text-sm text-indigo-800">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
      <p>{children}</p>
    </div>
  );
}

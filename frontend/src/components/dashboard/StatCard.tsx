import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Card } from "../ui/Card";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: "indigo" | "emerald" | "amber" | "red";
  trend?: string;
}

const toneClasses: Record<StatCardProps["tone"], string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

export function StatCard({ label, value, icon: Icon, tone, trend }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { assetsApi } from "../api/assetsApi";
import { servicesApi } from "../api/servicesApi";
import type { Asset, ServiceRecord, MaintenanceStatus } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { getMonthGrid, isSameMonth, isSameDay, dateKey } from "../utils/calendar";
import { getMaintenanceStatus } from "../utils/status";
import { apiErrorMessage } from "../api/client";

interface CalendarEvent {
  id: string;
  assetId: string;
  assetName: string;
  label: string;
  status: MaintenanceStatus;
}

const statusDotClass: Record<MaintenanceStatus, string> = {
  Overdue: "bg-red-500",
  "Due Soon": "bg-amber-500",
  Scheduled: "bg-blue-500",
  Upcoming: "bg-slate-400",
  Completed: "bg-emerald-500",
};

const statusPillClass: Record<MaintenanceStatus, string> = {
  Overdue: "bg-red-50 text-red-700",
  "Due Soon": "bg-amber-50 text-amber-700",
  Scheduled: "bg-blue-50 text-blue-700",
  Upcoming: "bg-slate-100 text-slate-600",
  Completed: "bg-emerald-50 text-emerald-700",
};

export function CalendarPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(() => new Date());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([assetsApi.list(), servicesApi.list()])
      .then(([a, s]) => {
        setAssets(a);
        setServices(s);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load calendar data")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const push = (dateStr: string | undefined, event: CalendarEvent) => {
      if (!dateStr) return;
      const key = dateKey(new Date(dateStr));
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    };

    for (const asset of assets) {
      if (!asset.nextServiceDate) continue;
      push(asset.nextServiceDate, {
        id: `next-${asset._id}`,
        assetId: asset._id,
        assetName: asset.name,
        label: asset.maintenanceFrequency,
        status: getMaintenanceStatus(asset.nextServiceDate),
      });
    }

    for (const record of services) {
      const asset = typeof record.assetId === "object" ? record.assetId : null;
      push(record.serviceDate, {
        id: `service-${record._id}`,
        assetId: asset?._id || (typeof record.assetId === "string" ? record.assetId : ""),
        assetName: asset?.name || "Asset",
        label: record.serviceType,
        status: "Completed",
      });
    }

    return map;
  }, [assets, services]);

  if (loading) return <Spinner label="Loading calendar..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const days = getMonthGrid(current.getFullYear(), current.getMonth());
  const monthLabel = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const goToMonth = (offset: number) => setCurrent((c) => new Date(c.getFullYear(), c.getMonth() + offset, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Service and maintenance events across all assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-800 min-w-[9rem] text-center">{monthLabel}</span>
          <Button variant="outline" size="sm" onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>
            Today
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {(["Overdue", "Due Soon", "Scheduled", "Upcoming", "Completed"] as MaintenanceStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={clsx("h-2 w-2 rounded-full", statusDotClass[s])} /> {s}
          </span>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const events = eventsByDay.get(dateKey(day)) || [];
            const inMonth = isSameMonth(day, current);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  "min-h-[104px] border-b border-r border-slate-100 p-1.5 sm:p-2 last:border-r-0",
                  !inMonth && "bg-slate-50/60"
                )}
              >
                <span
                  className={clsx(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-indigo-600 text-white font-semibold" : inMonth ? "text-slate-700" : "text-slate-300"
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => event.assetId && navigate(`/assets/${event.assetId}`)}
                      className={clsx(
                        "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] leading-tight truncate hover:opacity-80",
                        statusPillClass[event.status]
                      )}
                      title={`${event.assetName} — ${event.label}`}
                    >
                      <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", statusDotClass[event.status])} />
                      <span className="truncate">{event.assetName}</span>
                    </button>
                  ))}
                  {events.length > 3 && <p className="text-[10px] text-slate-400 pl-1.5">+{events.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {assets.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <CalendarDays className="h-6 w-6 text-slate-300" />
          No assets to display yet. Add assets to see maintenance events here.
        </Card>
      )}
    </div>
  );
}

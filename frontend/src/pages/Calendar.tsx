import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, CalendarDays, ClipboardList } from "lucide-react";
import { assetsApi } from "../api/assetsApi";
import { servicesApi } from "../api/servicesApi";
import { serviceOrdersApi } from "../api/serviceOrdersApi";
import type { Asset, ServiceRecord, ServiceOrder, MaintenanceStatus } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { ServiceOrderStatusBadge } from "../components/ui/StatusBadge";
import { getMonthGrid, isSameMonth, isSameDay, dateKey } from "../utils/calendar";
import { getMaintenanceStatus } from "../utils/status";
import { formatDate } from "../utils/format";
import { apiErrorMessage } from "../api/client";

type EventKind = "maintenance" | "serviceRecord" | "serviceOrder";

interface CalendarEvent {
  id: string;
  kind: EventKind;
  assetId: string;
  assetName: string;
  label: string;
  status: MaintenanceStatus;
  serviceOrder?: ServiceOrder;
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

const orderDotClass = "bg-indigo-600";
const orderPillClass = "bg-indigo-50 text-indigo-700";

export function CalendarPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(() => new Date());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([assetsApi.list(), servicesApi.list(), serviceOrdersApi.list()])
      .then(([a, s, o]) => {
        setAssets(a);
        setServices(s);
        setOrders(o);
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
        kind: "maintenance",
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
        kind: "serviceRecord",
        assetId: asset?._id || (typeof record.assetId === "string" ? record.assetId : ""),
        assetName: asset?.name || "Asset",
        label: record.serviceType,
        status: "Completed",
      });
    }

    for (const order of orders) {
      const asset = typeof order.assetId === "object" ? order.assetId : null;
      push(order.requestedDate, {
        id: `order-${order._id}`,
        kind: "serviceOrder",
        assetId: asset?._id || (typeof order.assetId === "string" ? order.assetId : ""),
        assetName: asset?.name || "Asset",
        label: order.serviceOrderNumber,
        status: "Scheduled",
        serviceOrder: order,
      });
    }

    return map;
  }, [assets, services, orders]);

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
          <p className="text-sm text-slate-500 mt-0.5">Scheduled maintenance and service order requests across all assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <span className="flex items-center gap-1.5">
          <span className={clsx("h-2 w-2 rounded-full", orderDotClass)} /> Service Order Requested
        </span>
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
                      onClick={() => setSelectedEvent(event)}
                      className={clsx(
                        "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] leading-tight truncate hover:opacity-80",
                        event.kind === "serviceOrder" ? orderPillClass : statusPillClass[event.status]
                      )}
                      title={`${event.assetName} — ${event.label}`}
                    >
                      <span
                        className={clsx("h-1.5 w-1.5 rounded-full shrink-0", event.kind === "serviceOrder" ? orderDotClass : statusDotClass[event.status])}
                      />
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

      {selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.assetName}
          description={selectedEvent.kind === "serviceOrder" ? `Service order ${selectedEvent.label}` : selectedEvent.label}
          size="sm"
        >
          <div className="space-y-4">
            {selectedEvent.kind === "serviceOrder" && selectedEvent.serviceOrder && (
              <div className="flex items-center gap-2">
                <ServiceOrderStatusBadge status={selectedEvent.serviceOrder.status} />
                <span className="text-xs text-slate-500">Requested {formatDate(selectedEvent.serviceOrder.requestedDate)}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              {selectedEvent.kind === "serviceOrder" ? (
                <Button onClick={() => navigate(`/service-orders/${selectedEvent.serviceOrder?._id}`)}>Open Service Order</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate(`/assets/${selectedEvent.assetId}`)}>
                    View Asset
                  </Button>
                  {selectedEvent.kind === "maintenance" && (
                    <Button
                      onClick={() => {
                        const params = new URLSearchParams({
                          assetId: selectedEvent.assetId,
                          requestType: "Preventive Maintenance",
                          description: `Scheduled maintenance for ${selectedEvent.assetName}`,
                        });
                        navigate(`/service-orders/new?${params.toString()}`);
                      }}
                    >
                      <ClipboardList className="h-4 w-4" /> Create Service Order
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

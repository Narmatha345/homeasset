import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, CalendarClock, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { dashboardApi } from "../api/dashboardApi";
import { assetsApi } from "../api/assetsApi";
import { servicesApi, type ServiceInput } from "../api/servicesApi";
import type { UpcomingMaintenanceItem } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { InfoNote } from "../components/ui/InfoNote";
import { MaintenanceStatusBadge, PriorityBadge } from "../components/ui/StatusBadge";
import { ServiceRecordFormModal } from "../components/assets/ServiceRecordFormModal";
import { RescheduleModal } from "../components/maintenance/RescheduleModal";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { formatDate } from "../utils/format";

export function Maintenance() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState<UpcomingMaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completingItem, setCompletingItem] = useState<UpcomingMaintenanceItem | null>(null);
  const [reschedulingItem, setReschedulingItem] = useState<UpcomingMaintenanceItem | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    dashboardApi
      .upcomingMaintenance()
      .then(setItems)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load maintenance data")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkCompleted = async (input: ServiceInput) => {
    try {
      await servicesApi.create(input);
      showToast("Maintenance marked as completed");
      setCompletingItem(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to mark maintenance completed"), "error");
    }
  };

  const handleReschedule = async (date: string) => {
    if (!reschedulingItem) return;
    try {
      await assetsApi.update(reschedulingItem.assetId, { nextServiceDate: date });
      showToast("Maintenance rescheduled");
      setReschedulingItem(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to reschedule maintenance"), "error");
    }
  };

  const buckets = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const day = now.getDay();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (6 - day));
    weekEnd.setHours(23, 59, 59, 999);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const overdue: UpcomingMaintenanceItem[] = [];
    const dueToday: UpcomingMaintenanceItem[] = [];
    const dueThisWeek: UpcomingMaintenanceItem[] = [];
    const dueThisMonth: UpcomingMaintenanceItem[] = [];

    for (const item of items) {
      const due = new Date(item.dueDate);
      if (item.status === "Overdue") {
        overdue.push(item);
      } else if (due >= todayStart && due <= todayEnd) {
        dueToday.push(item);
      } else if (due <= weekEnd) {
        dueThisWeek.push(item);
      } else if (due <= monthEnd) {
        dueThisMonth.push(item);
      }
    }

    return { overdue, dueToday, dueThisWeek, dueThisMonth };
  }, [items]);

  const createServiceOrderFor = (item: UpcomingMaintenanceItem) => {
    const params = new URLSearchParams({
      assetId: item.assetId,
      requestType: "Preventive Maintenance",
      description: `Scheduled maintenance for ${item.assetName}`,
    });
    navigate(`/service-orders/new?${params.toString()}`);
  };

  if (loading) return <Spinner label="Loading maintenance items..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const sections: { key: string; title: string; items: UpcomingMaintenanceItem[] }[] = [
    { key: "overdue", title: "Overdue", items: buckets.overdue },
    { key: "today", title: "Due Today", items: buckets.dueToday },
    { key: "week", title: "Due This Week", items: buckets.dueThisWeek },
    { key: "month", title: "Due This Month", items: buckets.dueThisMonth },
  ];

  const totalShown = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
          <HelpTooltip text="Maintenance tells you WHAT needs attention and WHEN." />
        </div>
        <p className="text-sm text-slate-500 mt-0.5">Review upcoming maintenance and create a service order when work needs to be performed.</p>
      </div>

      <InfoNote>
        Maintenance shows what's scheduled or due — it doesn't mean work has started. Use <span className="font-medium">Create Service Order</span> below
        to request the actual work.
      </InfoNote>

      {totalShown === 0 ? (
        <Card>
          <EmptyState icon={<Wrench className="h-6 w-6" />} title="Nothing due right now" description="All your assets are up to date." />
        </Card>
      ) : (
        sections.map(
          (section) =>
            section.items.length > 0 && (
              <Card key={section.key}>
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {section.title} <span className="text-slate-400 font-normal">({section.items.length})</span>
                  </h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <li key={item.assetId + item.dueDate} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.assetName}</p>
                        <p className="text-xs text-slate-500">
                          {item.assetCode} &middot; {item.location} &middot; {item.maintenanceType}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500">{formatDate(item.dueDate)}</span>
                        <PriorityBadge priority={item.priority} />
                        <MaintenanceStatusBadge status={item.status} />
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => createServiceOrderFor(item)}>
                            <ClipboardList className="h-3.5 w-3.5" /> Create Service Order
                          </Button>
                          <button
                            onClick={() => navigate(`/assets/${item.assetId}`)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="View asset"
                            title="View asset"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCompletingItem(item)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Mark completed"
                            title="Mark completed"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setReschedulingItem(item)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                            aria-label="Reschedule"
                            title="Reschedule"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )
        )
      )}

      {completingItem && (
        <ServiceRecordFormModal
          open={!!completingItem}
          assetId={completingItem.assetId}
          onClose={() => setCompletingItem(null)}
          onSubmit={handleMarkCompleted}
        />
      )}
      <RescheduleModal
        open={!!reschedulingItem}
        assetName={reschedulingItem?.assetName}
        currentDate={reschedulingItem?.dueDate}
        onClose={() => setReschedulingItem(null)}
        onSubmit={handleReschedule}
      />
    </div>
  );
}

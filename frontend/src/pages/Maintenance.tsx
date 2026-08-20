import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Eye, CalendarClock, CheckCircle2, Wrench } from "lucide-react";
import { dashboardApi } from "../api/dashboardApi";
import { assetsApi } from "../api/assetsApi";
import { servicesApi, type ServiceInput } from "../api/servicesApi";
import type { UpcomingMaintenanceItem } from "../types";
import { Card } from "../components/ui/Card";
import { Table, type Column } from "../components/ui/Table";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { MaintenanceStatusBadge, PriorityBadge } from "../components/ui/StatusBadge";
import { ServiceRecordFormModal } from "../components/assets/ServiceRecordFormModal";
import { RescheduleModal } from "../components/maintenance/RescheduleModal";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { formatDate } from "../utils/format";

const filters = [
  { key: "all", label: "All" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "overdue", label: "Overdue" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export function Maintenance() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [items, setItems] = useState<UpcomingMaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completingItem, setCompletingItem] = useState<UpcomingMaintenanceItem | null>(null);
  const [reschedulingItem, setReschedulingItem] = useState<UpcomingMaintenanceItem | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    dashboardApi
      .upcomingMaintenance(filter === "all" ? undefined : filter)
      .then(setItems)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load maintenance data")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

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

  const columns: Column<UpcomingMaintenanceItem>[] = [
    { key: "asset", header: "Asset", render: (r) => <span className="font-medium text-slate-900">{r.assetName}</span> },
    { key: "location", header: "Location", render: (r) => r.location },
    { key: "type", header: "Maintenance Type", render: (r) => r.maintenanceType },
    { key: "due", header: "Due Date", render: (r) => formatDate(r.dueDate) },
    { key: "priority", header: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: "status", header: "Status", render: (r) => <MaintenanceStatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      hideOnMobile: true,
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/assets/${r.assetId}`)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="View asset"
            title="View asset"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCompletingItem(r)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Mark completed"
            title="Mark completed"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setReschedulingItem(r)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Reschedule"
            title="Reschedule"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track and manage upcoming maintenance across all your assets.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium border transition-colors",
              filter === f.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <Spinner label="Loading maintenance items..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState icon={<Wrench className="h-6 w-6" />} title="Nothing to show" description="No maintenance items match this filter." />
        ) : (
          <Table
            columns={columns}
            rows={items}
            rowKey={(r) => r.assetId + r.dueDate}
            mobileCardTitle={(r) => (
              <div className="flex items-center justify-between">
                <span>{r.assetName}</span>
                <MaintenanceStatusBadge status={r.status} />
              </div>
            )}
          />
        )}
      </Card>

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

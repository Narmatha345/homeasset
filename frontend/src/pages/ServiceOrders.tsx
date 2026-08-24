import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ClipboardList, Plus, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { serviceOrdersApi } from "../api/serviceOrdersApi";
import type { ServiceOrder } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/FormField";
import { Table, type Column } from "../components/ui/Table";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { InfoNote } from "../components/ui/InfoNote";
import { ServiceOrderStatusBadge, ServiceOrderPriorityBadge, RequestTypeBadge } from "../components/ui/StatusBadge";
import { useDebounce } from "../hooks/useDebounce";
import { apiErrorMessage } from "../api/client";
import { formatDate } from "../utils/format";
import { REQUEST_TYPES, SERVICE_ORDER_PRIORITIES, SERVICE_ORDER_STATUSES } from "../utils/constants";

export function ServiceOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [requestType, setRequestType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    serviceOrdersApi
      .list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        requestType: requestType || undefined,
        from: from || undefined,
        to: to || undefined,
        sortDir,
      })
      .then(setOrders)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load service orders")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, status, priority, requestType, from, to, sortDir]);

  const columns: Column<ServiceOrder>[] = [
    { key: "number", header: "Order", render: (o) => <span className="font-medium text-slate-900">{o.serviceOrderNumber}</span> },
    { key: "asset", header: "Asset", render: (o) => (typeof o.assetId === "object" ? o.assetId.name : "—") },
    { key: "location", header: "Location", render: (o) => (typeof o.locationId === "object" ? o.locationId.name : "—"), hideOnMobile: true },
    { key: "type", header: "Type", render: (o) => <RequestTypeBadge type={o.requestType} /> },
    { key: "priority", header: "Priority", render: (o) => <ServiceOrderPriorityBadge priority={o.priority} /> },
    { key: "requestedDate", header: "Requested Date", render: (o) => formatDate(o.requestedDate) },
    { key: "status", header: "Status", render: (o) => <ServiceOrderStatusBadge status={o.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-semibold text-slate-900">Service Orders</h1>
            <HelpTooltip text="A service order is a request to repair, inspect or maintain an asset." />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage work requests for your assets.</p>
        </div>
        <Button onClick={() => navigate("/service-orders/new")}>
          <Plus className="h-4 w-4" /> Create Service Order
        </Button>
      </div>

      <InfoNote>
        Service Orders show actual work requests created to perform maintenance, repairs or other service activities — not just what's
        due. See the <span className="font-medium">Maintenance</span> page for what needs attention and when.
      </InfoNote>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number or asset..." className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => setFiltersOpen((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            <ArrowUpDown className="h-4 w-4" /> {sortDir === "asc" ? "Oldest First" : "Newest First"}
          </Button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {SERVICE_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {SERVICE_ORDER_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
              <option value="">All Request Types</option>
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
        )}
      </Card>

      <Card>
        {loading ? (
          <Spinner label="Loading service orders..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No service orders yet."
            description="Create a service order when an appliance needs repair or maintenance."
            actionLabel="Create Service Order"
            onAction={() => navigate("/service-orders/new")}
          />
        ) : (
          <Table
            columns={columns}
            rows={orders}
            rowKey={(o) => o._id}
            onRowClick={(o) => navigate(`/service-orders/${o._id}`)}
            mobileCardTitle={(o) => (
              <div className="flex items-center justify-between">
                <span>{o.serviceOrderNumber}</span>
                <ServiceOrderStatusBadge status={o.status} />
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, CalendarClock, AlertOctagon, ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { dashboardApi } from "../api/dashboardApi";
import type { DashboardSummary, UpcomingMaintenanceItem, ServiceRecord, ServiceOrder } from "../types";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Table, type Column } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { MaintenanceStatusBadge, ServiceOrderStatusBadge } from "../components/ui/StatusBadge";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDate } from "../utils/format";
import { apiErrorMessage } from "../api/client";

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingMaintenanceItem[]>([]);
  const [recent, setRecent] = useState<ServiceRecord[]>([]);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [chartData, setChartData] = useState<{ location: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.upcomingMaintenance(),
      dashboardApi.recentlyServiced(),
      dashboardApi.recentServiceOrders(),
      dashboardApi.assetsByLocation(),
    ])
      .then(([s, u, r, so, c]) => {
        setSummary(s);
        setUpcoming(u);
        setRecent(r);
        setRecentOrders(so);
        setChartData(c);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load dashboard data")))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const overdueItems = upcoming.filter((i) => i.status === "Overdue");
  const nonOverdueItems = upcoming.filter((i) => i.status !== "Overdue").slice(0, 6);

  const maintenanceColumns: Column<UpcomingMaintenanceItem>[] = [
    { key: "asset", header: "Asset", render: (r) => <span className="font-medium text-slate-900">{r.assetName}</span> },
    { key: "location", header: "Location", render: (r) => r.location },
    { key: "service", header: "Service", render: (r) => r.maintenanceType },
    { key: "due", header: "Due Date", render: (r) => formatDate(r.dueDate) },
    { key: "status", header: "Status", render: (r) => <MaintenanceStatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      hideOnMobile: true,
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            const params = new URLSearchParams({
              assetId: r.assetId,
              requestType: "Preventive Maintenance",
              description: `Scheduled maintenance for ${r.assetName}`,
            });
            navigate(`/service-orders/new?${params.toString()}`);
          }}
        >
          <ClipboardList className="h-3.5 w-3.5" /> Create Service Order
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your home assets, maintenance, and service orders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={summary?.totalAssets ?? 0} icon={Boxes} tone="indigo" trend="Across all rooms" />
        <StatCard
          label="Upcoming Maintenance"
          value={summary?.servicesDueThisMonth ?? 0}
          icon={CalendarClock}
          tone="amber"
          trend="Due this month"
        />
        <StatCard label="Overdue Maintenance" value={summary?.overdueServices ?? 0} icon={AlertOctagon} tone="red" trend="Needs attention" />
        <StatCard label="Open Service Orders" value={summary?.openServiceOrders ?? 0} icon={ClipboardList} tone="indigo" trend="Awaiting work" />
        <StatCard label="In Progress Orders" value={summary?.inProgressServiceOrders ?? 0} icon={Loader2} tone="amber" trend="Being worked on" />
        <StatCard label="Completed Orders" value={summary?.completedServiceOrders ?? 0} icon={CheckCircle2} tone="emerald" trend="Resolved" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <button onClick={() => navigate("/maintenance")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {nonOverdueItems.length === 0 ? (
              <EmptyState title="No upcoming maintenance" description="Nothing due soon." />
            ) : (
              <Table
                columns={maintenanceColumns}
                rows={nonOverdueItems}
                rowKey={(r) => r.assetId + r.dueDate}
                onRowClick={(r) => navigate(`/assets/${r.assetId}`)}
                mobileCardTitle={(r) => r.assetName}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Service Orders</CardTitle>
            <button onClick={() => navigate("/service-orders")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <EmptyState title="No service orders yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOrders.map((o) => {
                  const asset = typeof o.assetId === "object" ? o.assetId : null;
                  return (
                    <li
                      key={o._id}
                      className="px-5 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/service-orders/${o._id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{o.serviceOrderNumber}</p>
                        <ServiceOrderStatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{asset?.name || "Asset"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Requested {formatDate(o.requestedDate)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overdue Maintenance</CardTitle>
            <button onClick={() => navigate("/maintenance")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {overdueItems.length === 0 ? (
              <EmptyState title="Nothing overdue" description="All caught up." />
            ) : (
              <Table
                columns={maintenanceColumns}
                rows={overdueItems.slice(0, 6)}
                rowKey={(r) => r.assetId + r.dueDate}
                onRowClick={(r) => navigate(`/assets/${r.assetId}`)}
                mobileCardTitle={(r) => r.assetName}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Serviced</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyState title="No service history yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.slice(0, 6).map((r) => {
                  const asset = typeof r.assetId === "object" ? r.assetId : null;
                  return (
                    <li
                      key={r._id}
                      className="px-5 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => asset && navigate(`/assets/${asset._id}`)}
                    >
                      <p className="text-sm font-medium text-slate-900">{asset?.name || "Asset"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.serviceType}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Completed {formatDate(r.serviceDate)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState title="No assets yet" description="Add rooms and assets to see this chart." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="location" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, CheckCircle2, CalendarClock, AlertOctagon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { dashboardApi } from "../api/dashboardApi";
import type { DashboardSummary, UpcomingMaintenanceItem, ServiceRecord } from "../types";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Table, type Column } from "../components/ui/Table";
import { MaintenanceStatusBadge } from "../components/ui/StatusBadge";
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
      dashboardApi.assetsByLocation(),
    ])
      .then(([s, u, r, c]) => {
        setSummary(s);
        setUpcoming(u.slice(0, 6));
        setRecent(r);
        setChartData(c);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load dashboard data")))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const columns: Column<UpcomingMaintenanceItem>[] = [
    { key: "asset", header: "Asset", render: (r) => <span className="font-medium text-slate-900">{r.assetName}</span> },
    { key: "location", header: "Location", render: (r) => r.location },
    { key: "service", header: "Service", render: (r) => r.maintenanceType },
    { key: "due", header: "Due Date", render: (r) => formatDate(r.dueDate) },
    { key: "status", header: "Status", render: (r) => <MaintenanceStatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your home assets and upcoming maintenance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={summary?.totalAssets ?? 0} icon={Boxes} tone="indigo" trend="Across all rooms" />
        <StatCard label="Active Assets" value={summary?.activeAssets ?? 0} icon={CheckCircle2} tone="emerald" trend="Currently in service" />
        <StatCard
          label="Services Due This Month"
          value={summary?.servicesDueThisMonth ?? 0}
          icon={CalendarClock}
          tone="amber"
          trend="Scheduled maintenance"
        />
        <StatCard label="Overdue Services" value={summary?.overdueServices ?? 0} icon={AlertOctagon} tone="red" trend="Needs attention" />
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
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming maintenance" description="All your assets are up to date." />
            ) : (
              <Table
                columns={columns}
                rows={upcoming}
                rowKey={(r) => r.assetId}
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
                {recent.map((r) => {
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

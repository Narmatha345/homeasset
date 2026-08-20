import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, History, SlidersHorizontal } from "lucide-react";
import { servicesApi } from "../api/servicesApi";
import { assetsApi } from "../api/assetsApi";
import { locationsApi } from "../api/locationsApi";
import type { ServiceRecord, Asset, Location } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/FormField";
import { Table, type Column } from "../components/ui/Table";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ServiceTypeBadge } from "../components/ui/StatusBadge";
import { useDebounce } from "../hooks/useDebounce";
import { apiErrorMessage } from "../api/client";
import { formatDate, formatCurrency } from "../utils/format";
import { SERVICE_TYPES } from "../utils/constants";

export function ServiceHistory() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [assetFilter, setAssetFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      servicesApi.list({
        search: debouncedSearch || undefined,
        assetId: assetFilter || undefined,
        locationId: locationFilter || undefined,
        serviceType: typeFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
      assets.length ? Promise.resolve(assets) : assetsApi.list(),
      locations.length ? Promise.resolve(locations) : locationsApi.list(),
    ])
      .then(([s, a, l]) => {
        setServices(s);
        setAssets(a);
        setLocations(l);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load service history")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, assetFilter, locationFilter, typeFilter, from, to]);

  const columns: Column<ServiceRecord>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.serviceDate) },
    {
      key: "asset",
      header: "Asset",
      render: (r) => (typeof r.assetId === "object" ? r.assetId.name : "—"),
    },
    {
      key: "location",
      header: "Location",
      render: (r) => {
        const asset = typeof r.assetId === "object" ? r.assetId : null;
        const loc = asset && typeof asset.locationId === "object" ? asset.locationId.name : "";
        return loc || "—";
      },
    },
    { key: "type", header: "Service Type", render: (r) => <ServiceTypeBadge type={r.serviceType} /> },
    { key: "provider", header: "Provider", render: (r) => r.serviceProvider || "—" },
    { key: "cost", header: "Cost", render: (r) => formatCurrency(r.cost) },
    { key: "notes", header: "Notes", render: (r) => r.description || r.notes || "—", hideOnMobile: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Service History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete record of maintenance across all assets.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by provider or description..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setFiltersOpen((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
            <Select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
              <option value="">All Assets</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Rooms</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Service Types</option>
              {SERVICE_TYPES.map((t) => (
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
          <Spinner label="Loading service history..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : services.length === 0 ? (
          <EmptyState icon={<History className="h-6 w-6" />} title="No service records found" description="Try adjusting your filters." />
        ) : (
          <Table
            columns={columns}
            rows={services}
            rowKey={(r) => r._id}
            onRowClick={(r) => {
              const asset = typeof r.assetId === "object" ? r.assetId : null;
              if (asset) navigate(`/assets/${asset._id}`);
            }}
            mobileCardTitle={(r) => (typeof r.assetId === "object" ? r.assetId.name : "Service Record")}
          />
        )}
      </Card>
    </div>
  );
}

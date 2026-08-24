import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Boxes, SlidersHorizontal, Search, Trash2 } from "lucide-react";
import { assetsApi } from "../api/assetsApi";
import { housesApi } from "../api/housesApi";
import { locationsApi } from "../api/locationsApi";
import type { Asset, House, Location } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Select, Input } from "../components/ui/FormField";
import { Table, type Column } from "../components/ui/Table";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { AssetStatusBadge, MaintenanceStatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { useDebounce } from "../hooks/useDebounce";
import { apiErrorMessage } from "../api/client";
import { formatDate } from "../utils/format";
import { getMaintenanceStatus } from "../utils/status";
import { ASSET_CATEGORIES, ASSET_STATUSES, MAINTENANCE_STATUSES } from "../utils/constants";

function locationName(a: Asset): string {
  return typeof a.locationId === "object" ? a.locationId.name : "";
}
function houseName(a: Asset): string {
  return typeof a.houseId === "object" ? a.houseId.name : "";
}

export function Assets() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [houseFilter, setHouseFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warrantyFilter, setWarrantyFilter] = useState("");
  const [maintenanceFilter, setMaintenanceFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      assetsApi.list({
        search: debouncedSearch || undefined,
        houseId: houseFilter || undefined,
        locationId: roomFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        warranty: warrantyFilter || undefined,
        maintenanceStatus: maintenanceFilter || undefined,
        sortBy,
        sortDir,
      }),
      houses.length ? Promise.resolve(houses) : housesApi.list(),
      locationsApi.list(),
    ])
      .then(([a, h, l]) => {
        setAssets(a);
        setHouses(h);
        setLocations(l);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load assets")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, houseFilter, roomFilter, categoryFilter, statusFilter, warrantyFilter, maintenanceFilter, sortBy, sortDir]);

  const roomOptions = useMemo(
    () => (houseFilter ? locations.filter((l) => l.houseId === houseFilter) : locations),
    [locations, houseFilter]
  );

  const hasActiveFilters = !!(
    debouncedSearch ||
    houseFilter ||
    roomFilter ||
    categoryFilter ||
    statusFilter ||
    warrantyFilter ||
    maintenanceFilter
  );

  const handleDelete = (asset: Asset) => {
    confirm({
      title: "Delete asset?",
      description: `"${asset.name}" and all of its service history will be permanently deleted.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await assetsApi.remove(asset._id);
          showToast("Asset deleted");
          load();
        } catch (err) {
          showToast(apiErrorMessage(err, "Failed to delete asset"), "error");
        }
      },
    });
  };

  const columns: Column<Asset>[] = [
    {
      key: "name",
      header: "Asset",
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.name}</p>
          <p className="text-xs text-slate-400">{a.assetId}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (a) => a.category },
    { key: "location", header: "Location", render: (a) => `${houseName(a)} / ${locationName(a)}` },
    { key: "status", header: "Status", render: (a) => <AssetStatusBadge status={a.status} /> },
    {
      key: "nextService",
      header: "Next Service",
      render: (a) => (
        <div className="flex flex-col gap-1 items-start">
          <span>{formatDate(a.nextServiceDate)}</span>
          {a.nextServiceDate && <MaintenanceStatusBadge status={getMaintenanceStatus(a.nextServiceDate)} />}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      hideOnMobile: true,
      render: (a) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(a);
          }}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete asset"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-semibold text-slate-900">Assets</h1>
            <HelpTooltip text="Assets are the devices and equipment in your home, such as an AC, refrigerator, TV or washing machine." />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">All equipment across your homes.</p>
        </div>
        <Button onClick={() => navigate("/assets/new")}>
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, brand, model, serial..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="md" onClick={() => setFiltersOpen((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <Select
              value={houseFilter}
              onChange={(e) => {
                setHouseFilter(e.target.value);
                setRoomFilter("");
              }}
            >
              <option value="">All Houses</option>
              {houses.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </Select>
            <Select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
              <option value="">All Rooms</option>
              {roomOptions.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={warrantyFilter} onChange={(e) => setWarrantyFilter(e.target.value)}>
              <option value="">Any Warranty</option>
              <option value="active">Under Warranty</option>
              <option value="expired">Warranty Expired</option>
            </Select>
            <Select value={maintenanceFilter} onChange={(e) => setMaintenanceFilter(e.target.value)}>
              <option value="">Any Maintenance Status</option>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort: Name</option>
              <option value="purchaseDate">Sort: Purchase Date</option>
              <option value="nextServiceDate">Sort: Next Service Date</option>
            </Select>
            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </div>
        )}
      </Card>

      <Card>
        {loading ? (
          <Spinner label="Loading assets..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title={hasActiveFilters ? "No assets found" : "No assets yet"}
            description={hasActiveFilters ? "Try adjusting your filters." : "Add your first appliance to start tracking maintenance."}
            actionLabel="Add Asset"
            onAction={() => navigate("/assets/new")}
          />
        ) : (
          <Table
            columns={columns}
            rows={assets}
            rowKey={(a) => a._id}
            onRowClick={(a) => navigate(`/assets/${a._id}`)}
            mobileCardTitle={(a) => (
              <div className="flex items-center justify-between">
                <span>{a.name}</span>
                <AssetStatusBadge status={a.status} />
              </div>
            )}
          />
        )}
      </Card>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

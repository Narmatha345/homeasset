import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus, MapPin, Wrench, Tag, Calendar } from "lucide-react";
import { assetsApi } from "../api/assetsApi";
import { servicesApi, type ServiceInput } from "../api/servicesApi";
import type { Asset, ServiceRecord } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { AssetStatusBadge, MaintenanceStatusBadge, ServiceTypeBadge } from "../components/ui/StatusBadge";
import { ServiceRecordFormModal } from "../components/assets/ServiceRecordFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { formatDate, formatCurrency } from "../utils/format";
import { getMaintenanceStatus } from "../utils/status";

export function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    Promise.all([assetsApi.get(id), servicesApi.list({ assetId: id })])
      .then(([a, s]) => {
        setAsset(a);
        setServices(s);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load asset details")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleAddService = async (input: ServiceInput) => {
    try {
      await servicesApi.create(input);
      showToast("Service record added");
      setServiceModalOpen(false);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to add service record"), "error");
    }
  };

  const handleDeleteAsset = () => {
    if (!asset) return;
    confirm({
      title: "Delete asset?",
      description: `"${asset.name}" and all of its service history will be permanently deleted.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await assetsApi.remove(asset._id);
          showToast("Asset deleted");
          navigate("/assets");
        } catch (err) {
          showToast(apiErrorMessage(err, "Failed to delete asset"), "error");
        }
      },
    });
  };

  if (loading) return <Spinner label="Loading asset..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!asset) return <ErrorState message="Asset not found" />;

  const locationName = typeof asset.locationId === "object" ? asset.locationId.name : "";
  const houseName = typeof asset.houseId === "object" ? asset.houseId.name : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900">{asset.name}</h1>
              <AssetStatusBadge status={asset.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">Asset ID: {asset.assetId}</p>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {houseName} / {locationName}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate(`/assets/${asset._id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAsset}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400" /> Asset Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoItem label="Category" value={asset.category} />
            <InfoItem label="Brand" value={asset.brand} />
            <InfoItem label="Model" value={asset.model} />
            <InfoItem label="Serial Number" value={asset.serialNumber} />
            <InfoItem label="Purchase Date" value={formatDate(asset.purchaseDate)} />
            <InfoItem label="Purchase Price" value={formatCurrency(asset.purchasePrice)} />
            <InfoItem label="Warranty Expiry" value={formatDate(asset.warrantyExpiry)} />
            <InfoItem label="Current Status" value={asset.status} />
            {asset.notes && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Notes</p>
                <p className="text-slate-700 mt-1">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-slate-400" /> Maintenance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoItem label="Last Service" value={formatDate(asset.lastServiceDate)} />
            <InfoItem label="Next Service" value={formatDate(asset.nextServiceDate)} />
            <InfoItem label="Frequency" value={asset.maintenanceFrequency} />
            {asset.nextServiceDate && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Status</p>
                <MaintenanceStatusBadge status={getMaintenanceStatus(asset.nextServiceDate)} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" /> Service History
          </CardTitle>
          <Button size="sm" onClick={() => setServiceModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Service Record
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <EmptyState
              icon={<Wrench className="h-6 w-6" />}
              title="No service history yet"
              description="Add the first service record to start tracking maintenance."
              actionLabel="Add Service Record"
              onAction={() => setServiceModalOpen(true)}
            />
          ) : (
            <ul className="relative px-5 py-4">
              {services.map((s, idx) => (
                <li key={s._id} className="relative pb-6 pl-8 last:pb-0">
                  {idx !== services.length - 1 && <span className="absolute left-[7px] top-3 h-full w-px bg-slate-200" />}
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{formatDate(s.serviceDate)}</p>
                    <ServiceTypeBadge type={s.serviceType} />
                  </div>
                  {s.description && <p className="text-sm text-slate-600 mt-1">{s.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                    {s.serviceProvider && <span>Technician: {s.serviceProvider}</span>}
                    {s.cost !== undefined && <span>Cost: {formatCurrency(s.cost)}</span>}
                    {s.partsReplaced && <span>Parts: {s.partsReplaced}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ServiceRecordFormModal
        open={serviceModalOpen}
        assetId={asset._id}
        onClose={() => setServiceModalOpen(false)}
        onSubmit={handleAddService}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, CheckCircle2, Ban, Tag } from "lucide-react";
import { serviceOrdersApi } from "../api/serviceOrdersApi";
import type { ServiceOrder, ServiceOrderStatus } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { ServiceOrderStatusBadge, ServiceOrderPriorityBadge, RequestTypeBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { formatDate } from "../utils/format";
import { SERVICE_ORDER_STATUSES } from "../utils/constants";

export function ServiceOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    serviceOrdersApi
      .get(id)
      .then(setOrder)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load service order")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const changeStatus = async (status: ServiceOrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await serviceOrdersApi.update(order._id, { status });
      setOrder(updated);
      showToast(`Status updated to ${status}`);
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to update status"), "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = () => {
    if (!order) return;
    confirm({
      title: "Complete this service order?",
      description: "This logs a service record for the asset and refreshes its next service date.",
      confirmLabel: "Complete",
      danger: false,
      onConfirm: () => changeStatus("Completed"),
    });
  };

  const handleCancel = () => {
    if (!order) return;
    confirm({
      title: "Cancel this service order?",
      description: "The order will be marked as cancelled. This can't be undone.",
      confirmLabel: "Cancel Order",
      danger: true,
      onConfirm: () => changeStatus("Cancelled"),
    });
  };

  if (loading) return <Spinner label="Loading service order..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <ErrorState message="Service order not found" />;

  const asset = typeof order.assetId === "object" ? order.assetId : null;
  const house = typeof order.houseId === "object" ? order.houseId : null;
  const location = typeof order.locationId === "object" ? order.locationId : null;
  const isFinal = order.status === "Completed" || order.status === "Cancelled";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/service-orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Service Orders
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900">{order.serviceOrderNumber}</h1>
              <ServiceOrderStatusBadge status={order.status} />
              <RequestTypeBadge type={order.requestType} />
              <ServiceOrderPriorityBadge priority={order.priority} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {asset?.name} ({asset?.assetId}) &middot; {house?.name} / {location?.name}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {!isFinal && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/service-orders/${order._id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {!isFinal && (
              <Button size="sm" onClick={handleComplete} disabled={updating}>
                <CheckCircle2 className="h-4 w-4" /> Complete
              </Button>
            )}
            {!isFinal && (
              <Button variant="danger" size="sm" onClick={handleCancel} disabled={updating}>
                <Ban className="h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" /> Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem label="Asset" value={asset?.name} />
          <InfoItem label="Asset Number" value={asset?.assetId} />
          <InfoItem label="House" value={house?.name} />
          <InfoItem label="Room" value={location?.name} />
          <InfoItem label="Requested Date" value={formatDate(order.requestedDate)} />
          <InfoItem label="Created" value={formatDate(order.createdAt)} />
          <div className="col-span-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Description</p>
            <p className="text-slate-700 mt-1">{order.description}</p>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Notes</p>
              <p className="text-slate-700 mt-1">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={order.status}
            disabled={updating}
            onChange={(e) => changeStatus(e.target.value as ServiceOrderStatus)}
            className="max-w-xs"
          >
            {SERVICE_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

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

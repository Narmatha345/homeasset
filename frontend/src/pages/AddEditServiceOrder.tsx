import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { serviceOrdersApi, type ServiceOrderInput } from "../api/serviceOrdersApi";
import { assetsApi } from "../api/assetsApi";
import type { Asset, RequestType, ServiceOrderPriority } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { REQUEST_TYPES, SERVICE_ORDER_PRIORITIES } from "../utils/constants";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddEditServiceOrder() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!id;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<ServiceOrderInput>({
    assetId: searchParams.get("assetId") || "",
    requestType: (searchParams.get("requestType") as RequestType) || "Repair",
    priority: (searchParams.get("priority") as ServiceOrderPriority) || "Medium",
    requestedDate: today(),
    description: searchParams.get("description") || "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceOrderInput, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const loaders: Promise<unknown>[] = [assetsApi.list().then(setAssets)];
    if (isEdit && id) {
      loaders.push(
        serviceOrdersApi.get(id).then((order) => {
          setForm({
            assetId: typeof order.assetId === "object" ? order.assetId._id : order.assetId,
            requestType: order.requestType,
            priority: order.priority,
            requestedDate: order.requestedDate.slice(0, 10),
            description: order.description,
            notes: order.notes || "",
          });
        })
      );
    }
    Promise.all(loaders)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load form data")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setField = <K extends keyof ServiceOrderInput>(key: K, value: ServiceOrderInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const selectedAsset = useMemo(() => assets.find((a) => a._id === form.assetId), [assets, form.assetId]);
  const selectedLocation = selectedAsset && typeof selectedAsset.locationId === "object" ? selectedAsset.locationId.name : "";
  const selectedHouse = selectedAsset && typeof selectedAsset.houseId === "object" ? selectedAsset.houseId.name : "";

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ServiceOrderInput, string>> = {};
    if (!form.assetId) nextErrors.assetId = "Select an asset";
    if (!form.requestType) nextErrors.requestType = "Select a request type";
    if (!form.requestedDate) nextErrors.requestedDate = "Requested date is required";
    if (!form.description.trim()) nextErrors.description = "Describe the problem or request";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEdit && id) {
        await serviceOrdersApi.update(id, form);
        showToast("Service order updated successfully");
        navigate(`/service-orders/${id}`);
      } else {
        const created = await serviceOrdersApi.create(form);
        showToast(`Service Order ${created.serviceOrderNumber} created successfully.`);
        navigate(`/service-orders/${created._id}`);
      }
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to save service order"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading form..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/service-orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Service Orders
      </Link>

      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Service Order" : "Create Service Order"}</h1>
          <HelpTooltip text="A service order is a request to repair, inspect or maintain an asset." />
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? "Update the details of this service order." : "Tell us what needs attention — we'll take care of the rest."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Asset" required error={errors.assetId}>
                <Select value={form.assetId} onChange={(e) => setField("assetId", e.target.value)} invalid={!!errors.assetId}>
                  <option value="">Select asset</option>
                  {assets.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.assetId})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {selectedAsset && (
              <div className="sm:col-span-2 text-sm text-slate-500">
                Location: {selectedHouse} / {selectedLocation}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Request Type" required error={errors.requestType}>
              <Select value={form.requestType} onChange={(e) => setField("requestType", e.target.value as RequestType)}>
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" required>
              <Select value={form.priority} onChange={(e) => setField("priority", e.target.value as ServiceOrderPriority)}>
                {SERVICE_ORDER_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Requested Date" required error={errors.requestedDate}>
              <Input type="date" value={form.requestedDate} onChange={(e) => setField("requestedDate", e.target.value)} invalid={!!errors.requestedDate} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Problem / Description" required error={errors.description}>
                <Textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="e.g. AC is not cooling properly."
                  className="min-h-[110px]"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes (Optional)">
                <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any additional notes..." />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Create Service Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}

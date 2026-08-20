import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { assetsApi, type AssetInput } from "../api/assetsApi";
import { housesApi } from "../api/housesApi";
import { locationsApi } from "../api/locationsApi";
import type { House, Location, AssetStatus, MaintenanceFrequency } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { ASSET_CATEGORIES, ASSET_STATUSES, MAINTENANCE_FREQUENCIES } from "../utils/constants";

const emptyForm: AssetInput = {
  name: "",
  assetId: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  status: "Active",
  houseId: "",
  locationId: "",
  purchaseDate: "",
  purchasePrice: undefined,
  warrantyExpiry: "",
  maintenanceFrequency: "Every 6 Months",
  lastServiceDate: "",
  nextServiceDate: "",
  notes: "",
};

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function AddEditAsset() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!id;

  const [houses, setHouses] = useState<House[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<AssetInput>({
    ...emptyForm,
    houseId: searchParams.get("houseId") || "",
    locationId: searchParams.get("locationId") || "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AssetInput, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const loaders: Promise<unknown>[] = [housesApi.list().then(setHouses), locationsApi.list().then(setLocations)];
    if (isEdit && id) {
      loaders.push(
        assetsApi.get(id).then((asset) => {
          setForm({
            name: asset.name,
            assetId: asset.assetId,
            category: asset.category,
            brand: asset.brand || "",
            model: asset.model || "",
            serialNumber: asset.serialNumber || "",
            status: asset.status,
            houseId: typeof asset.houseId === "object" ? asset.houseId._id : asset.houseId,
            locationId: typeof asset.locationId === "object" ? asset.locationId._id : asset.locationId,
            purchaseDate: toDateInput(asset.purchaseDate),
            purchasePrice: asset.purchasePrice,
            warrantyExpiry: toDateInput(asset.warrantyExpiry),
            maintenanceFrequency: asset.maintenanceFrequency,
            lastServiceDate: toDateInput(asset.lastServiceDate),
            nextServiceDate: toDateInput(asset.nextServiceDate),
            notes: asset.notes || "",
          });
        })
      );
    }
    Promise.all(loaders)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load form data")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const roomOptions = useMemo(() => locations.filter((l) => l.houseId === form.houseId), [locations, form.houseId]);

  const setField = <K extends keyof AssetInput>(key: K, value: AssetInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof AssetInput, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Asset name is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    if (!form.houseId) nextErrors.houseId = "House is required";
    if (!form.locationId) nextErrors.locationId = "Room is required";
    if (form.purchasePrice !== undefined && form.purchasePrice < 0) nextErrors.purchasePrice = "Must be a positive number";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: AssetInput = {
        ...form,
        assetId: form.assetId || undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        lastServiceDate: form.lastServiceDate || undefined,
        nextServiceDate: form.nextServiceDate || undefined,
      };
      if (isEdit && id) {
        await assetsApi.update(id, payload);
        showToast("Asset updated successfully");
        navigate(`/assets/${id}`);
      } else {
        const created = await assetsApi.create(payload);
        showToast("Asset saved successfully");
        navigate(`/assets/${created._id}`);
      }
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to save asset"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading form..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Asset" : "Add Asset"}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to {isEdit ? "update this" : "register a new"} asset.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Asset Name" required error={errors.name}>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="LG Split AC" invalid={!!errors.name} />
            </Field>
            <Field label="Asset ID" hint="Leave blank to auto-generate (e.g. AST-00001)">
              <Input value={form.assetId} onChange={(e) => setField("assetId", e.target.value)} placeholder="AST-00001" />
            </Field>
            <Field label="Category" required error={errors.category}>
              <Select value={form.category} onChange={(e) => setField("category", e.target.value)} invalid={!!errors.category}>
                <option value="">Select category</option>
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value as AssetStatus)}>
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brand">
              <Input value={form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="LG" />
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={(e) => setField("model", e.target.value)} placeholder="LS-Q18YNZA" />
            </Field>
            <Field label="Serial Number">
              <Input value={form.serialNumber} onChange={(e) => setField("serialNumber", e.target.value)} placeholder="LG-AC-88213" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <Input type="date" value={form.purchaseDate} onChange={(e) => setField("purchaseDate", e.target.value)} />
            </Field>
            <Field label="Purchase Price" error={errors.purchasePrice}>
              <Input
                type="number"
                min={0}
                value={form.purchasePrice ?? ""}
                onChange={(e) => setField("purchasePrice", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="42000"
                invalid={!!errors.purchasePrice}
              />
            </Field>
            <Field label="Warranty Expiry">
              <Input type="date" value={form.warrantyExpiry} onChange={(e) => setField("warrantyExpiry", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="House" required error={errors.houseId}>
              <Select
                value={form.houseId}
                onChange={(e) => {
                  setField("houseId", e.target.value);
                  setField("locationId", "");
                }}
                invalid={!!errors.houseId}
              >
                <option value="">Select house</option>
                {houses.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Room" required error={errors.locationId}>
              <Select
                value={form.locationId}
                onChange={(e) => setField("locationId", e.target.value)}
                disabled={!form.houseId}
                invalid={!!errors.locationId}
              >
                <option value="">{form.houseId ? "Select room" : "Select a house first"}</option>
                {roomOptions.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Maintenance Frequency">
              <Select
                value={form.maintenanceFrequency}
                onChange={(e) => setField("maintenanceFrequency", e.target.value as MaintenanceFrequency)}
              >
                {MAINTENANCE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <div />
            <Field label="Last Service Date">
              <Input type="date" value={form.lastServiceDate} onChange={(e) => setField("lastServiceDate", e.target.value)} />
            </Field>
            <Field label="Next Service Date">
              <Input type="date" value={form.nextServiceDate} onChange={(e) => setField("nextServiceDate", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
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
            Save Asset
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, Textarea } from "../ui/FormField";
import { Button } from "../ui/Button";
import type { ServiceType } from "../../types";
import type { ServiceInput } from "../../api/servicesApi";
import { SERVICE_TYPES } from "../../utils/constants";

interface ServiceRecordFormModalProps {
  open: boolean;
  assetId: string;
  onClose: () => void;
  onSubmit: (input: ServiceInput) => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const buildEmptyForm = (assetId: string): ServiceInput => ({
  assetId,
  serviceDate: today(),
  serviceType: "General Maintenance",
  serviceProvider: "",
  cost: undefined,
  description: "",
  partsReplaced: "",
  nextServiceDate: "",
  notes: "",
});

export function ServiceRecordFormModal({ open, assetId, onClose, onSubmit }: ServiceRecordFormModalProps) {
  const [form, setForm] = useState<ServiceInput>(buildEmptyForm(assetId));
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceInput, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(buildEmptyForm(assetId));
      setErrors({});
    }
  }, [open, assetId]);

  const setField = <K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof ServiceInput, string>> = {};
    if (!form.serviceDate) nextErrors.serviceDate = "Service date is required";
    if (!form.serviceType) nextErrors.serviceType = "Service type is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        cost: form.cost !== undefined ? Number(form.cost) : undefined,
        nextServiceDate: form.nextServiceDate || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Service Record" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service Date" required error={errors.serviceDate}>
            <Input type="date" value={form.serviceDate} onChange={(e) => setField("serviceDate", e.target.value)} invalid={!!errors.serviceDate} />
          </Field>
          <Field label="Service Type" required error={errors.serviceType}>
            <Select value={form.serviceType} onChange={(e) => setField("serviceType", e.target.value as ServiceType)}>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Service Provider">
            <Input value={form.serviceProvider} onChange={(e) => setField("serviceProvider", e.target.value)} placeholder="Demo Service" />
          </Field>
          <Field label="Cost">
            <Input
              type="number"
              min={0}
              value={form.cost ?? ""}
              onChange={(e) => setField("cost", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="900"
            />
          </Field>
          <Field label="Next Service Date" hint="Updates the asset's scheduled next service">
            <Input type="date" value={form.nextServiceDate} onChange={(e) => setField("nextServiceDate", e.target.value)} />
          </Field>
          <Field label="Parts Replaced">
            <Input value={form.partsReplaced} onChange={(e) => setField("partsReplaced", e.target.value)} placeholder="RO membrane" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="What was done during this service" />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional notes" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Service Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}

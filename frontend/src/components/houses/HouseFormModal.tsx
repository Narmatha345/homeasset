import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input, Textarea } from "../ui/FormField";
import { Button } from "../ui/Button";
import type { House } from "../../types";
import type { HouseInput } from "../../api/housesApi";

interface HouseFormModalProps {
  open: boolean;
  house?: House | null;
  onClose: () => void;
  onSubmit: (input: HouseInput) => Promise<void>;
}

const emptyForm: HouseInput = { name: "", address: "", city: "", description: "" };

export function HouseFormModal({ open, house, onClose, onSubmit }: HouseFormModalProps) {
  const [form, setForm] = useState<HouseInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof HouseInput, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        house
          ? { name: house.name, address: house.address, city: house.city, description: house.description || "" }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, house]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof HouseInput, string>> = {};
    if (!form.name.trim()) nextErrors.name = "House name is required";
    if (!form.address.trim()) nextErrors.address = "Address is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={house ? "Edit House" : "Add House"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="House Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Home" invalid={!!errors.name} />
        </Field>
        <Field label="Address" required error={errors.address}>
          <Input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="123 Example Street"
            invalid={!!errors.address}
          />
        </Field>
        <Field label="City" required error={errors.city}>
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Chennai" invalid={!!errors.city} />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Primary residence"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {house ? "Save Changes" : "Save House"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

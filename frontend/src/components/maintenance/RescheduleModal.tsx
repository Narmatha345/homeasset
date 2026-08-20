import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input } from "../ui/FormField";
import { Button } from "../ui/Button";

interface RescheduleModalProps {
  open: boolean;
  assetName?: string;
  currentDate?: string;
  onClose: () => void;
  onSubmit: (date: string) => Promise<void>;
}

export function RescheduleModal({ open, assetName, currentDate, onClose, onSubmit }: RescheduleModalProps) {
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDate(currentDate ? currentDate.slice(0, 10) : "");
  }, [open, currentDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      await onSubmit(date);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reschedule Maintenance" description={assetName} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="New Next Service Date" required>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!date}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

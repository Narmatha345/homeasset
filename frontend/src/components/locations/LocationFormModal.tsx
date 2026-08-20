import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input, Textarea } from "../ui/FormField";
import { Button } from "../ui/Button";
import type { Location } from "../../types";

interface LocationFormModalProps {
  open: boolean;
  location?: Location | null;
  onClose: () => void;
  onSubmit: (input: { name: string; description?: string }) => Promise<void>;
}

export function LocationFormModal({ open, location, onClose, onSubmit }: LocationFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(location?.name || "");
      setDescription(location?.description || "");
      setError("");
    }
  }, [open, location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Room name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name, description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={location ? "Edit Room" : "Add Room"} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Room Name" required error={error}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Living Room" invalid={!!error} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Main living area" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {location ? "Save Changes" : "Save Room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

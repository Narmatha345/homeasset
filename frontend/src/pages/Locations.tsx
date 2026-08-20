import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import type { LocationTreeNode, Location } from "../types";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { HierarchyTree } from "../components/locations/HierarchyTree";
import { LocationFormModal } from "../components/locations/LocationFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { Home } from "lucide-react";

export function Locations() {
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Location | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    locationsApi
      .summary()
      .then(setTree)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load locations")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAddRoom = (houseId: string) => {
    setActiveHouseId(houseId);
    setEditingRoom(null);
    setRoomModalOpen(true);
  };

  const handleEditRoom = (location: Location) => {
    setActiveHouseId(location.houseId);
    setEditingRoom(location);
    setRoomModalOpen(true);
  };

  const handleRoomSubmit = async (input: { name: string; description?: string }) => {
    if (!activeHouseId) return;
    try {
      if (editingRoom) {
        await locationsApi.update(editingRoom._id, input);
        showToast("Room updated successfully");
      } else {
        await locationsApi.create({ ...input, houseId: activeHouseId });
        showToast("Room added successfully");
      }
      setRoomModalOpen(false);
      setEditingRoom(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to save room"), "error");
    }
  };

  const handleDeleteRoom = (location: Location) => {
    confirm({
      title: "Delete room?",
      description: `"${location.name}" will be removed. You must move or delete its assets first.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await locationsApi.remove(location._id);
          showToast("Room deleted");
          load();
        } catch (err) {
          showToast(apiErrorMessage(err, "Failed to delete room"), "error");
        }
      },
    });
  };

  if (loading) return <Spinner label="Loading locations..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Browse the House &rarr; Room &rarr; Asset hierarchy across all your properties.
        </p>
      </div>

      {tree.length === 0 ? (
        <Card>
          <EmptyState icon={<Home className="h-6 w-6" />} title="No houses yet" description="Add a house first to manage its rooms." />
        </Card>
      ) : (
        <HierarchyTree tree={tree} onAddRoom={handleAddRoom} onEditRoom={handleEditRoom} onDeleteRoom={handleDeleteRoom} />
      )}

      <LocationFormModal
        open={roomModalOpen}
        location={editingRoom}
        onClose={() => {
          setRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleRoomSubmit}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

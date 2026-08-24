import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationsApi } from "../api/locationsApi";
import { housesApi, type HouseInput } from "../api/housesApi";
import type { LocationTreeNode, Location, House } from "../types";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { InfoNote } from "../components/ui/InfoNote";
import { HierarchyTree } from "../components/locations/HierarchyTree";
import { LocationFormModal } from "../components/locations/LocationFormModal";
import { HouseFormModal } from "../components/houses/HouseFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";
import { Home, Plus } from "lucide-react";

export function Locations() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Location | null>(null);

  const [houseModalOpen, setHouseModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);

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

  const handleHouseSubmit = async (input: HouseInput) => {
    try {
      if (editingHouse) {
        await housesApi.update(editingHouse._id, input);
        showToast("House updated successfully");
      } else {
        await housesApi.create(input);
        showToast("House created successfully");
      }
      setHouseModalOpen(false);
      setEditingHouse(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to save house"), "error");
    }
  };

  const handleDeleteHouse = (house: House) => {
    confirm({
      title: "Delete house?",
      description: `This will permanently delete "${house.name}" along with all its rooms, assets, and service records.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await housesApi.remove(house._id);
          showToast("House deleted");
          load();
        } catch (err) {
          showToast(apiErrorMessage(err, "Failed to delete house"), "error");
        }
      },
    });
  };

  if (loading) return <Spinner label="Loading locations..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
            <HelpTooltip text="A Location is where an asset lives: a House, and the Room inside it (e.g. Master Bedroom)." />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Browse the House &rarr; Room &rarr; Asset hierarchy across all your properties.</p>
        </div>
        <Button
          onClick={() => {
            setEditingHouse(null);
            setHouseModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add House
        </Button>
      </div>

      {tree.length > 0 && <InfoNote>Create your home first, then add rooms. Assets are added inside each room.</InfoNote>}

      {tree.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Home className="h-6 w-6" />}
            title="No houses yet"
            description="Create a house to start organizing your rooms and assets."
            actionLabel="Add House"
            onAction={() => setHouseModalOpen(true)}
          />
        </Card>
      ) : (
        <HierarchyTree
          tree={tree}
          onAddRoom={handleAddRoom}
          onEditRoom={handleEditRoom}
          onDeleteRoom={handleDeleteRoom}
          onEditHouse={(house) => {
            setEditingHouse(house);
            setHouseModalOpen(true);
          }}
          onDeleteHouse={handleDeleteHouse}
          onAddAsset={(houseId, locationId) => navigate(`/assets/new?houseId=${houseId}&locationId=${locationId}`)}
        />
      )}

      <HouseFormModal
        open={houseModalOpen}
        house={editingHouse}
        onClose={() => {
          setHouseModalOpen(false);
          setEditingHouse(null);
        }}
        onSubmit={handleHouseSubmit}
      />
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

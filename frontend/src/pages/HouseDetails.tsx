import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, DoorOpen, Boxes } from "lucide-react";
import { housesApi } from "../api/housesApi";
import { locationsApi } from "../api/locationsApi";
import { assetsApi } from "../api/assetsApi";
import type { House, Location, Asset } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { AssetStatusBadge } from "../components/ui/StatusBadge";
import { LocationFormModal } from "../components/locations/LocationFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";

export function HouseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [house, setHouse] = useState<House | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Location | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    Promise.all([housesApi.get(id), locationsApi.list(id), assetsApi.list({ houseId: id })])
      .then(([h, locs, a]) => {
        setHouse(h);
        setLocations(locs);
        setAssets(a);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load house details")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleRoomSubmit = async (input: { name: string; description?: string }) => {
    if (!id) return;
    try {
      if (editingRoom) {
        await locationsApi.update(editingRoom._id, input);
        showToast("Room updated successfully");
      } else {
        await locationsApi.create({ ...input, houseId: id });
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

  if (loading) return <Spinner label="Loading house..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!house) return <ErrorState message="House not found" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/houses" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to Houses
        </Link>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{house.name}</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {house.address}, {house.city}
            </p>
            {house.description && <p className="text-sm text-slate-500 mt-2">{house.description}</p>}
          </div>
          <div className="flex gap-4 sm:gap-6 shrink-0">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">{locations.length}</p>
              <p className="text-xs text-slate-500">Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">{assets.length}</p>
              <p className="text-xs text-slate-500">Assets</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locations / Rooms</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingRoom(null);
              setRoomModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {locations.length === 0 ? (
            <EmptyState
              icon={<DoorOpen className="h-6 w-6" />}
              title="No rooms yet"
              description="Add rooms like Living Room, Kitchen, or Bedroom to start organizing assets."
              actionLabel="Add Room"
              onAction={() => setRoomModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {locations.map((location) => {
                const roomAssets = assets.filter((a) => {
                  const locId = typeof a.locationId === "object" ? a.locationId._id : a.locationId;
                  return locId === location._id;
                });
                return (
                  <div key={location._id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{location.name}</p>
                          {location.description && <p className="text-xs text-slate-400">{location.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/assets/new?houseId=${house._id}&locationId=${location._id}`)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Asset
                        </Button>
                        <button
                          onClick={() => {
                            setEditingRoom(location);
                            setRoomModalOpen(true);
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Edit room"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(location)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete room"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {roomAssets.length > 0 && (
                      <ul className="mt-3 pl-11 space-y-1.5">
                        {roomAssets.map((asset) => (
                          <li
                            key={asset._id}
                            onClick={() => navigate(`/assets/${asset._id}`)}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/40"
                          >
                            <span className="text-slate-700 flex items-center gap-1.5 truncate">
                              <Boxes className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {asset.name}
                            </span>
                            <AssetStatusBadge status={asset.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Home, MapPin, Pencil, Trash2, ChevronRight } from "lucide-react";
import { housesApi, type HouseInput } from "../api/housesApi";
import type { House } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { HouseFormModal } from "../components/houses/HouseFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";

export function Houses() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const { confirm, dialogProps } = useConfirm();

  const load = () => {
    setLoading(true);
    setError("");
    housesApi
      .list()
      .then(setHouses)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load houses")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (input: HouseInput) => {
    try {
      if (editingHouse) {
        await housesApi.update(editingHouse._id, input);
        showToast("House updated successfully");
      } else {
        await housesApi.create(input);
        showToast("House created successfully");
      }
      setModalOpen(false);
      setEditingHouse(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, "Failed to save house"), "error");
    }
  };

  const handleDelete = (house: House) => {
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

  if (loading) return <Spinner label="Loading houses..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Houses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your properties and their rooms.</p>
        </div>
        <Button
          onClick={() => {
            setEditingHouse(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add House
        </Button>
      </div>

      {houses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Home className="h-6 w-6" />}
            title="No houses yet"
            description="Add your first house to start organizing rooms and assets."
            actionLabel="Add House"
            onAction={() => setModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <Card key={house._id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Home className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingHouse(house);
                      setModalOpen(true);
                    }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Edit house"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(house)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete house"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{house.name}</h3>
              <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {house.address}, {house.city}
              </p>
              {house.description && <p className="text-sm text-slate-400 mt-2">{house.description}</p>}
              <button
                onClick={() => navigate(`/houses/${house._id}`)}
                className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Details <ChevronRight className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <HouseFormModal
        open={modalOpen}
        house={editingHouse}
        onClose={() => {
          setModalOpen(false);
          setEditingHouse(null);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

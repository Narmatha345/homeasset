import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, DoorOpen, Boxes, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { LocationTreeNode, Location } from "../../types";
import { Card } from "../ui/Card";
import { AssetStatusBadge } from "../ui/StatusBadge";

interface HierarchyTreeProps {
  tree: LocationTreeNode[];
  onAddRoom?: (houseId: string) => void;
  onEditRoom?: (location: Location) => void;
  onDeleteRoom?: (location: Location) => void;
}

export function HierarchyTree({ tree, onAddRoom, onEditRoom, onDeleteRoom }: HierarchyTreeProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="space-y-5">
      {tree.map(({ house, locations }) => (
        <Card key={house._id} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <Home className="h-4.5 w-4.5" />
              <div>
                <p className="font-semibold text-sm">{house.name}</p>
                <p className="text-xs text-slate-300">
                  {house.address}, {house.city}
                </p>
              </div>
            </div>
            {onAddRoom && (
              <button
                onClick={() => onAddRoom(house._id)}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium hover:bg-white/20"
              >
                <Plus className="h-3.5 w-3.5" /> Add Room
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {locations.length === 0 && <p className="px-5 py-6 text-sm text-slate-400 text-center">No rooms added yet.</p>}
            {locations.map(({ location, assets }) => {
              const isCollapsed = collapsed[location._id];
              return (
                <div key={location._id}>
                  <div className="flex items-center justify-between gap-3 px-5 py-3">
                    <button
                      onClick={() => toggle(location._id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <DoorOpen className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate">{location.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">
                        ({assets.length} asset{assets.length === 1 ? "" : "s"})
                      </span>
                    </button>
                    {(onEditRoom || onDeleteRoom) && (
                      <div className="flex items-center gap-1 shrink-0">
                        {onEditRoom && (
                          <button
                            onClick={() => onEditRoom(location)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Edit room"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteRoom && (
                          <button
                            onClick={() => onDeleteRoom(location)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete room"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="px-5 pb-4 pl-11">
                      {assets.length === 0 ? (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Boxes className="h-3.5 w-3.5" /> No assets in this room
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {assets.map((asset) => (
                            <li
                              key={asset._id}
                              onClick={() => navigate(`/assets/${asset._id}`)}
                              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/40"
                            >
                              <span className="text-slate-700 truncate">{asset.name}</span>
                              <AssetStatusBadge status={asset.status} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

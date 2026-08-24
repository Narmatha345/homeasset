import { Types } from "mongoose";
import { Asset } from "../models/Asset";
import { getMaintenanceStatus, getMaintenancePriority, MaintenanceStatus, MaintenancePriority } from "./maintenanceStatus";

export interface MaintenanceItem {
  assetId: Types.ObjectId;
  assetName: string;
  assetCode: string;
  location: string;
  house: string;
  maintenanceType: string;
  dueDate: Date;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function endOfWeek(d: Date) {
  const day = d.getDay();
  const diff = 6 - day;
  const end = new Date(d);
  end.setDate(d.getDate() + diff);
  end.setHours(23, 59, 59, 999);
  return end;
}
function startOfToday(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfToday(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Single source of truth for "what maintenance is coming up" — reused by the dashboard and
 * the dedicated Maintenance app so both always agree.
 */
export async function buildMaintenanceItems(userId?: string): Promise<MaintenanceItem[]> {
  const now = new Date();
  const assets = await Asset.find({ userId })
    .populate("locationId", "name")
    .populate("houseId", "name")
    .sort({ nextServiceDate: 1 });

  return assets
    .filter((a) => !!a.nextServiceDate)
    .map((a) => ({
      assetId: a._id,
      assetName: a.name,
      assetCode: a.assetId,
      location: (a.locationId as unknown as { name?: string })?.name || "Unassigned",
      house: (a.houseId as unknown as { name?: string })?.name || "",
      maintenanceType: a.maintenanceFrequency,
      dueDate: a.nextServiceDate as Date,
      status: getMaintenanceStatus(a.nextServiceDate, now),
      priority: getMaintenancePriority(a.nextServiceDate, now),
    }));
}

export function filterMaintenanceItems(items: MaintenanceItem[], range?: string): MaintenanceItem[] {
  if (!range) return items;
  const now = new Date();

  if (range === "today") {
    return items.filter((i) => new Date(i.dueDate) >= startOfToday(now) && new Date(i.dueDate) <= endOfToday(now));
  }
  if (range === "week") {
    return items.filter((i) => new Date(i.dueDate) <= endOfWeek(now) && new Date(i.dueDate) >= now);
  }
  if (range === "month") {
    return items.filter((i) => new Date(i.dueDate) <= endOfMonth(now) && new Date(i.dueDate) >= startOfMonth(now));
  }
  if (range === "overdue") {
    return items.filter((i) => i.status === "Overdue");
  }
  return items;
}

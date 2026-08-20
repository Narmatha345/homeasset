import { Request, Response } from "express";
import { Asset } from "../models/Asset";
import { ServiceRecord } from "../models/ServiceRecord";
import { asyncHandler } from "../utils/asyncHandler";
import { getMaintenanceStatus, getMaintenancePriority } from "../services/maintenanceStatus";

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

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const assets = await Asset.find({ userId: req.userId });

  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === "Active").length;
  const servicesDueThisMonth = assets.filter((a) => {
    if (!a.nextServiceDate) return false;
    const d = new Date(a.nextServiceDate);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  }).length;
  const overdueServices = assets.filter((a) => getMaintenanceStatus(a.nextServiceDate, now) === "Overdue").length;

  res.json({ totalAssets, activeAssets, servicesDueThisMonth, overdueServices });
});

export const getUpcomingMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query as { range?: string };
  const now = new Date();

  const assets = await Asset.find({ userId: req.userId })
    .populate("locationId", "name")
    .populate("houseId", "name")
    .sort({ nextServiceDate: 1 });

  let items = assets
    .filter((a) => !!a.nextServiceDate)
    .map((a) => ({
      assetId: a._id,
      assetName: a.name,
      assetCode: a.assetId,
      location: (a.locationId as unknown as { name?: string })?.name || "Unassigned",
      house: (a.houseId as unknown as { name?: string })?.name || "",
      maintenanceType: a.maintenanceFrequency,
      dueDate: a.nextServiceDate,
      status: getMaintenanceStatus(a.nextServiceDate, now),
      priority: getMaintenancePriority(a.nextServiceDate, now),
    }));

  if (range === "week") {
    items = items.filter((i) => new Date(i.dueDate as Date) <= endOfWeek(now) && new Date(i.dueDate as Date) >= now);
  } else if (range === "month") {
    items = items.filter((i) => new Date(i.dueDate as Date) <= endOfMonth(now) && new Date(i.dueDate as Date) >= startOfMonth(now));
  } else if (range === "overdue") {
    items = items.filter((i) => i.status === "Overdue");
  }

  res.json({ items });
});

export const getRecentlyServiced = asyncHandler(async (req: Request, res: Response) => {
  const records = await ServiceRecord.find({ userId: req.userId })
    .populate({ path: "assetId", select: "name assetId locationId", populate: { path: "locationId", select: "name" } })
    .sort({ serviceDate: -1 })
    .limit(6);
  res.json({ items: records });
});

export const getAssetsByLocationChart = asyncHandler(async (req: Request, res: Response) => {
  const assets = await Asset.find({ userId: req.userId }).populate("locationId", "name");
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const loc = asset.locationId as unknown as { name?: string } | null;
    const label = loc?.name || "Unassigned";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  res.json({ data: Array.from(counts.entries()).map(([location, count]) => ({ location, count })) });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const assets = await Asset.find({ userId: req.userId });
  const notifications: { id: string; message: string; type: "overdue" | "due-soon" | "warranty"; createdAt: Date }[] = [];

  for (const a of assets) {
    const status = getMaintenanceStatus(a.nextServiceDate, now);
    if (status === "Overdue") {
      notifications.push({
        id: `overdue-${a._id}`,
        message: `${a.name} maintenance is overdue.`,
        type: "overdue",
        createdAt: a.nextServiceDate as Date,
      });
    } else if (status === "Due Soon") {
      const days = Math.max(0, Math.ceil((new Date(a.nextServiceDate as Date).getTime() - now.getTime()) / 86400000));
      notifications.push({
        id: `due-soon-${a._id}`,
        message: `${a.name} service is due in ${days} day${days === 1 ? "" : "s"}.`,
        type: "due-soon",
        createdAt: a.nextServiceDate as Date,
      });
    }

    if (a.warrantyExpiry) {
      const daysToExpiry = Math.ceil((new Date(a.warrantyExpiry).getTime() - now.getTime()) / 86400000);
      if (daysToExpiry > 0 && daysToExpiry <= 30) {
        notifications.push({
          id: `warranty-${a._id}`,
          message: `${a.name} warranty expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"}.`,
          type: "warranty",
          createdAt: a.warrantyExpiry,
        });
      }
    }
  }

  notifications.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ notifications: notifications.slice(0, 15) });
});

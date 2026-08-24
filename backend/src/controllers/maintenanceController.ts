import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { buildMaintenanceItems, filterMaintenanceItems } from "../services/maintenanceQuery";

export const getUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const items = await buildMaintenanceItems(req.userId);
  res.json({ items });
});

export const getDue = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query as { range?: string };
  const items = await buildMaintenanceItems(req.userId);
  res.json({ items: filterMaintenanceItems(items, range || "today") });
});

export const getOverdue = asyncHandler(async (req: Request, res: Response) => {
  const items = await buildMaintenanceItems(req.userId);
  res.json({ items: filterMaintenanceItems(items, "overdue") });
});

import { Request, Response } from "express";
import { ServiceOrder, RequestType } from "../models/ServiceOrder";
import { Asset } from "../models/Asset";
import { ServiceRecord } from "../models/ServiceRecord";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getNextSequence } from "../utils/sequenceId";
import { applyServiceToAsset } from "../services/completeService";

export async function generateServiceOrderNumber(): Promise<string> {
  const seedCount = await ServiceOrder.countDocuments();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = await getNextSequence("serviceOrder", "SO", 4, seedCount);
    if (!(await ServiceOrder.exists({ serviceOrderNumber: candidate }))) return candidate;
  }
  throw ApiError.conflict("Could not generate a unique service order number, please try again");
}

// Maps a service order's request type to the closest ServiceRecord.serviceType when auto-logging completion.
const REQUEST_TYPE_TO_SERVICE_TYPE: Record<RequestType, string> = {
  Repair: "Repair",
  "Preventive Maintenance": "General Maintenance",
  Inspection: "Inspection",
  Cleaning: "Cleaning",
  "Part Replacement": "Part Replacement",
  Emergency: "Repair",
  Other: "Other",
};

export const listServiceOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, requestType, from, to, search, sortDir } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { userId: req.userId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (requestType) filter.requestType = requestType;
  if (from || to) {
    filter.requestedDate = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  let orders = await ServiceOrder.find(filter)
    .populate({ path: "assetId", select: "name assetId" })
    .populate({ path: "houseId", select: "name" })
    .populate({ path: "locationId", select: "name" })
    .sort({ requestedDate: sortDir === "asc" ? 1 : -1 });

  if (search) {
    const regex = new RegExp(search, "i");
    orders = orders.filter((o) => {
      const asset = o.assetId as unknown as { name?: string; assetId?: string } | null;
      return regex.test(o.serviceOrderNumber) || regex.test(asset?.name || "") || regex.test(asset?.assetId || "");
    });
  }

  res.json({ serviceOrders: orders });
});

export const getServiceOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ServiceOrder.findOne({ _id: req.params.id, userId: req.userId })
    .populate({ path: "assetId", select: "name assetId" })
    .populate({ path: "houseId", select: "name" })
    .populate({ path: "locationId", select: "name" });
  if (!order) throw ApiError.notFound("Service order not found");
  res.json({ serviceOrder: order });
});

export const createServiceOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const { assetId, requestType, requestedDate, description } = body as Record<string, string>;

  if (!assetId || !requestType || !requestedDate || !description) {
    throw ApiError.badRequest("Asset, request type, requested date and description are required");
  }

  const asset = await Asset.findOne({ _id: assetId, userId: req.userId });
  if (!asset) throw ApiError.badRequest("Invalid asset");

  const serviceOrderNumber = await generateServiceOrderNumber();
  const order = await ServiceOrder.create({
    ...body,
    serviceOrderNumber,
    houseId: asset.houseId,
    locationId: asset.locationId,
    userId: req.userId,
    status: "Open",
  });
  res.status(201).json({ serviceOrder: order });
});

export const updateServiceOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const order = await ServiceOrder.findOne({ _id: req.params.id, userId: req.userId });
  if (!order) throw ApiError.notFound("Service order not found");

  const wasCompleted = order.status === "Completed";
  const { serviceOrderNumber: _ignored, ...rest } = body;
  Object.assign(order, rest);
  await order.save();

  // Auto-log a service record + refresh the asset's maintenance dates the moment an order is completed.
  if (order.status === "Completed" && !wasCompleted) {
    const asset = await Asset.findOne({ _id: order.assetId, userId: req.userId });
    if (asset) {
      const record = await ServiceRecord.create({
        assetId: order.assetId,
        serviceOrderId: order._id,
        userId: req.userId,
        serviceDate: new Date(),
        serviceType: REQUEST_TYPE_TO_SERVICE_TYPE[order.requestType],
        description: order.description,
        notes: order.notes,
      });
      await applyServiceToAsset(asset, record.serviceDate);
    }
  }

  res.json({ serviceOrder: order });
});

export const deleteServiceOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ServiceOrder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!order) throw ApiError.notFound("Service order not found");
  res.json({ message: "Service order deleted" });
});

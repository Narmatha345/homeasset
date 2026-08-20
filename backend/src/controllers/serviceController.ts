import { Request, Response } from "express";
import { ServiceRecord } from "../models/ServiceRecord";
import { Asset } from "../models/Asset";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listServices = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, locationId, serviceType, from, to, search } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { userId: req.userId };
  if (assetId) filter.assetId = assetId;
  if (serviceType) filter.serviceType = serviceType;
  if (from || to) {
    filter.serviceDate = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  let records = await ServiceRecord.find(filter)
    .populate({ path: "assetId", select: "name assetId locationId houseId", populate: { path: "locationId", select: "name" } })
    .sort({ serviceDate: -1 });

  if (locationId) {
    records = records.filter((r) => {
      const asset = r.assetId as unknown as { locationId?: { _id?: unknown } };
      return String(asset?.locationId?._id) === locationId;
    });
  }

  if (search) {
    const regex = new RegExp(search, "i");
    records = records.filter((r) => {
      const asset = r.assetId as unknown as { name?: string; assetId?: string };
      return (
        regex.test(asset?.name || "") ||
        regex.test(asset?.assetId || "") ||
        regex.test(r.serviceProvider || "") ||
        regex.test(r.description || "")
      );
    });
  }

  res.json({ services: records });
});

export const getService = asyncHandler(async (req: Request, res: Response) => {
  const record = await ServiceRecord.findOne({ _id: req.params.id, userId: req.userId }).populate("assetId");
  if (!record) throw ApiError.notFound("Service record not found");
  res.json({ service: record });
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const { assetId, serviceDate, serviceType } = body as Record<string, string>;

  if (!assetId || !serviceDate || !serviceType) {
    throw ApiError.badRequest("assetId, serviceDate and serviceType are required");
  }

  const asset = await Asset.findOne({ _id: assetId, userId: req.userId });
  if (!asset) throw ApiError.badRequest("Invalid asset");

  const record = await ServiceRecord.create({ ...body, userId: req.userId });

  asset.lastServiceDate = record.serviceDate;
  if (record.nextServiceDate) {
    asset.nextServiceDate = record.nextServiceDate;
  }
  await asset.save();

  res.status(201).json({ service: record, asset });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const record = await ServiceRecord.findOne({ _id: req.params.id, userId: req.userId });
  if (!record) throw ApiError.notFound("Service record not found");

  Object.assign(record, req.body);
  await record.save();

  res.json({ service: record });
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const record = await ServiceRecord.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!record) throw ApiError.notFound("Service record not found");
  res.json({ message: "Service record deleted" });
});

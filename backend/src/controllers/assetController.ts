import { Request, Response } from "express";
import { Asset } from "../models/Asset";
import { House } from "../models/House";
import { Location } from "../models/Location";
import { ServiceRecord } from "../models/ServiceRecord";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getMaintenanceStatus } from "../services/maintenanceStatus";

function nextAssetId(seq: number): string {
  return `AST-${String(seq).padStart(5, "0")}`;
}

export async function generateAssetId(): Promise<string> {
  const count = await Asset.countDocuments();
  let seq = count + 1;
  let candidate = nextAssetId(seq);
  while (await Asset.exists({ assetId: candidate })) {
    seq += 1;
    candidate = nextAssetId(seq);
  }
  return candidate;
}

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const { houseId, locationId, category, status, search, warranty, maintenanceStatus, sortBy, sortDir } =
    req.query as Record<string, string>;

  const filter: Record<string, unknown> = { userId: req.userId };
  if (houseId) filter.houseId = houseId;
  if (locationId) filter.locationId = locationId;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (warranty === "active") filter.warrantyExpiry = { $gte: new Date() };
  if (warranty === "expired") filter.warrantyExpiry = { $lt: new Date() };

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { assetId: regex }, { brand: regex }, { model: regex }, { serialNumber: regex }];
  }

  const sortField = ["name", "purchaseDate", "nextServiceDate"].includes(sortBy) ? sortBy : "createdAt";
  const sort: Record<string, 1 | -1> = { [sortField]: sortDir === "desc" ? -1 : 1 };

  let assets = await Asset.find(filter).populate("locationId", "name").populate("houseId", "name").sort(sort);

  if (maintenanceStatus) {
    assets = assets.filter((a) => getMaintenanceStatus(a.nextServiceDate) === maintenanceStatus);
  }

  res.json({ assets });
});

export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.userId })
    .populate("locationId", "name")
    .populate("houseId", "name");
  if (!asset) throw ApiError.notFound("Asset not found");
  res.json({ asset });
});

async function assertOwnership(houseId: string, locationId: string, userId?: string) {
  const house = await House.findOne({ _id: houseId, userId });
  if (!house) throw ApiError.badRequest("Invalid house");
  const location = await Location.findOne({ _id: locationId, houseId });
  if (!location) throw ApiError.badRequest("Invalid room for the selected house");
}

export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const { name, category, houseId, locationId } = body as Record<string, string>;

  if (!name || !category || !houseId || !locationId) {
    throw ApiError.badRequest("Asset name, category, house and room are required");
  }
  await assertOwnership(houseId, locationId, req.userId);

  const assetId = (body.assetId as string) || (await generateAssetId());
  const existing = await Asset.findOne({ assetId });
  if (existing) throw ApiError.conflict(`Asset ID ${assetId} is already in use`);

  const asset = await Asset.create({ ...body, assetId, userId: req.userId });
  res.status(201).json({ asset });
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.userId });
  if (!asset) throw ApiError.notFound("Asset not found");

  const houseId = (body.houseId as string) || String(asset.houseId);
  const locationId = (body.locationId as string) || String(asset.locationId);
  await assertOwnership(houseId, locationId, req.userId);

  Object.assign(asset, body);
  await asset.save();
  res.json({ asset });
});

export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!asset) throw ApiError.notFound("Asset not found");
  await ServiceRecord.deleteMany({ assetId: asset._id });
  res.json({ message: "Asset deleted" });
});

export const assetsByLocation = asyncHandler(async (req: Request, res: Response) => {
  const assets = await Asset.find({ userId: req.userId }).populate("locationId", "name");
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const loc = asset.locationId as unknown as { name?: string } | null;
    const label = loc?.name || "Unassigned";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  res.json({ data: Array.from(counts.entries()).map(([location, count]) => ({ location, count })) });
});

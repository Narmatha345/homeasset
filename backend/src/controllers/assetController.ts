import { Request, Response } from "express";
import { Asset } from "../models/Asset";
import { House } from "../models/House";
import { Location } from "../models/Location";
import { ServiceRecord } from "../models/ServiceRecord";
import { ServiceOrder } from "../models/ServiceOrder";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getMaintenanceStatus } from "../services/maintenanceStatus";
import { getNextSequence } from "../utils/sequenceId";
import { calculateNextServiceDate } from "../utils/maintenanceDate";

export async function generateAssetId(): Promise<string> {
  const seedCount = await Asset.countDocuments();
  // Retry in the rare case a legacy/manually-inserted asset already holds the generated number.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = await getNextSequence("asset", "AST", 4, seedCount);
    if (!(await Asset.exists({ assetId: candidate }))) return candidate;
  }
  throw ApiError.conflict("Could not generate a unique asset number, please try again");
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
  const { name, category, brand, houseId, locationId } = body as Record<string, string>;

  if (!name || !category || !brand || !houseId || !locationId) {
    throw ApiError.badRequest("Asset name, category, brand, house and room are required");
  }
  await assertOwnership(houseId, locationId, req.userId);

  const assetId = await generateAssetId();
  // Asset numbers are always server-generated — ignore any client-supplied value.
  const { assetId: _ignored, ...rest } = body;
  const maintenanceFrequency = (rest.maintenanceFrequency as string) || "Every 6 Months";
  const nextServiceDate = calculateNextServiceDate(
    rest.lastServiceDate as string | undefined,
    maintenanceFrequency,
    rest.customFrequencyDays as number | undefined
  );

  const asset = await Asset.create({
    ...rest,
    assetId,
    userId: req.userId,
    nextServiceDate: nextServiceDate ?? rest.nextServiceDate,
  });
  res.status(201).json({ asset });
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.userId });
  if (!asset) throw ApiError.notFound("Asset not found");

  const houseId = (body.houseId as string) || String(asset.houseId);
  const locationId = (body.locationId as string) || String(asset.locationId);
  await assertOwnership(houseId, locationId, req.userId);

  // Asset numbers are always server-generated — never let clients change it after creation.
  const { assetId: _ignored, ...rest } = body;
  Object.assign(asset, rest);

  const nextServiceDate = calculateNextServiceDate(
    asset.lastServiceDate,
    asset.maintenanceFrequency,
    asset.customFrequencyDays
  );
  if (nextServiceDate) asset.nextServiceDate = nextServiceDate;

  await asset.save();
  res.json({ asset });
});

export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!asset) throw ApiError.notFound("Asset not found");
  await ServiceRecord.deleteMany({ assetId: asset._id });
  await ServiceOrder.deleteMany({ assetId: asset._id });
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

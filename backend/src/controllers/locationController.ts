import { Request, Response } from "express";
import { Location } from "../models/Location";
import { House } from "../models/House";
import { Asset } from "../models/Asset";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

async function assertHouseOwnership(houseId: string, userId?: string) {
  const house = await House.findOne({ _id: houseId, userId });
  if (!house) throw ApiError.notFound("House not found");
  return house;
}

export const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const { houseId } = req.query as { houseId?: string };
  const houseIds = houseId
    ? [houseId]
    : (await House.find({ userId: req.userId }).select("_id")).map((h) => String(h._id));

  const locations = await Location.find({ houseId: { $in: houseIds } }).sort({ createdAt: 1 });
  res.json({ locations });
});

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const { houseId, name, description } = req.body as Record<string, string>;
  if (!houseId || !name) throw ApiError.badRequest("houseId and name are required");

  await assertHouseOwnership(houseId, req.userId);
  const location = await Location.create({ houseId, name, description });
  res.status(201).json({ location });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as Record<string, string>;
  const location = await Location.findById(req.params.id);
  if (!location) throw ApiError.notFound("Location not found");
  await assertHouseOwnership(String(location.houseId), req.userId);

  location.name = name ?? location.name;
  location.description = description;
  await location.save();
  res.json({ location });
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw ApiError.notFound("Location not found");
  await assertHouseOwnership(String(location.houseId), req.userId);

  const assetCount = await Asset.countDocuments({ locationId: location._id });
  if (assetCount > 0) {
    throw ApiError.badRequest("Move or delete the assets in this room before deleting it");
  }

  await location.deleteOne();
  res.json({ message: "Location deleted" });
});

export const getLocationSummary = asyncHandler(async (req: Request, res: Response) => {
  const houses = await House.find({ userId: req.userId }).sort({ createdAt: 1 });
  const locations = await Location.find({ houseId: { $in: houses.map((h) => h._id) } }).sort({ createdAt: 1 });
  const assets = await Asset.find({ userId: req.userId }).sort({ createdAt: 1 });

  const tree = houses.map((house) => ({
    house,
    locations: locations
      .filter((loc) => String(loc.houseId) === String(house._id))
      .map((loc) => ({
        location: loc,
        assets: assets.filter((a) => String(a.locationId) === String(loc._id)),
      })),
  }));

  res.json({ tree });
});

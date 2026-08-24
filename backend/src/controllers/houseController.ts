import { Request, Response } from "express";
import { House } from "../models/House";
import { Location } from "../models/Location";
import { Asset } from "../models/Asset";
import { ServiceRecord } from "../models/ServiceRecord";
import { ServiceOrder } from "../models/ServiceOrder";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listHouses = asyncHandler(async (req: Request, res: Response) => {
  const houses = await House.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json({ houses });
});

export const getHouse = asyncHandler(async (req: Request, res: Response) => {
  const house = await House.findOne({ _id: req.params.id, userId: req.userId });
  if (!house) throw ApiError.notFound("House not found");
  res.json({ house });
});

export const createHouse = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, city, description } = req.body as Record<string, string>;
  if (!name || !address || !city) {
    throw ApiError.badRequest("House name, address and city are required");
  }
  const house = await House.create({ userId: req.userId, name, address, city, description });
  res.status(201).json({ house });
});

export const updateHouse = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, city, description } = req.body as Record<string, string>;
  const house = await House.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { name, address, city, description },
    { new: true, runValidators: true }
  );
  if (!house) throw ApiError.notFound("House not found");
  res.json({ house });
});

export const deleteHouse = asyncHandler(async (req: Request, res: Response) => {
  const house = await House.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!house) throw ApiError.notFound("House not found");

  const locations = await Location.find({ houseId: house._id });
  const assets = await Asset.find({ houseId: house._id });
  const assetIds = assets.map((a) => a._id);

  await ServiceRecord.deleteMany({ assetId: { $in: assetIds } });
  await ServiceOrder.deleteMany({ houseId: house._id });
  await Asset.deleteMany({ houseId: house._id });
  await Location.deleteMany({ houseId: house._id });

  res.json({ message: "House deleted", deletedLocations: locations.length, deletedAssets: assets.length });
});

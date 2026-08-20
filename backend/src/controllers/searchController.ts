import { Request, Response } from "express";
import { Asset } from "../models/Asset";
import { Location } from "../models/Location";
import { House } from "../models/House";
import { ServiceRecord } from "../models/ServiceRecord";
import { asyncHandler } from "../utils/asyncHandler";

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ assets: [], locations: [], services: [] });

  const regex = new RegExp(q, "i");
  const houseIds = (await House.find({ userId: req.userId }).select("_id")).map((h) => h._id);

  const [assets, locations, services] = await Promise.all([
    Asset.find({
      userId: req.userId,
      $or: [{ name: regex }, { assetId: regex }, { brand: regex }, { model: regex }, { serialNumber: regex }],
    })
      .limit(8)
      .populate("locationId", "name"),
    Location.find({ houseId: { $in: houseIds }, name: regex }).limit(5),
    ServiceRecord.find({ userId: req.userId })
      .populate({ path: "assetId", select: "name" })
      .limit(20)
      .then((records) =>
        records.filter((r) => regex.test(r.serviceProvider || "") || regex.test(r.description || "")).slice(0, 5)
      ),
  ]);

  res.json({ assets, locations, services });
});

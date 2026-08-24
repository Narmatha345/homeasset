import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getBrandsForCategory } from "../config/categoryBrands";

export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  res.json({ brands: getBrandsForCategory(category) });
});

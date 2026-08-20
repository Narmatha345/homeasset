import { Router } from "express";
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  assetsByLocation,
} from "../controllers/assetController";

const router = Router();

router.get("/", listAssets);
router.get("/by-location", assetsByLocation);
router.post("/", createAsset);
router.get("/:id", getAsset);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;

import { Router } from "express";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationSummary,
} from "../controllers/locationController";

const router = Router();

router.get("/", listLocations);
router.get("/summary", getLocationSummary);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

export default router;

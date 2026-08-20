import { Router } from "express";
import {
  getSummary,
  getUpcomingMaintenance,
  getRecentlyServiced,
  getAssetsByLocationChart,
  getNotifications,
} from "../controllers/dashboardController";

const router = Router();

router.get("/summary", getSummary);
router.get("/upcoming-maintenance", getUpcomingMaintenance);
router.get("/recently-serviced", getRecentlyServiced);
router.get("/assets-by-location", getAssetsByLocationChart);
router.get("/notifications", getNotifications);

export default router;

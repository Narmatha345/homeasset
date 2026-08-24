import { Router } from "express";
import { getUpcoming, getDue, getOverdue } from "../controllers/maintenanceController";

const router = Router();

router.get("/upcoming", getUpcoming);
router.get("/due", getDue);
router.get("/overdue", getOverdue);

export default router;

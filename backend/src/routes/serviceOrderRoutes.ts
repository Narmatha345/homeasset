import { Router } from "express";
import {
  listServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
} from "../controllers/serviceOrderController";

const router = Router();

router.get("/", listServiceOrders);
router.post("/", createServiceOrder);
router.get("/:id", getServiceOrder);
router.put("/:id", updateServiceOrder);
router.delete("/:id", deleteServiceOrder);

export default router;

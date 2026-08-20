import { Router } from "express";
import { listServices, getService, createService, updateService, deleteService } from "../controllers/serviceController";

const router = Router();

router.get("/", listServices);
router.post("/", createService);
router.get("/:id", getService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;

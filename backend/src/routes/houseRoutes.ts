import { Router } from "express";
import { listHouses, getHouse, createHouse, updateHouse, deleteHouse } from "../controllers/houseController";

const router = Router();

router.get("/", listHouses);
router.post("/", createHouse);
router.get("/:id", getHouse);
router.put("/:id", updateHouse);
router.delete("/:id", deleteHouse);

export default router;

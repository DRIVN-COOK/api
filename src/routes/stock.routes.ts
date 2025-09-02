import { Router } from "express";
import * as stockCtrl from "../controllers/stock.controller.js";

const router = Router();

router.post("/trucks/:truckId/replenish", stockCtrl.replenish);

export default router;

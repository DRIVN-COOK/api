import { Router } from "express";
import * as ctrl from "../controllers/warehouse-inventory.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

// Read
r.get("/", ctrl.list);
r.get("/:id", ctrl.getById);

// Manual adjustments (secured)
r.post("/", requireAuth, ctrl.createAdjust);
r.put("/:id", requireAuth, ctrl.updateAdjust);
r.delete("/:id", requireAuth, ctrl.removeAdjust);

export default r;

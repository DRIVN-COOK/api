import { Router } from "express";
import * as ctrl from "../controllers/sales-summary.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/rebuild", requireAuth, ctrl.rebuildPeriod); // job manuel

export default r;

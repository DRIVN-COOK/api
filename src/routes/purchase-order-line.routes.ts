import { Router } from "express";
import * as ctrl from "../controllers/purchase-order-line.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.addLine);
r.put("/:id", requireAuth, ctrl.updateLine);
r.delete("/:id", requireAuth, ctrl.removeLine);

export default r;

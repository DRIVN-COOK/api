import { Router } from "express";
import * as ctrl from "../controllers/purchase-order.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.createDraft);
r.post("/:id/submit", requireAuth, ctrl.submit);      // contrôle 80/20 ici
r.put("/:id", requireAuth, ctrl.updateDraft);
r.delete("/:id", requireAuth, ctrl.cancel);

export default r;

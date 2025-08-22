import { Router } from "express";
import * as ctrl from "../controllers/customer-order.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.create);           // ou public si précommande ouverte
r.put("/:id/status", requireAuth, ctrl.updateStatus);
r.delete("/:id", requireAuth, ctrl.cancel);

export default r;

import { Router } from "express";
import * as ctrl from "../controllers/loyalty-transaction.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.earnOrSpend); // tu pourras séparer earn/spend
r.delete("/:id", requireAuth, ctrl.revert); // annuler un mouvement

export default r;

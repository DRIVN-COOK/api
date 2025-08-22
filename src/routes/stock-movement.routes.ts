import { Router } from "express";
import * as ctrl from "../controllers/stock-movement.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);

export default r;

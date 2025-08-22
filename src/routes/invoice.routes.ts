import { Router } from "express";
import * as ctrl from "../controllers/invoice.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.issue);
r.get("/:id/pdf", requireAuth, ctrl.getPdf);

export default r;

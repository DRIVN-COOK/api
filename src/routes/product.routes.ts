import { Router } from "express";
import * as ctrl from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

// Public
r.get("/", ctrl.listPublic);
r.get("/:id", ctrl.getByIdPublic);

// Admin / secured
r.post("/", requireAuth, ctrl.create);
r.put("/:id", requireAuth, ctrl.update);
r.delete("/:id", requireAuth, ctrl.remove);

export default r;

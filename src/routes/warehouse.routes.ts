import { Router } from "express";
import * as ctrl from "../controllers/warehouse.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

// Public / list & read
r.get("/", ctrl.listPublic);
r.get("/:id", ctrl.getByIdPublic);

// Secured write ops
r.post("/", requireAuth, ctrl.create);
r.put("/:id", requireAuth, ctrl.update);
r.delete("/:id", requireAuth, ctrl.remove);

export default r;

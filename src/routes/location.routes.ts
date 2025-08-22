import { Router } from "express";
import * as ctrl from "../controllers/location.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", ctrl.listPublic);              // points publics visibles
r.get("/:id", ctrl.getByIdPublic);
r.post("/", requireAuth, ctrl.create);
r.put("/:id", requireAuth, ctrl.update);
r.delete("/:id", requireAuth, ctrl.remove);

export default r;

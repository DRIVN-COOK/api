import { Router } from "express";
import * as ctrl from "../controllers/event-registration.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", ctrl.registerPublic);         // inscription client
r.delete("/:id", requireAuth, ctrl.cancel);

export default r;

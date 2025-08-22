import { Router } from "express";
import * as ctrl from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.post("/register", ctrl.register);
r.post("/login", ctrl.login);
r.post("/refresh", ctrl.refresh);
r.post("/logout", ctrl.logout);
r.get("/me", requireAuth, ctrl.me);

export default r;

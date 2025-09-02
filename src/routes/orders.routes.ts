import { Router } from "express";
import * as ctrl from "../controllers/customer-order.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// LIST + GET
router.get("/", requireAuth, ctrl.list);
router.get("/:id", requireAuth, ctrl.getById);

// CREATE
router.post("/", ctrl.create); // public si tu veux des précommandes

// UPDATE STATUS + CANCEL (méthodes réellement exportées)
router.patch("/:id/status", requireAuth, ctrl.updateStatus);
router.post("/:id/cancel", requireAuth, ctrl.cancel);

export default router;

import { Router } from "express";
import * as ctrl from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

r.get("/", requireAuth, ctrl.list);
r.get("/:id", requireAuth, ctrl.getById);
r.post("/", requireAuth, ctrl.create);
r.post("/:id/capture", requireAuth, ctrl.capture);
r.post("/:id/refund", requireAuth, ctrl.refund);
r.put("/:id", requireAuth, ctrl.update);
r.delete("/:id", requireAuth, ctrl.remove);

r.post("/checkout/franchise-entry", requireAuth, ctrl.checkoutFranchiseEntry);
r.post("/confirm", requireAuth, ctrl.confirm);

// ✅ corriger ici : utiliser ctrl au lieu de payment
r.post(
  "/customer-orders/:id/checkout-session",
  requireAuth,
  ctrl.createCustomerOrderCheckoutSession
);

export default r;

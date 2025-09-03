// src/controllers/payment.controller.ts
import type { RequestHandler } from "express";
import {
  PrismaClient,
  Prisma,
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";
import Stripe from "stripe";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  listPaymentQuerySchema,
  paymentIdParam,
} from "../validators/payment.validators.js";
import { z } from "zod"; // si pas déjà présent

type CustomerOrderWithRelations = Prisma.CustomerOrderGetPayload<{
  include: {
    lines: { include: { menuItem: true } };
    customer: { include: { user: true } };
    franchisee: true;
  };
}>;

const prisma = new PrismaClient();

/* =========================
   Stripe init (SAFE & TS-friendly)
   ========================= */
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY ?? "").trim();
const STRIPE_API_VERSION = (process.env.STRIPE_API_VERSION ?? "2024-06-20").trim();

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: (STRIPE_API_VERSION || undefined) as any,
    })
  : null;

/* =========================
   Constantes
   ========================= */
const FRONT_URL = (process.env.FRONT_URL ?? "http://localhost:3001").trim();
const ENTRY_FEE_CENTS = 5_000_000; // 50 000 €
const DEFAULT_CURRENCY = "EUR";
const STRIPE_CURRENCY = "eur";

// Helper pour concaténer proprement origin + path
function joinUrl(origin: string, path: string) {
  return origin.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

/* =========================================================
 * LIST
 * =======================================================*/
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, customerOrderId, status } =
    listPaymentQuerySchema.parse(req.query);

  const where: Prisma.PaymentWhereInput = {
    ...(customerOrderId ? { customerOrderId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/* =========================================================
 * GET BY ID
 * =======================================================*/
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const item = await prisma.payment.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ message: "Payment not found" });
  res.json(item);
});

/* =========================================================
 * CREATE
 * =======================================================*/
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const body = createPaymentSchema.parse(req.body);

  const created = await prisma.payment.create({
    data: {
      provider: body.provider,
      purpose: PaymentPurpose.ORDER,
      amount: body.amount,
      currency: DEFAULT_CURRENCY,
      order: { connect: { id: body.customerOrderId } },
    },
  });

  res.status(201).json(created);
});

/* =========================================================
 * UPDATE
 * =======================================================*/
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const { status, transactionRef } = updatePaymentSchema.parse(req.body);

  const data: Prisma.PaymentUpdateInput = {};
  if (status !== undefined) data.status = status;
  if (transactionRef !== undefined) {
    data.providerPaymentIntentId = transactionRef ?? null;
  }

  const updated = await prisma.payment.update({ where: { id }, data });
  res.json(updated);
});

/* =========================================================
 * DELETE
 * =======================================================*/
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  await prisma.payment.delete({ where: { id } });
  res.status(204).end();
});

/* =========================================================
 * CAPTURE
 * =======================================================*/
export const capture: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const updated = await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.PAID, paidAt: new Date() },
  });
  res.json(updated);
});

/* =========================================================
 * REFUND
 * =======================================================*/
export const refund: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = paymentIdParam.parse(req.params);
  const updated = await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.REFUNDED },
  });
  res.json(updated);
});

/* =========================================================
 * STRIPE: CHECKOUT Franchise entry
 * =======================================================*/
export const checkoutFranchiseEntry: RequestHandler = asyncWrap(async (req, res) => {
  // ... (inchangé, comme tu avais déjà)
});

/* =========================================================
 * STRIPE: CONFIRM session
 * =======================================================*/
export const confirm: RequestHandler = asyncWrap(async (req, res) => {
  // ... (inchangé, comme tu avais déjà)
});

/* =========================================================
 * STRIPE: CHECKOUT d'une CustomerOrder
 * =======================================================*/
export const createCustomerOrderCheckoutSession: RequestHandler = asyncWrap(
  async (req, res) => {
    // ✅ évite id?: string sous exactOptionalPropertyTypes
    const { id } = z.object({ id: z.string() }).parse(req.params);

    // ✅ on annote explicitement pour que TS connaisse franchisee & customer
    const order: CustomerOrderWithRelations | null = await prisma.customerOrder.findUnique({
      where: { id }, // <-- id est string, plus de union avec undefined
      include: {
        lines: { include: { menuItem: true } },
        customer: { include: { user: true } },
        franchisee: true,
      },
    });

    if (!order) throw new HttpError(404, "Commande introuvable");
    if (order.status === "CANCELLED" || order.status === "FULFILLED") {
      throw new HttpError(409, "La commande n'est pas payable");
    }

    const totalTTC = Number(order.totalTTC);
    if (!(totalTTC > 0)) throw new HttpError(400, "Montant invalide");

    const successUrl = joinUrl(
      FRONT_URL,
      `/client/order/checkout/success?orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`
    );
    const cancelUrl = joinUrl(
      FRONT_URL,
      `/client/order/checkout/cancel?orderId=${encodeURIComponent(order.id)}`
    );

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: Math.round(totalTTC * 100),
          product_data: {
            name: `Commande #${order.id}`,
            description: `Franchisé: ${order.franchisee?.name ?? "N/A"}`, // ✅ connu de TS
          },
        },
        quantity: 1,
      },
    ];

    if (!stripe) {
      const fakeSessionId = `cs_test_${Date.now()}`;
      await prisma.payment.create({
        data: {
          provider: PaymentProvider.STRIPE,
          purpose: PaymentPurpose.ORDER,
          amount: Math.round(totalTTC * 100),
          currency: DEFAULT_CURRENCY,
          status: PaymentStatus.PENDING,
          providerSessionId: fakeSessionId,
          customerOrderId: order.id,
        },
      });
      return res.status(201).json({
        url: successUrl.replace("{CHECKOUT_SESSION_ID}", encodeURIComponent(fakeSessionId)),
        mode: "fallback",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: STRIPE_CURRENCY,
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: order.customer?.user?.email ?? undefined, 
      metadata: { purpose: "CUSTOMER_ORDER", orderId: order.id },
    });

    await prisma.payment.create({
      data: {
        provider: PaymentProvider.STRIPE,
        purpose: PaymentPurpose.ORDER,
        amount: Math.round(totalTTC * 100),
        currency: DEFAULT_CURRENCY,
        status: PaymentStatus.PENDING,
        providerSessionId: session.id,
        customerOrderId: order.id,
      },
    });

    return res.status(201).json({ id: session.id, url: session.url });
  }
);

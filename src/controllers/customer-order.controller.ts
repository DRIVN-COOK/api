// src/controllers/customer-order.controller.ts
import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createCustomerOrderSchema,
  updateCustomerOrderStatusSchema,
  listCustomerOrderQuerySchema,
  coIdParam,
} from "../validators/customer-order.validators.js";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

export const list: RequestHandler = asyncWrap(async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    q,
    status,
    franchiseeId,
    customerId,
  } = listCustomerOrderQuerySchema.parse(req.query);

  const AND: Prisma.CustomerOrderWhereInput[] = [];

  if (status) AND.push({ status });
  if (franchiseeId) AND.push({ franchiseeId });
  if (customerId) AND.push({ customerId });

  // Recherche plein texte simple sur plusieurs champs (id, franchisé, VIN, client)
  if (q && q.trim()) {
    const term = q.trim();
    AND.push({
      OR: [
        { id: { contains: term, mode: "insensitive" } },
        { franchisee: { name: { contains: term, mode: "insensitive" } } },
        { truck: { vin: { contains: term, mode: "insensitive" } } },
        {
          customer: {
            user: {
              OR: [
                { email: { contains: term, mode: "insensitive" } },
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  const where: Prisma.CustomerOrderWhereInput = AND.length ? { AND } : {};

  const [items, total] = await Promise.all([
    prisma.customerOrder.findMany({
      where,
      include: {
        // <- IMPORTANT : on inclut les champs attendus par ton tableau
        franchisee: { select: { id: true, name: true } },
        truck: { select: { id: true, vin: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { placedAt: "desc" },
    }),
    prisma.customerOrder.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const item = await prisma.customerOrder.findUnique({
    where: { id },
    include: {
      lines: { include: { menuItem: true } },
      payments: true,
      invoice: true,
    },
  });
  if (!item) throw new HttpError(404, "Customer order not found");
  res.json(item);
});

export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createCustomerOrderSchema.parse(req.body);

  const {
    truckId,
    warehouseId,
    scheduledPickupAt,
    ...required // customerId, franchiseeId, channel, totalHT, totalTVA, totalTTC, etc.
  } = data;

  const payload: Prisma.CustomerOrderUncheckedCreateInput = {
    ...required,
    ...(truckId ? { truckId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(scheduledPickupAt ? { scheduledPickupAt } : {}),
  };

  const created = await prisma.customerOrder.create({ data: payload });
  res.status(201).json(created);
});

export const updateStatus: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const { status } = updateCustomerOrderStatusSchema.parse(req.body);
  const updated = await prisma.customerOrder.update({ where: { id }, data: { status } });
  res.json(updated);
});

export const cancel: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = coIdParam.parse(req.params);
  const co = await prisma.customerOrder.findUnique({ where: { id } });
  if (!co) throw new HttpError(404, "Customer order not found");
  if (["FULFILLED", "CANCELLED"].includes(co.status)) {
    throw new HttpError(409, "Order cannot be cancelled");
  }
  await prisma.customerOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  res.status(204).end();
});

/**
 * Génération d’un PDF récapitulatif pour une commande client (non stocké en base)
 */
type OrderWithRelations = Prisma.CustomerOrderGetPayload<{
  include: {
    customer: { include: { user: true } };
    franchisee: true;
    truck: true;
    lines: { include: { menuItem: true } };
    payments: true;
  };
}>;

export const downloadPdf: RequestHandler = asyncWrap(async (req, res) => {
  // ✅ Assure un id: string (et pas string | undefined)
  const { id } = coIdParam.parse(req.params);

  const order: OrderWithRelations | null = await prisma.customerOrder.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      franchisee: true,
      truck: true,
      lines: { include: { menuItem: true } },
      payments: true,
    },
  });

  if (!order) throw new HttpError(404, "Customer order not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="order-${order.id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // En-tête
  doc.fontSize(18).text("Récapitulatif de commande", { align: "center" });
  doc.moveDown();

  // Infos commande
  doc.fontSize(12).text(`Commande #${order.id}`);
  doc.text(`Franchisé : ${order.franchisee.name}`);
  if (order.truck) doc.text(`Camion VIN : ${order.truck.vin}`);
  const u = order.customer.user;
  doc.text(`Client : ${[u.firstName, u.lastName].filter(Boolean).join(" ")} (${u.email})`);
  doc.text(`Date : ${new Date(order.placedAt).toLocaleString("fr-FR")}`);
  doc.moveDown();

  // Lignes
  doc.fontSize(14).text("Articles :", { underline: true });
  doc.moveDown(0.5);
  order.lines.forEach((l) => {
    doc.fontSize(12).text(`- ${l.menuItem.name} ×${l.qty} @ ${l.unitPriceHT} € HT`);
  });
  doc.moveDown();

  // Totaux
  doc.fontSize(14).text("Totaux :", { underline: true });
  doc.fontSize(12).text(`HT : ${order.totalHT} €`);
  doc.text(`TVA : ${order.totalTVA} €`);
  doc.text(`TTC : ${order.totalTTC} €`);

  doc.end();
});

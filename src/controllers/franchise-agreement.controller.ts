import type { RequestHandler } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncWrap, HttpError } from "../utils/handlers.js";
import {
  createFranchiseAgreementSchema,
  updateFranchiseAgreementSchema,
  listFranchiseAgreementQuerySchema,
  franchiseAgreementIdParam,
} from "../validators/franchise-agreement.validators.js";

// + PDF
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

// === Politique commerciale (verrouillage serveur) ===
export const FIXED_ENTRY_FEE = "50000.00";    // € HT
export const FIXED_REVENUE_PCT = "0.0400";    // 4.00%

// === Helpers ===
function assertEndAfterStart(start: Date, end?: Date | null) {
  if (!end) return;
  if (end.getTime() < start.getTime()) {
    throw new HttpError(400, "endDate cannot be before startDate");
  }
}

function fmtMoneyEUR(v: any): string {
  // Prisma Decimal ou string → toujours string
  const s = typeof v === "string" ? v : String(v);
  return `${Number(s).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fmtPct(v: any): string {
  const s = typeof v === "string" ? v : String(v);
  // "0.0400" → "4.00 %"
  return `${(Number(s) * 100).toFixed(2)} %`;
}

function dateISO(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0,10) : "";
}

/**
 * GET /franchise-agreements
 */
export const list: RequestHandler = asyncWrap(async (req, res) => {
  const { page = 1, pageSize = 20, franchiseeId } =
    listFranchiseAgreementQuerySchema.parse(req.query);

  const where: Prisma.FranchiseAgreementWhereInput = {
    ...(franchiseeId ? { franchiseeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.franchiseAgreement.findMany({
      where,
      include: { franchisee: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: "desc" },
    }),
    prisma.franchiseAgreement.count({ where }),
  ]);

  res.json({ items, page, pageSize, total });
});

/**
 * GET /franchise-agreements/:id
 */
export const getById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  const item = await prisma.franchiseAgreement.findUnique({
    where: { id },
    include: { franchisee: true },
  });
  if (!item) throw new HttpError(404, "Agreement not found");
  res.json(item);
});

/**
 * POST /franchise-agreements
 * - force les montants fixés côté serveur
 * - valide end >= start
 */
export const create: RequestHandler = asyncWrap(async (req, res) => {
  const data = createFranchiseAgreementSchema.parse(req.body);

  const start = new Date(data.startDate);
  const end = data.endDate ? new Date(data.endDate) : null;
  assertEndAfterStart(start, end);

  // On ignore ce qui arrive du client pour les montants et on force les valeurs
  const payload: Prisma.FranchiseAgreementCreateInput = {
    franchisee: { connect: { id: data.franchiseeId } },
    startDate: start,
    endDate: end, // null ou Date
    entryFeeAmount: FIXED_ENTRY_FEE,      // ← verrouillé
    revenueSharePct: FIXED_REVENUE_PCT,   // ← verrouillé
    notes: data.notes ?? null,
  };

  const created = await prisma.franchiseAgreement.create({
    data: payload,
    include: { franchisee: true },
  });
  res.status(201).json(created);
});

/**
 * PATCH /franchise-agreements/:id
 * - interdit la modification des montants
 * - valide end >= start quand ces champs sont fournis
 */
export const update: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  const data = updateFranchiseAgreementSchema.parse(req.body);

  // Interdire toute tentative de modifier les montants (on ignore silencieusement)
  const { entryFeeAmount, revenueSharePct, ...rest } = data as any;

  // On doit éventuellement valider les dates si présentes
  // Pour ça, on récupère l'existant si nécessaire
  const existing = await prisma.franchiseAgreement.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Agreement not found");

  const nextStart = rest.startDate ? new Date(rest.startDate) : existing.startDate;
  const nextEnd   = rest.endDate !== undefined ? (rest.endDate ? new Date(rest.endDate) : null) : existing.endDate;

  assertEndAfterStart(nextStart, nextEnd ?? undefined);

  const relationPart: Prisma.FranchiseAgreementUpdateInput = {
    ...(rest.franchiseeId !== undefined
      ? { franchisee: { connect: { id: rest.franchiseeId } } }
      : {}),
  };

  const scalarPart: Prisma.FranchiseAgreementUpdateInput = {
    ...(rest.startDate !== undefined ? { startDate: { set: nextStart } } : {}),
    ...(rest.endDate !== undefined ? { endDate: { set: nextEnd } } : {}),
    // montants ignorés, on les reforce à la valeur fixe pour éviter toute dérive
    entryFeeAmount: { set: FIXED_ENTRY_FEE },
    revenueSharePct: { set: FIXED_REVENUE_PCT },
    ...(rest.notes !== undefined ? { notes: { set: rest.notes ?? null } } : {}),
  };

  const payload: Prisma.FranchiseAgreementUpdateInput = {
    ...relationPart,
    ...scalarPart,
  };

  const updated = await prisma.franchiseAgreement.update({
    where: { id },
    data: payload,
    include: { franchisee: true },
  });

  res.json(updated);
});

/**
 * DELETE /franchise-agreements/:id
 */
export const remove: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  await prisma.franchiseAgreement.delete({ where: { id } });
  res.status(204).end();
});


/**
 * GET /franchise-agreements/:id/pdf
 * OU (si tu préfères matcher le front) 
 * GET /franchisees/:franchiseeId/agreements/:id/pdf  → utilise plutôt pdfByFranchisee ci-dessous
 */
export const pdfById: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse(req.params);
  const ag = await prisma.franchiseAgreement.findUnique({
    where: { id },
    include: { franchisee: true },
  });
  if (!ag) throw new HttpError(404, "Agreement not found");

  const filename = buildFilename(ag.franchisee?.name ?? "franchise", ag.startDate);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = buildAgreementPdf(ag);
  doc.pipe(res);
  doc.end();
});

/**
 * Variante qui colle exactement à l’URL utilisée par le front:
 * GET /franchisees/:franchiseeId/agreements/:id/pdf
 */
export const pdfByFranchisee: RequestHandler = asyncWrap(async (req, res) => {
  const { id } = franchiseAgreementIdParam.parse({ id: req.params.id });
  const { franchiseeId } = req.params;

  if (!franchiseeId) {
    throw new HttpError(400, "Missing franchiseeId");
  }

  // 1) Récupère le contrat par son id (include relation)
  const ag = await prisma.franchiseAgreement.findUnique({
    where: { id },
    include: { franchisee: true },
  });
  if (!ag || ag.franchiseeId !== franchiseeId) {
    throw new HttpError(404, "Agreement not found");
  }

  // 2) Stream du PDF
  const filename = buildFilename(ag.franchisee?.name ?? "franchise", ag.startDate);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = buildAgreementPdf(ag);
  doc.pipe(res);
  doc.end();
});

// ====== PDF helpers ======

function buildFilename(franchiseeName: string, startDate: Date) {
  const y = startDate.getFullYear();
  const m = String(startDate.getMonth() + 1).padStart(2, "0");
  const d = String(startDate.getDate()).padStart(2, "0");
  const base = franchiseeName
    .replace(/[^\p{L}\p{N}\-_.\s]/gu, "")
    .trim()
    .replace(/\s+/g, "_");
  return `Contrat_${base}_${y}-${m}-${d}.pdf`;
}

function buildAgreementPdf(ag: {
  id: string;
  startDate: Date;
  endDate: Date | null;
  entryFeeAmount: any;
  revenueSharePct: any;
  notes: string | null;
  franchisee?: { id: string; name: string } | null;
}) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // En-tête
  doc.fontSize(18).text("Contrat de Franchise", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Contrat n°: ${ag.id}`);
  doc.text(`Franchisé: ${ag.franchisee?.name ?? "—"} (ID: ${ag.franchisee?.id ?? "—"})`);
  doc.moveDown();

  // Bloc dates
  doc.fontSize(12).text("Période du contrat", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10)
     .text(`Date de début : ${dateISO(ag.startDate)}`)
     .text(`Date de fin   : ${ag.endDate ? dateISO(ag.endDate) : "—"}`);
  doc.moveDown();

  // Bloc montants
  doc.fontSize(12).text("Conditions financières", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10)
     .text(`Droit d’entrée : ${fmtMoneyEUR(ag.entryFeeAmount)}`)
     .text(`Redevance      : ${fmtPct(ag.revenueSharePct)}`);
  doc.moveDown();

  // Bloc notes
  doc.fontSize(12).text("Notes", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10).text(ag.notes ?? "—", { align: "left" });
  doc.moveDown();

  // Pied de page
  doc.moveDown(2);
  doc.fontSize(9).fillColor("gray")
     .text("Document généré par DRIVN-COOK • Confidentiel", { align: "center" })
     .fillColor("black");

  return doc;
}

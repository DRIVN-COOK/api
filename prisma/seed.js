// prisma/seed.js
/* eslint-disable no-console */
import pkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// --- Constantes "politiques" ---
const FIXED_ENTRY_FEE   = '50000.00'; // € HT (string pour Decimal)
const FIXED_REVENUE_PCT = '0.0400';   // 4.00% (string pour Decimal)

// --- Helpers génériques ---
const today = () => new Date();
function vin(i) {
  return `VF1DRIVN${String(100000 + i)}`.padEnd(17, 'X').slice(0, 17);
}
function plate(i) {
  return `AA-${String(100 + i)}-ZZ`;
}
async function hash(pwd) {
  return bcrypt.hash(pwd, 10);
}
async function trySeed(label, fn) {
  try {
    const out = await fn();
    const n = Array.isArray(out) ? out.length : 'done';
    console.log(`  → ${label}: OK (${n})`);
    return out;
  } catch (e) {
    console.warn(`  → Skipping ${label} (schema mismatch?): ${e.message || e}`);
    return [];
  }
}

// -----------------------------------------------------
// Franchises
// -----------------------------------------------------
async function seedFranchisees() {
  const rows = [
    { name: 'Burger Express Paris 12',  siren: '111111111', contactEmail: 'paris12@franch.com' },
    { name: 'Taco Vitry',               siren: '222222222', contactEmail: 'vitry@franch.com' },
    { name: 'Wrap & Go Nanterre',       siren: '333333333', contactEmail: 'nanterre@franch.com' },
    { name: 'Hot-Dog Saint-Denis',      siren: '444444444', contactEmail: 'std@franch.com' },
    { name: 'Frites Créteil',           siren: '555555555', contactEmail: 'creteil@franch.com' },
  ];

  const out = [];
  for (const f of rows) {
    const row = await prisma.franchisee.upsert({
      where: { siren: f.siren },
      update: {
        name: f.name,
        contactEmail: f.contactEmail,
        active: true,
      },
      create: {
        ...f,
        active: true,
        joinDate: today(),
      },
    });
    out.push(row);
  }
  return out;
}

async function seedAgreements(franchisees) {
  const out = [];
  for (const fr of franchisees) {
    const startDate = new Date('2025-01-01');

    const maybeExisting = await prisma.franchiseAgreement.findFirst({
      where: { franchiseeId: fr.id, startDate },
      select: { id: true },
    });
    if (maybeExisting) {
      out.push(await prisma.franchiseAgreement.findUnique({ where: { id: maybeExisting.id } }));
      continue;
    }
    const ag = await prisma.franchiseAgreement.create({
      data: {
        franchisee: { connect: { id: fr.id } },
        startDate,
        endDate: null,
        entryFeeAmount: FIXED_ENTRY_FEE,
        revenueSharePct: FIXED_REVENUE_PCT,
        notes: 'Contrat initial',
      },
    });
    out.push(ag);
  }
  return out;
}

// -----------------------------------------------------
// Trucks
// -----------------------------------------------------
async function seedTrucks(franchisees) {
  const out = [];

  // Franchisee[0] → 3 camions
  for (let i = 0; i < 3; i++) {
    const v = vin(i + 1);
    const p = plate(i + 1);
    const row = await prisma.truck.upsert({
      where: { vin: v },
      update: {
        plateNumber: p,
        active: true,
        currentStatus: 'DEPLOYED',
      },
      create: {
        franchisee: { connect: { id: franchisees[0].id } },
        vin: v,
        plateNumber: p,
        model: null,
        purchaseDate: new Date('2024-06-01'),
        active: true,
        currentStatus: 'DEPLOYED',
      },
    });
    out.push(row);
  }

  // Franchisee[1] → 2 camions
  for (let i = 0; i < 2; i++) {
    const v = vin(100 + i);
    const p = plate(100 + i);
    const row = await prisma.truck.upsert({
      where: { vin: v },
      update: {
        plateNumber: p,
        active: true,
        currentStatus: 'DEPLOYED',
      },
      create: {
        franchisee: { connect: { id: franchisees[1].id } },
        vin: v,
        plateNumber: p,
        model: null,
        purchaseDate: new Date('2024-07-15'),
        active: true,
        currentStatus: 'DEPLOYED',
      },
    });
    out.push(row);
  }

  // Franchisee[2] → 1 camion
  {
    const v = vin(300);
    const p = plate(300);
    const row = await prisma.truck.upsert({
      where: { vin: v },
      update: {
        plateNumber: p,
        active: true,
        currentStatus: 'DEPLOYED',
      },
      create: {
        franchisee: { connect: { id: franchisees[2].id } },
        vin: v,
        plateNumber: p,
        model: 'FoodTruck V2',
        purchaseDate: new Date('2024-09-01'),
        active: true,
        currentStatus: 'DEPLOYED',
      },
    });
    out.push(row);
  }

  // Franchisee[3] → 1 camion
  {
    const v = vin(400);
    const p = plate(400);
    const row = await prisma.truck.upsert({
      where: { vin: v },
      update: {
        plateNumber: p,
        active: true,
        currentStatus: 'DEPLOYED',
      },
      create: {
        franchisee: { connect: { id: franchisees[3].id } },
        vin: v,
        plateNumber: p,
        model: 'FoodTruck V1',
        purchaseDate: new Date('2024-10-01'),
        active: true,
        currentStatus: 'DEPLOYED',
      },
    });
    out.push(row);
  }

  return out; // total: 7 camions
}

// -----------------------------------------------------
// Warehouses (Île-de-France) – champs alignés: name, address, city, postalCode, hasKitchen, lat, lng, active
// -----------------------------------------------------
async function seedWarehouses() {
  const rows = [
    {
      name: 'Entrepôt Paris 12 (Bercy)',
      address: '2 Rue Lamblardie',
      city: 'Paris',
      postalCode: '75012',
      hasKitchen: true,
      active: true,
      lat: 48.835, lng: 2.405,
    },
    {
      name: 'Entrepôt Nanterre Préfecture',
      address: '10 Esplanade Charles-de-Gaulle',
      city: 'Nanterre',
      postalCode: '92000',
      hasKitchen: true,
      active: true,
      lat: 48.892, lng: 2.206,
    },
    {
      name: 'Entrepôt Saint-Denis Stade',
      address: '24 Rue du Landy',
      city: 'Saint-Denis',
      postalCode: '93200',
      hasKitchen: false,
      active: true,
      lat: 48.923, lng: 2.357,
    },
    {
      name: 'Entrepôt Créteil Soleil',
      address: '101 Av. du Général de Gaulle',
      city: 'Créteil',
      postalCode: '94000',
      hasKitchen: false,
      active: true,
      lat: 48.785, lng: 2.455,
    },
  ];

  const out = [];
  for (const w of rows) {
    const existing = await prisma.warehouse.findFirst({
      where: { name: w.name, city: w.city, postalCode: w.postalCode },
      select: { id: true },
    });
    if (existing) {
      const updated = await prisma.warehouse.update({
        where: { id: existing.id },
        data: {
          address: w.address,
          hasKitchen: w.hasKitchen ?? undefined,
          active: w.active ?? true,
          lat: w.lat ?? null,
          lng: w.lng ?? null,
        },
      });
      out.push(updated);
    } else {
      const created = await prisma.warehouse.create({
        data: {
          name: w.name,
          address: w.address,
          city: w.city,
          postalCode: w.postalCode,
          hasKitchen: w.hasKitchen ?? undefined,
          active: w.active ?? true,
          lat: w.lat ?? null,
          lng: w.lng ?? null,
        },
      });
      out.push(created);
    }
  }
  return out;
}

async function attachTrucksToWarehouses(trucks, warehouses) {
  if (!trucks.length || !warehouses.length) return trucks;
  for (let i = 0; i < trucks.length; i++) {
    const wh = warehouses[i % warehouses.length];
    try {
      await prisma.truck.update({
        where: { id: trucks[i].id },
        data: { warehouse: { connect: { id: wh.id } } }, // si relation existe
      });
    } catch {
      // pas de relation truck→warehouse → ignore
    }
  }
  return trucks;
}

// -----------------------------------------------------
// Users (12) – ≥1 ADMIN, certains rattachés via pivot FranchiseUser
// -----------------------------------------------------
async function seedUsers(franchisees) {
  const basePwd = await hash('Admin123!');

  const rows = [
    { email: 'alice.admin@drivncook.local', role: 'ADMIN',  firstName: 'Alice',  lastName: 'Admin' },
    { email: 'henri.hq@drivncook.local',    role: 'ADMIN',  firstName: 'Henri',  lastName: 'HQ'    },
    { email: 'bob.paris@drivncook.local',   role: 'USER',   firstName: 'Bob',    lastName: 'Paris',     franchiseeIndex: 0 },
    { email: 'clara.bercy@drivncook.local', role: 'USER',   firstName: 'Clara',  lastName: 'Bercy',     franchiseeIndex: 0 },
    { email: 'david.vitry@drivncook.local', role: 'USER',   firstName: 'David',  lastName: 'Vitry',     franchiseeIndex: 1 },
    { email: 'eva.nanterre@drivncook.local',role: 'USER',   firstName: 'Eva',    lastName: 'Nanterre',  franchiseeIndex: 2 },
    { email: 'fred.std@drivncook.local',    role: 'USER',   firstName: 'Fred',   lastName: 'StDenis',   franchiseeIndex: 3 },
    { email: 'gina.creteil@drivncook.local',role: 'USER',   firstName: 'Gina',   lastName: 'Creteil',   franchiseeIndex: 4 },
    { email: 'hugo.client@drivncook.local', role: 'USER',   firstName: 'Hugo',   lastName: 'Client' },
    { email: 'ines.client@drivncook.local', role: 'USER',   firstName: 'Inès',   lastName: 'Client' },
    { email: 'yanis.client@drivncook.local',role: 'USER',   firstName: 'Yanis',  lastName: 'Client' },
    { email: 'zoe.client@drivncook.local',  role: 'USER',   firstName: 'Zoé',    lastName: 'Client' },
  ];

  const createdUsers = [];
  const franchiseLinks = [];

  for (const u of rows) {
    const base = {
      email: u.email,
      passwordHash: basePwd,
      role: u.role,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
    };

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: base,
      create: base,
    });
    createdUsers.push(user);

    if (typeof u.franchiseeIndex === 'number' && franchisees[u.franchiseeIndex]) {
      franchiseLinks.push({ userId: user.id, franchiseeId: franchisees[u.franchiseeIndex].id });
    }
  }

  // Attachements via pivot FranchiseUser (si présent)
  for (const link of franchiseLinks) {
    try {
      await prisma.franchiseUser.upsert({
        where: { userId_franchiseeId: { userId: link.userId, franchiseeId: link.franchiseeId } },
        update: { role: 'STAFF' },
        create: { userId: link.userId, franchiseeId: link.franchiseeId, role: 'STAFF' },
      });
    } catch {
      try {
        await prisma.franchiseUser.upsert({
          where: { userId_franchiseeId: { userId: link.userId, franchiseeId: link.franchiseeId } },
          update: {},
          create: { userId: link.userId, franchiseeId: link.franchiseeId },
        });
      } catch {
        // pas de pivot → ignore
      }
    }
  }

  return createdUsers;
}

// -----------------------------------------------------
// Products & Prices (corrigé : suppression de `category`, ajout doux de `type`, `unit`…)
// -----------------------------------------------------
async function seedProductsAndPrices() {
  // Liste minimale + métadonnées optionnelles
  const products = [
    { sku: 'P-BUN',   name: 'Pain burger',      type: 'FOOD',     unit: 'UNIT',     isCoreStock: true  },
    { sku: 'P-PATTY', name: 'Steak haché',      type: 'FOOD',     unit: 'UNIT',     isCoreStock: true  },
    { sku: 'P-TORT',  name: 'Tortilla',         type: 'FOOD',     unit: 'UNIT',     isCoreStock: true  },
    { sku: 'P-FRIES', name: 'Frites 2.5kg',     type: 'FOOD',     unit: 'KILOGRAM', isCoreStock: true  },
    { sku: 'P-LETT',  name: 'Laitue iceberg',   type: 'FOOD',     unit: 'UNIT',     isCoreStock: false },
    { sku: 'P-TOM',   name: 'Tomates 1kg',      type: 'FOOD',     unit: 'KILOGRAM', isCoreStock: false },
    { sku: 'P-COLA',  name: 'Cola 33cl',        type: 'BEVERAGE', unit: 'UNIT',     isCoreStock: true  },
    { sku: 'P-WATER', name: 'Eau minérale 50cl',type: 'BEVERAGE', unit: 'UNIT',     isCoreStock: true  },
  ];

  const created = [];
  for (const p of products) {
    // 1) Création minimale (évite les erreurs si enums/champs diffèrent)
    const base = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, active: true },
      create: { sku: p.sku, name: p.name, active: true },
    });
    created.push(base);

    // 2) Tentative d’enrichissement (facultatif)
    try {
      await prisma.product.update({
        where: { id: base.id },
        data: {
          // Ces champs n’existent pas toujours / enums peuvent différer → try/catch
          type:       p.type,
          unit:       p.unit,
          isCoreStock: p.isCoreStock,
          // maxPerTruck: '100.0'  // active si tu as ce champ et que tu veux une valeur
        },
      });
    } catch {
      // ignore si enum / champs n’existent pas
    }

    // 3) Prix catalogue (si table existe)
    try {
      // Essai 1: composite unique (productId, effectiveDate)
      await prisma.productPrice.upsert({
        where: { productId_effectiveDate: { productId: base.id, effectiveDate: new Date('2025-01-01') } },
        update: { amount: '2.50', currency: 'EUR' },
        create: { productId: base.id, amount: '2.50', currency: 'EUR', effectiveDate: new Date('2025-01-01') },
      });
    } catch {
      try {
        // Essai 2: simple unique sur productId
        await prisma.productPrice.upsert({
          where: { productId: base.id },
          update: { amount: '2.50', currency: 'EUR' },
          create: { productId: base.id, amount: '2.50', currency: 'EUR' },
        });
      } catch {
        // pas de ProductPrice → ignore
      }
    }
  }

  return created;
}

// -----------------------------------------------------
// Warehouse Inventory (si présent)
// -----------------------------------------------------
async function seedWarehouseInventory(warehouses, products) {
  const out = [];
  for (const wh of warehouses) {
    for (const p of products.slice(0, 5)) {
      try {
        const row = await prisma.warehouseInventory.upsert({
          where: { warehouseId_productId: { warehouseId: wh.id, productId: p.id } },
          update: { quantity: 200 },
          create: { warehouseId: wh.id, productId: p.id, quantity: 200 },
        });
        out.push(row);
      } catch {
        // pas de table → ignore
      }
    }
  }
  return out;
}

// -----------------------------------------------------
// Purchase Orders (si présent)
// -----------------------------------------------------
async function seedPurchaseOrders(warehouses, products) {
  if (!warehouses.length || !products.length) return [];

  const poDate = new Date('2025-02-01');
  const rows = [];

  for (const wh of warehouses.slice(0, 2)) {
    try {
      const po = await prisma.purchaseOrder.create({
        data: {
          warehouse: { connect: { id: wh.id } },
          status: 'RECEIVED',             // si enum existe
          orderDate: poDate,
          receivedDate: new Date('2025-02-03'),
          items: {
            create: [
              { productId: products[0].id, quantity: 100, unitPrice: '1.80' },
              { productId: products[1].id, quantity: 80,  unitPrice: '2.10' },
              { productId: products[6].id, quantity: 120, unitPrice: '0.40' },
            ],
          },
        },
        include: { items: true },
      });
      rows.push(po);
    } catch {
      // pas de table / structure différente → ignore
    }
  }
  return rows;
}

// -----------------------------------------------------
// main
// -----------------------------------------------------
async function main() {
  console.log('🌱 Seeding DRIVN-COOK (étendu)…');

  const franchisees = await seedFranchisees();
  console.log(`  → Franchisees: ${franchisees.length}`);

  const agreements = await seedAgreements(franchisees);
  console.log(`  → Agreements: ${agreements.length} (fixés à ${FIXED_ENTRY_FEE} / ${FIXED_REVENUE_PCT})`);

  const trucks = await seedTrucks(franchisees);
  console.log(`  → Trucks: ${trucks.length}`);

  const warehouses = await trySeed('Warehouses (IDF)', seedWarehouses);
  await attachTrucksToWarehouses(trucks, warehouses);

  const users = await seedUsers(franchisees);
  console.log(`  → Users: ${users.length} (>=1 ADMIN, + USERS rattachés via pivot)`);

  const products = await trySeed('Products & Prices', seedProductsAndPrices);
  const inv = await trySeed('Warehouse Inventory', () => seedWarehouseInventory(warehouses, products));
  const pos = await trySeed('Purchase Orders', () => seedPurchaseOrders(warehouses, products));

  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

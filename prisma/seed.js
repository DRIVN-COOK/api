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
    const n = Array.isArray(out) ? out.length : (typeof out === 'number' ? out : 'done');
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
// Warehouses (IDF) – champs alignés à ton schéma
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

// Products & Prices (catalogue) — champs: validFrom, validTo, priceHT, tvaPct
// - crée/maj les produits
// - ajoute 1 prix catalogue par produit (validFrom = 2025-01-01, validTo = null)
// - robuste si aucun unique composite: findFirst + update|create
// -----------------------------------------------------
async function seedProductsAndPrices() {
  // Prix HT réalistes + TVA FR (alimentaire 5.5%, soft 20%)
  const catalog = [
    { sku: 'P-BUN',   name: 'Pain burger',        priceHT: '0.30',  tvaPct: '0.055' },
    { sku: 'P-PATTY', name: 'Steak haché',        priceHT: '1.20',  tvaPct: '0.055' },
    { sku: 'P-TORT',  name: 'Tortilla',           priceHT: '0.40',  tvaPct: '0.055' },
    { sku: 'P-FRIES', name: 'Frites 2.5kg',       priceHT: '3.50',  tvaPct: '0.055' },
    { sku: 'P-LETT',  name: 'Laitue iceberg',     priceHT: '0.80',  tvaPct: '0.055' },
    { sku: 'P-TOM',   name: 'Tomates 1kg',        priceHT: '2.00',  tvaPct: '0.055' },
    { sku: 'P-COLA',  name: 'Cola 33cl',          priceHT: '0.45',  tvaPct: '0.20'  },
    { sku: 'P-WATER', name: 'Eau minérale 50cl',  priceHT: '0.30',  tvaPct: '0.055' },
  ];

  const validFrom = new Date('2025-01-01');
  const created = [];

  for (const p of catalog) {
    // 1) Produit minimal
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, active: true },
      create: { sku: p.sku, name: p.name, active: true },
    });
    created.push(product);

    // 2) Enrichissement optionnel (selon ton schéma)
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          type: (['P-COLA','P-WATER'].includes(p.sku) ? 'BEVERAGE' : 'FOOD'),
          unit: (['P-FRIES','P-TOM'].includes(p.sku) ? 'KILOGRAM' : 'UNIT'),
          isCoreStock: true,
        },
      });
    } catch { /* champs/enums absents → ignore */ }

    // 3) Prix: validFrom/validTo/priceHT/tvaPct
    //    d'abord tentative upsert (si clé unique composite existe), sinon fallback findFirst + update/create
    let done = false;

    // tentative upsert (composite productId+validFrom)
    try {
      await prisma.productPrice.upsert({
        where: { productId_validFrom: { productId: product.id, validFrom } },
        update: { priceHT: p.priceHT, tvaPct: p.tvaPct, validTo: null },
        create: { productId: product.id, priceHT: p.priceHT, tvaPct: p.tvaPct, validFrom, validTo: null },
      });
      done = true;
    } catch { /* pas de contrainte composite → fallback */ }

    if (!done) {
      const existing = await prisma.productPrice.findFirst({
        where: { productId: product.id, validFrom },
        select: { id: true },
      });

      if (existing) {
        await prisma.productPrice.update({
          where: { id: existing.id },
          data: { priceHT: p.priceHT, tvaPct: p.tvaPct, validTo: null },
        });
      } else {
        try {
          await prisma.productPrice.create({
            data: { productId: product.id, priceHT: p.priceHT, tvaPct: p.tvaPct, validFrom, validTo: null },
          });
        } catch {
          // certains schémas n'ont pas validTo → on retente sans
          try {
            await prisma.productPrice.create({
              data: { productId: product.id, priceHT: p.priceHT, tvaPct: p.tvaPct, validFrom },
            });
          } catch {
            // si le modèle est radicalement différent → on skip proprement
          }
        }
      }
    }
  }

  return created;
}

// -----------------------------------------------------
// Remplissage des stocks d'entrepôts (WarehouseInventory) — robuste
// -----------------------------------------------------
async function seedWarehouseInventoryStocks() {
  const warehouses = await prisma.warehouse.findMany({ select: { id: true, name: true } });
  const products   = await prisma.product.findMany({ select: { id: true, sku: true } });

  if (!warehouses.length || !products.length) {
    console.log('  ↳ Pas d’entrepôts ou pas de produits → aucun stock créé.');
    return 0;
  }

  let count = 0;

  // petit helper pour écrire la quantité quel que soit le nom de champ
  const quantityData = (qty) => {
    // on tente plusieurs variantes selon le schéma
    return [
      { quantity: qty },        // cas le plus courant
      { onHand: qty },          // autre naming
      { stock: qty },           // autre naming
    ];
  };

  for (const wh of warehouses) {
    for (const p of products) {
      const qty =
        (p.sku && p.sku.includes('FRIES')) ? 180 :
        (p.sku && p.sku.includes('COLA'))  ? 300 :
        (p.sku && p.sku.includes('WATER')) ? 300 :
        (p.sku && p.sku.includes('TOM'))   ? 120 :
        (p.sku && p.sku.includes('LETT'))  ? 100 :
        150;

      // 1) Cherche une ligne existante
      const existing = await prisma.warehouseInventory.findFirst({
        where: { warehouseId: wh.id, productId: p.id },
        select: { id: true },
      });

      if (existing) {
        // 2) Update avec fallback sur le nom du champ
        let updated = false;
        for (const data of quantityData(qty)) {
          try {
            await prisma.warehouseInventory.update({
              where: { id: existing.id },
              data,
            });
            updated = true;
            break;
          } catch { /* essaie le prochain nom */ }
        }
        if (updated) count++;
        continue;
      }

      // 3) Create si aucune ligne
      let created = false;
      for (const data of quantityData(qty)) {
        try {
          await prisma.warehouseInventory.create({
            data: { warehouseId: wh.id, productId: p.id, ...data },
          });
          created = true;
          break;
        } catch { /* essaie le prochain nom */ }
      }
      if (created) count++;
    }
  }

  return count;
}

// -----------------------------------------------------
// Purchase Orders par franchise — conforme au schéma
// -----------------------------------------------------
async function seedPurchaseOrdersPerFranchise() {
  const franchisees = await prisma.franchisee.findMany({ select: { id: true, name: true } });
  const warehouses  = await prisma.warehouse.findMany({ select: { id: true } });
  const products    = await prisma.product.findMany({ select: { id: true, sku: true, name: true } });

  if (!franchisees.length || !warehouses.length || !products.length) {
    console.log('  ↳ Pas assez de données (franchisees/warehouses/products) → aucun PurchaseOrder créé.');
    return 0;
  }

  // Essaie de récupérer un prix catalogue récent ; sinon fallback
  async function priceFor(productId) {
    try {
      const pp = await prisma.productPrice.findFirst({
        where: { productId },
        orderBy: { effectiveDate: 'desc' },
        select: { priceHT: true },
      });
      if (pp?.priceHT != null) return String(pp.priceHT); // Decimal -> string
    } catch { /* table/colonnes absentes ? */ }
    return '1.00';
  }

  const vatFor = (sku) => {
    const s = (sku || '').toUpperCase();
    // ex: boissons à 20%, ingrédients alimentaires à 5.5% (adapte si besoin)
    if (s.includes('COLA') || s.includes('WATER') || s.includes('SODA') || s.includes('DRINK')) return '20.00';
    return '5.50';
  };

  const pickSomeProducts = () => {
    if (products.length <= 3) return products;
    const idx = new Set();
    while (idx.size < 3) idx.add(Math.floor(Math.random() * products.length));
    return [...idx].map(i => products[i]);
  };

  const qtyFor = (sku) => {
    const s = (sku || '').toUpperCase();
    if (s.includes('FRIES')) return '50';
    if (s.includes('PATTY')) return '80';
    if (s.includes('COLA') || s.includes('WATER')) return '120';
    return '60';
  };

  let created = 0;
  let w = 0;

  for (const fr of franchisees) {
    // 1 ou 2 commandes par franchise
    const howMany = Math.random() < 0.5 ? 1 : 2;

    for (let k = 0; k < howMany; k++) {
      const wh = warehouses[w % warehouses.length]; w++;

      // PO: respecte le schéma (franchiseeId, warehouseId, orderedAt, status en default DRAFT)
      const po = await prisma.purchaseOrder.create({
        data: {
          franchiseeId: fr.id,
          warehouseId:  wh.id,
          orderedAt:    new Date('2025-03-01T00:00:00.000Z'),
          // status: 'RECEIVED', // ← tu peux mettre une valeur valide de POStatus si tu veux autre chose que le default
          lines: {
            create: await Promise.all(
              pickSomeProducts().map(async (p, idx) => ({
                productId:   p.id,
                qty:         qtyFor(p.sku),                // Decimal → string OK
                unitPriceHT: await priceFor(p.id),         // Decimal → string OK
                tvaPct:      vatFor(p.sku),                // Decimal → string OK
                isCoreItem:  idx !== 2, // 2/3 core, 1/3 free (simple 80/20 approchée)
              }))
            ),
          },
        },
        include: { lines: true },
      });

      created++;
      console.log(`    • PO créée pour "${fr.name}" (#${po.id}) avec ${po.lines.length} lignes`);
    }
  }

  return created;
}


// -----------------------------------------------------
// Suppliers + main contact (schéma minimal: contactEmail/contactPhone/address/active)
// - Clé d'idempotence: contactEmail (findFirst → update|create)
// - On prend le 1er contact de la fiche comme "contact principal" stocké sur Supplier
// -----------------------------------------------------
async function seedSuppliers() {
  const suppliers = [
    {
      name: 'METRO France',
      address: '5 Rue des Frères Lumière, 92000 Nanterre',
      main: { name: 'Lucie Martin', role: 'Commerciale IDF', email: 'lucie.martin@metro-contact.example', phone: '+33 1 70 00 10 01' },
    },
    {
      name: 'Transgourmet',
      address: '12 Avenue du Marché, 94150 Rungis',
      main: { name: 'Sophie Durand', role: 'KAM Restauration', email: 'sophie.durand@tg-contact.example', phone: '+33 1 83 64 20 10' },
    },
    {
      name: 'Pomona – PassionFroid',
      address: 'ZAC du Val de Brie, 94000 Créteil',
      main: { name: 'Camille Robert', role: 'Com Froid IDF', email: 'camille.robert@pf-contact.example', phone: '+33 1 84 80 30 01' },
    },
    {
      name: 'Pomona – TerreAzur',
      address: '1 Rue des Maraîchers, 92230 Gennevilliers',
      main: { name: 'Léa Nguyen', role: 'Fruits & Légumes', email: 'lea.nguyen@ta-contact.example', phone: '+33 1 76 35 40 10' },
    },
    {
      name: 'Sysco France',
      address: '2 Rue du Halage, 93200 Saint-Denis',
      main: { name: 'Anaïs Petit', role: 'Commerciale', email: 'anais.petit@sysco-contact.example', phone: '+33 1 85 14 50 01' },
    },
    {
      name: 'France Boissons',
      address: '30 Rue du Chemin Vert, 94400 Vitry-sur-Seine',
      main: { name: 'Nina Perret', role: 'Commerciale Boissons', email: 'nina.perret@fb-contact.example', phone: '+33 1 84 60 90 01' },
    },
    {
      name: 'Bridor',
      address: '4 Rue des Boulangers, 94200 Ivry-sur-Seine',
      main: { name: 'Julie Lopez', role: 'Boulangerie/Viennoiserie', email: 'julie.lopez@bridor-contact.example', phone: '+33 1 87 20 70 01' },
    },
    {
      name: 'Bonduelle Food Service',
      address: '6 Rue des Champs, 93400 Saint-Ouen',
      main: { name: 'Margo Félix', role: 'FoodService', email: 'margo.felix@bonduelle-contact.example', phone: '+33 1 86 47 30 01' },
    },
  ];

  const createdOrUpdated = [];

  for (const s of suppliers) {
    // Idempotence via contactEmail (si pas unique → on fait findFirst + update/create)
    const existing = await prisma.supplier.findFirst({
      where: { contactEmail: s.main.email },
      select: { id: true },
    });

    const dataCommon = {
      // Si ton modèle a un champ "name" il sera ignoré si absent (try/catch)
      address: s.address ?? null,
      contactEmail: s.main.email,
      contactPhone: s.main.phone ?? null,
      active: true,
    };

    let supplier;
    if (existing) {
      // UPDATE
      supplier = await prisma.supplier.update({
        where: { id: existing.id },
        data: dataCommon,
      });
    } else {
      // CREATE (on tente d’inclure name si présent dans le schéma)
      try {
        supplier = await prisma.supplier.create({
          data: { name: s.name, ...dataCommon },
        });
      } catch {
        // fallback sans name si le champ n'existe pas
        supplier = await prisma.supplier.create({
          data: dataCommon,
        });
      }
    }

    createdOrUpdated.push(supplier);
  }

  return createdOrUpdated;
}

// -----------------------------------------------------
// Helpers prix (robustes) réutilisés pour les commandes
// -----------------------------------------------------
async function findUnitPriceString(productId) {
  // essaie plusieurs conventions de colonnes/dates
  // 1) tri par effectiveDate desc
  try {
    const pp = await prisma.productPrice.findFirst({
      where: { productId },
      orderBy: { effectiveDate: 'desc' },
      select: { priceHT: true },
    });
    if (pp?.priceHT != null) return String(pp.priceHT);
  } catch {}

  // 2) tri par validFrom desc
  try {
    const pp = await prisma.productPrice.findFirst({
      where: { productId },
      orderBy: { validFrom: 'desc' },
      select: { priceHT: true },
    });
    if (pp?.priceHT != null) return String(pp.priceHT);
  } catch {}

  // 3) fallback
  return '1.00';
}

const vatForSku = (sku) => {
  const s = (sku || '').toUpperCase();
  if (s.includes('COLA') || s.includes('WATER') || s.includes('SODA') || s.includes('DRINK')) return '20.00';
  return '5.50';
};

const qtyForSku = (sku) => {
  const s = (sku || '').toUpperCase();
  if (s.includes('COLA') || s.includes('WATER')) return '2';
  if (s.includes('FRIES')) return '1';
  if (s.includes('PATTY')) return '2';
  return '1';
};

// -----------------------------------------------------
// Commandes clients (via MenuItem + totaux requis) — JS pur
// -----------------------------------------------------
async function seedCustomerOrders() {
  // Besoins: Customer, Franchisee, MenuItem (et idéalement Truck)
  const customers = await prisma.customer.findMany({
    select: { id: true, userId: true },
  });
  if (!customers.length) {
    console.log('  ↳ [CustomerOrders] Aucun customer (User->Customer manquant).');
    return 0;
  }

  const franchisees = await prisma.franchisee.findMany({ select: { id: true } });
  if (!franchisees.length) {
    console.log('  ↳ [CustomerOrders] Aucun franchisee.');
    return 0;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true, priceHT: true, tvaPct: true },
  });
  if (!menuItems.length) {
    console.log('  ↳ [CustomerOrders] Aucun menuItem actif → lance d’abord seedMenuItemsFromProducts().');
    return 0;
  }

  const trucks = await prisma.truck.findMany({ select: { id: true, franchiseeId: true } });

  // JS pur (pas de <T>)
  function pickSome(arr, min = 2, max = 4) {
    if (!arr.length) return [];
    if (max < min) max = min;
    const count = Math.min(arr.length, Math.floor(Math.random() * (max - min + 1)) + min);
    const idx = new Set();
    while (idx.size < count) idx.add(Math.floor(Math.random() * arr.length));
    return Array.from(idx, (i) => arr[i]);
  }

  function rndQty() {
    return 1 + Math.floor(Math.random() * 3); // 1..3 (Int)
  }

  function totalsFromLines(lines) {
    // line: { qty (Int), unitPriceHT (Decimal string), tvaPct (Decimal string) }
    let ht = 0, tva = 0;
    for (const l of lines) {
      const q = Number(l.qty);
      const pu = Number(l.unitPriceHT);
      const pct = Number(l.tvaPct);
      const lineHT = q * pu;
      const lineTVA = lineHT * (pct / 100);
      ht += lineHT;
      tva += lineTVA;
    }
    const totalHT = ht.toFixed(2);
    const totalTVA = tva.toFixed(2);
    const totalTTC = (ht + tva).toFixed(2);
    return { totalHT, totalTVA, totalTTC };
  }

  let created = 0;

  for (const c of customers) {
    // 1 à 3 commandes par customer
    const howMany = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < howMany; k++) {
      const fr = franchisees[Math.floor(Math.random() * franchisees.length)];
      const truck = trucks.length ? trucks[Math.floor(Math.random() * trucks.length)] : null;

      // lignes: on choisit 2..4 menu items
      const chosen = pickSome(menuItems, 2, 4);
      if (!chosen.length) continue;

      const linesData = chosen.map((mi) => {
        const qty = rndQty();
        const unitPriceHT = String(mi.priceHT); // Decimal -> string (Prisma)
        const tvaPct = String(mi.tvaPct);       // Decimal -> string
        const lineTotalHT = (qty * Number(unitPriceHT)).toFixed(2);
        return {
          menuItemId:  mi.id,
          qty,                  // Int (pas string)
          unitPriceHT,
          tvaPct,
          lineTotalHT,
        };
      });

      const { totalHT, totalTVA, totalTTC } = totalsFromLines(linesData);

      // Création de la commande : placedAt a un default(now())
      const order = await prisma.customerOrder.create({
        data: {
          customerId:  c.id,
          franchiseeId: (truck && truck.franchiseeId) ? truck.franchiseeId : fr.id,
          truckId:     truck ? truck.id : null,
          warehouseId: null,
          channel:     'IN_PERSON',  // default, ok de préciser
          status:      'PENDING',    // default, ok de préciser
          totalHT,
          totalTVA,
          totalTTC,
          lines: {
            create: linesData,
          },
        },
        include: { lines: true },
      });

      created++;
      console.log(`    • CustomerOrder #${order.id} (${order.lines.length} lignes) totalHT=${totalHT} totalTVA=${totalTVA} totalTTC=${totalTTC}`);
    }
  }

  console.log(`  ↳ [CustomerOrders] Créées: ${created}`);
  return created;
}



// -----------------------------------------------------
// MenuItems à partir des Products (+ dernier ProductPrice)
// -----------------------------------------------------
async function seedMenuItemsFromProducts() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, type: true },
  });
  if (!products.length) {
    console.log('  ↳ [MenuItems] Aucun product → skip.');
    return 0;
  }

  const existingCount = await prisma.menuItem.count();
  if (existingCount > 0) {
    console.log(`  ↳ [MenuItems] Déjà présents: ${existingCount} → on complète si manquants.`);
  }

  // récupère le dernier prix (validFrom DESC)
  async function latestPrice(productId) {
    const row = await prisma.productPrice.findFirst({
      where: { productId },
      orderBy: { validFrom: 'desc' },
      select: { priceHT: true, tvaPct: true },
    }).catch(() => null);
    if (row) return { priceHT: String(row.priceHT), tvaPct: String(row.tvaPct) };
    // fallback si pas de price
    return { priceHT: '3.00', tvaPct: '5.50' };
  }

  let created = 0;
  for (const p of products) {
    const { priceHT, tvaPct } = await latestPrice(p.id);

    // upsert par (productId) si unique, sinon par (name + price)
    try {
      await prisma.menuItem.upsert({
        where: { productId: p.id }, // marche si @unique productId
        update: { name: p.name, isActive: true, priceHT, tvaPct },
        create: {
          product: { connect: { id: p.id } },
          name: p.name,
          description: null,
          isActive: true,
          priceHT,
          tvaPct,
          imageUrl: null,
        },
      });
      created++;
    } catch {
      // fallback si productId n'est pas unique dans ton schéma
      const existing = await prisma.menuItem.findFirst({
        where: { name: p.name },
        select: { id: true },
      });
      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { priceHT, tvaPct, isActive: true },
        });
      } else {
        await prisma.menuItem.create({
          data: {
            productId: p.id,
            name: p.name,
            description: null,
            isActive: true,
            priceHT,
            tvaPct,
            imageUrl: null,
          },
        });
        created++;
      }
    }
  }

  console.log(`  ↳ [MenuItems] Créés/Mis à jour: ~${created}`);
  return created;
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

  const products = await trySeed('Products & Prices (catalog)', seedProductsAndPrices);

  await trySeed('Menu items from products', seedMenuItemsFromProducts);
  await trySeed('Customer Orders', seedCustomerOrders);
  // *** Remplissage des stocks d'entrepôts ***
  await trySeed('Warehouse Inventory (seed stocks)', seedWarehouseInventoryStocks);

  await trySeed('Purchase Orders per franchise', seedPurchaseOrdersPerFranchise);

  await trySeed('Suppliers + contacts', seedSuppliers);

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

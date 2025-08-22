// src/routes/initRoutes.ts
import type { Express, Router } from 'express';
import {
  userRoutes,
  customerRoutes,
  franchiseUserRoutes,
  franchiseeRoutes,
  franchiseAgreementRoutes,
  locationRoutes,
  truckRoutes,
  truckDeploymentRoutes,
  truckMaintenanceRoutes,
  warehouseRoutes,
  supplierRoutes,
  productRoutes,
  productPriceRoutes,
  warehouseInventoryRoutes,
  stockMovementRoutes,
  purchaseOrderRoutes,
  purchaseOrderLineRoutes,
  menuItemRoutes,
  customerOrderRoutes,
  customerOrderLineRoutes,
  paymentRoutes,
  invoiceRoutes,
  loyaltyCardRoutes,
  loyaltyTransactionRoutes,
  eventRoutes,
  eventRegistrationRoutes,
  salesSummaryRoutes,
  revenueShareReportRoutes,
  auditLogRoutes,
  authRoutes,
} from './index.js';

type RouteModule =
  | { register: (app: Express) => void }
  | { basePath: string; router: Router }
  | Record<string, unknown>;

function mount(app: Express, name: string, mod: RouteModule) {
  // 1) Forme 'register(app)'
  if (typeof (mod as any).register === 'function') {
    (mod as any).register(app);
    return;
  }

  // 2) Forme '{ basePath, router }'
  if ((mod as any).basePath && (mod as any).router) {
    const { basePath, router } = mod as any as { basePath: string; router: Router };
    app.use(basePath, router);
    return;
  }

  // 3) support d'un export par défaut = Router
  if ((mod as any).default) {
    const router = (mod as any).default as Router;
    const basePath = `/${name}`;
    app.use(basePath, router);
    return;
  }
  console.log(`[routes] skipped:    ${name}`);
}


export function registerAllRoutes(app: Express) {
  // Auth / Users
  mount(app, 'users', userRoutes);
  mount(app, 'auth', authRoutes);

  // Franchises
  mount(app, 'customers', customerRoutes);
  mount(app, 'franchise-users', franchiseUserRoutes);
  mount(app, 'franchisees', franchiseeRoutes);
  mount(app, 'franchise-agreements', franchiseAgreementRoutes);

  // Terrain
  mount(app, 'locations', locationRoutes);
  mount(app, 'trucks', truckRoutes);
  mount(app, 'truck-deployments', truckDeploymentRoutes);
  mount(app, 'truck-maintenances', truckMaintenanceRoutes);

  // Stocks / Référentiels
  mount(app, 'warehouses', warehouseRoutes);
  mount(app, 'suppliers', supplierRoutes);
  mount(app, 'products', productRoutes);
  mount(app, 'product-prices', productPriceRoutes);
  mount(app, 'warehouse-inventories', warehouseInventoryRoutes);
  mount(app, 'stock-movements', stockMovementRoutes);

  // Appro
  mount(app, 'purchase-orders', purchaseOrderRoutes);
  mount(app, 'purchase-order-lines', purchaseOrderLineRoutes);

  // Vente
  mount(app, 'menu-items', menuItemRoutes);
  mount(app, 'customer-orders', customerOrderRoutes);
  mount(app, 'customer-order-lines', customerOrderLineRoutes);
  mount(app, 'payments', paymentRoutes);
  mount(app, 'invoices', invoiceRoutes);

  // Fidélité
  mount(app, 'loyalty-cards', loyaltyCardRoutes);
  mount(app, 'loyalty-transactions', loyaltyTransactionRoutes);

  // Événements
  mount(app, 'events', eventRoutes);
  mount(app, 'event-registrations', eventRegistrationRoutes);

  // Reporting / Audit
  mount(app, 'sales-summaries', salesSummaryRoutes);
  mount(app, 'revenue-share-reports', revenueShareReportRoutes);
  mount(app, 'audit-logs', auditLogRoutes);
}

import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, prisma } from "../setup";
import { getAccessToken, authHeader } from "./auth";

/**
 * Utilitaire générique pour tester un CRUD + extras.
 * - basePath: ex "/api/products"
 * - makeCreate/makeUpdate: payloads; peuvent utiliser prisma pour créer des dépendances
 * - getPath/updatePath/deletePath: override si endpoint custom (ex: /:id/status)
 * - extras: actions supplémentaires à exécuter (submit, capture, pdf...)
 * - publicGet/publicList: true pour routes non protégées
 */
export function crudTestSuite(name: string, cfg: {
  basePath: string;
  makeCreate: () => Promise<Record<string, any>> | Record<string, any>;
  makeUpdate: () => Promise<Record<string, any>> | Record<string, any>;
  extractId?: (body: any) => string;
  listPath?: string;
  getPath?: (id: string) => string;
  updatePath?: (id: string) => string;
  deletePath?: (id: string) => string;
  extras?: Array<(id: string, token: string) => Promise<void>>;
  publicList?: boolean;
  publicGet?: boolean;
}) {
  describe(name, () => {
    it("GET list (200)", async () => {
      const token = await getAccessToken();
      const res = await request(app)
        .get(cfg.listPath ?? cfg.basePath)
        .set(cfg.publicList ? {} : authHeader(token));
      expect(res.status).toBe(200);
      // list peut être {items,...} ou array selon ton implémentation; on check juste que ça répond
      expect(res.body).toBeDefined();
    });

    it("POST create (201)", async () => {
      const token = await getAccessToken();
      const payload = typeof cfg.makeCreate === "function" ? await cfg.makeCreate() : cfg.makeCreate;
      const res = await request(app)
        .post(cfg.basePath)
        .set(authHeader(token))
        .send(payload);
      expect(res.status).toBe(201);
      const id = cfg.extractId ? cfg.extractId(res.body) : res.body.id;
      expect(id).toBeTruthy();
    });

    it("GET by id (200)", async () => {
      const token = await getAccessToken();
      const created = await request(app)
        .post(cfg.basePath)
        .set(authHeader(token))
        .send(await cfg.makeCreate());
      const id = cfg.extractId ? cfg.extractId(created.body) : created.body.id;
      const res = await request(app)
        .get(cfg.getPath ? cfg.getPath(id) : `${cfg.basePath}/${id}`)
        .set(cfg.publicGet ? {} : authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body?.id).toBe(id);
    });

    it("PUT update (200)", async () => {
      const token = await getAccessToken();
      const created = await request(app)
        .post(cfg.basePath)
        .set(authHeader(token))
        .send(await cfg.makeCreate());
      const id = cfg.extractId ? cfg.extractId(created.body) : created.body.id;

      const res = await request(app)
        .put(cfg.updatePath ? cfg.updatePath(id) : `${cfg.basePath}/${id}`)
        .set(authHeader(token))
        .send(await cfg.makeUpdate());
      expect(res.status).toBe(200);
      expect(res.body?.id).toBe(id);
    });

    it("DELETE (204/200)", async () => {
      const token = await getAccessToken();
      const created = await request(app)
        .post(cfg.basePath)
        .set(authHeader(token))
        .send(await cfg.makeCreate());
      const id = cfg.extractId ? cfg.extractId(created.body) : created.body.id;

      const res = await request(app)
        .delete(cfg.deletePath ? cfg.deletePath(id) : `${cfg.basePath}/${id}`)
        .set(authHeader(token));
      expect([200,204]).toContain(res.status);
    });

    if (cfg.extras?.length) {
      it("custom extras", async () => {
        const token = await getAccessToken();
        const created = await request(app)
          .post(cfg.basePath)
          .set(authHeader(token))
          .send(await cfg.makeCreate());
        const id = cfg.extractId ? cfg.extractId(created.body) : created.body.id;
        for (const extra of (cfg.extras ?? [])) {
          await extra(id, token);
        }
      });
    }
  });
}

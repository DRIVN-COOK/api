import request from "supertest"
import express from "express"
import { describe, it, expect } from "vitest"
import testRouter from "../src/routes/test.route"

const app = express();
app.use("/api", testRouter);

describe("GET /api/test", () => {
  it("should return API OK ✅", async () => {
    const res = await request(app).get("/api/test");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("API OK ✅");
  });
});

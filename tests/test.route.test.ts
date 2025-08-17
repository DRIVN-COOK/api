import request from "supertest"
import { describe, it, expect } from "vitest"
import testRouter from "../src/routes/test.route"
import { app } from '../src/server';

app.use("/api", testRouter);

console.log('DB_URL =', process.env.DB_URL);

describe("GET /api/test", () => {
  it("should return API OK", async () => {
    const res = await request(app).get("/api/test");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("API OK");
  });
});

import { beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { app } from "../src/server";
export const prisma = new PrismaClient();
export { app }; 

let logMock: any, infoMock: any;
beforeAll(() => {
  logMock  = vi.spyOn(console, "log").mockImplementation(() => {});
  infoMock = vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(() => {
  logMock?.mockRestore();
  infoMock?.mockRestore();
});

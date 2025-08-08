import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import './db.js';
import { PrismaClient } from '@prisma/client';
dotenv.config({ path: '../infra/.env' });
const prisma = new PrismaClient();


import testRouter from "./routes/test.route.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT_API ?? 3000);

app.use(cors({
  origin: (process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean),
  credentials: true,
}));
app.use(express.json());

app.use("/api", testRouter);

// Route test
app.get("/", (req, res) => {
  res.json({ message: "API DRIVN-COOK running 🚀" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

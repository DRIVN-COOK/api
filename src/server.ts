import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import testRouter from "./routes/test.route.js";

dotenv.config({ path: '../infra/.env' });

export const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT_API ?? 3000);

const envOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / SSR
    if (envOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
}));
app.use(express.json());

app.use("/api", testRouter);
app.use('/auth', authRoutes);

// Route test
app.get("/", (req, res) => {
  res.json({ message: "API DRIVN-COOK running 🚀" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

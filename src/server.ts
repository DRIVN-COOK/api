import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import testRouter from "./routes/test.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", testRouter);

// Route test
app.get("/", (req, res) => {
  res.json({ message: "API DRIVN-COOK running 🚀" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

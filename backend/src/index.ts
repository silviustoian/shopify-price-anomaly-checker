import express from "express";
import cors from "cors";
import { router } from "./routes.js";
import { env } from "./env.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});
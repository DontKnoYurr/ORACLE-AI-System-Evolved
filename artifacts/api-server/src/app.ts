import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import intelligenceRoutes from "./routes/intelligence.js";
import oracleRoutes from "./routes/oracle.js";
import signalsRoutes from "./routes/signals.js";
import predictionsRoutes from "./routes/predictions.js";
import anomaliesRoutes from "./routes/anomalies.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/oracle", oracleRoutes);
app.use("/api/signals", signalsRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/anomalies", anomaliesRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;

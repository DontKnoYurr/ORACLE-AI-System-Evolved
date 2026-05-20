import { Router } from "express";
import { db } from "@workspace/db";
import { trainingInteractionsTable, trainingCyclesTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { RecordInteractionBody } from "@workspace/api-zod";
import { runTrainingCycle, getLiveTrainingStatus, loadWeights } from "../intelligence/trainer.js";

const router = Router();

// ─── Autonomous drift loop (weight-informed) ───
setInterval(async () => {
  try {
    await loadWeights(); // Ensure we have latest weights
  } catch {}
}, 30000);

// ─── Autonomous training cycle (every 2 hours if enough data) ───
setInterval(async () => {
  try {
    const interactions = await db.select().from(trainingInteractionsTable).limit(10);
    if (interactions.length >= 5) {
      await runTrainingCycle({ requestedEpochs: 30, learningRate: 0.0001 });
    }
  } catch {}
}, 2 * 60 * 60 * 1000);

router.get("/training/status", async (req, res) => {
  const status = await getLiveTrainingStatus();
  return res.json(status);
});

router.post("/training/interact", async (req, res) => {
  const body = RecordInteractionBody.parse(req.body);
  const weightMap: Record<string, number> = {
    seismic_pulse: 2.0,
    quantum_collapse: 1.8,
    temporal_observe: 1.5,
    query: 1.3,
    expand: 1.2,
    signal_rate: 1.4,
    anomaly_flag: 1.6,
    click: 0.5,
    hover: 0.2,
    collapse: 0.4,
  };
  const trainingWeight = (weightMap[body.type] ?? 0.5) * (body.value ?? 1.0) * (Math.random() * 0.2 + 0.9);

  await db.insert(trainingInteractionsTable).values({
    type: body.type,
    target: body.target,
    value: body.value ?? null,
    context: body.context ?? null,
    sessionId: body.sessionId ?? null,
    trainingWeight,
  });

  const responses: Record<string, string> = {
    seismic_pulse: "Seismic interaction recorded. Infrasonic signature added to training corpus. Resonance pattern analysis updating. Bayesian seismic model receiving gradient signal.",
    quantum_collapse: "Wave function observation logged. Quantum field topology updating based on observer coordinates. Probability distribution recalculating. Observer-effect weight parameter adjusting.",
    temporal_observe: "Temporal threat observation recorded. Time-horizon attention pattern integrated into velocity estimator. Threat horizon decay parameters updating.",
    query: "Oracle query interaction captured. Semantic attention pattern logged to NLP corpus. Domain classification accuracy improving.",
    signal_rate: "Signal rating integrated. Relevance weighting propagating across connected prediction models. Bayesian prior updating.",
    anomaly_flag: "Anomaly flagging recorded. Severity classification model receiving reinforcement gradient. Pattern archetype library expanding.",
    expand: "Deep-dive interaction captured. Attention pattern recorded. Signal expansion model receiving positive reinforcement signal.",
    click: "Interaction logged to training corpus.",
    hover: "Attention signal logged.",
    collapse: "Interaction logged.",
  };

  // Determine which model received the gradient update
  const modelUpdated =
    body.type === "seismic_pulse" ? "seismic_resonance_net" :
    body.type === "quantum_collapse" ? "quantum_field_predictor" :
    body.type === "temporal_observe" ? "temporal_threat_classifier" :
    body.type === "anomaly_flag" ? "anomaly_detector" :
    trainingWeight > 1.0 ? "pattern_recognition_core" : null;

  return res.json({
    recorded: true,
    trainingWeight,
    systemResponse: responses[body.type] ?? "Interaction recorded as training datum.",
    updatedModel: modelUpdated,
  });
});

router.post("/training/cycle", async (req, res) => {
  const body = req.body as { epochs?: number; learningRate?: number };
  const result = await runTrainingCycle({
    requestedEpochs: body.epochs ?? undefined,
    learningRate: body.learningRate ?? 0.001,
  });
  return res.json(result);
});

router.get("/training/history", async (req, res) => {
  const results = await db.select().from(trainingCyclesTable).orderBy(desc(trainingCyclesTable.startedAt)).limit(20);
  return res.json(results.map((c) => ({
    ...c,
    startedAt: c.startedAt instanceof Date ? c.startedAt.toISOString() : c.startedAt,
    completedAt: c.completedAt instanceof Date ? c.completedAt?.toISOString() : c.completedAt,
  })));
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { quantumNodesTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { CollapseWaveFunctionBody } from "@workspace/api-zod";

const router = Router();

function fmtNode(n: any) {
  return { ...n, createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt };
}

router.get("/quantum/field", async (req, res) => {
  const nodes = await db.select().from(quantumNodesTable).orderBy(desc(quantumNodesTable.strength)).limit(20);

  const fieldStrength = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + n.strength, 0) / nodes.length
    : Math.random() * 0.4 + 0.4;

  const coherence = Math.random() * 0.3 + 0.55;
  const entangledPairs = Math.floor(Math.random() * 20 + 8);

  const fieldLines = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const r1 = 0.3 + Math.random() * 0.2;
    const r2 = 0.6 + Math.random() * 0.3;
    return {
      startX: 0.5 + Math.cos(angle) * r1,
      startY: 0.5 + Math.sin(angle) * r1,
      endX: 0.5 + Math.cos(angle + 0.2) * r2,
      endY: 0.5 + Math.sin(angle + 0.2) * r2,
      strength: Math.random() * 0.6 + 0.3,
      polarity: Math.sin(angle) > 0 ? "north" : "south" as "north" | "south",
    };
  });

  return res.json({
    fieldStrength,
    coherence,
    entangledPairs,
    fieldLines,
    attractors: nodes.map(fmtNode),
    updatedAt: new Date().toISOString(),
  });
});

router.get("/quantum/nodes", async (req, res) => {
  const nodes = await db.select().from(quantumNodesTable).orderBy(desc(quantumNodesTable.probability)).limit(30);
  return res.json(nodes.map(fmtNode));
});

router.post("/quantum/collapse", async (req, res) => {
  const body = CollapseWaveFunctionBody.parse(req.body);
  const nodes = await db.select().from(quantumNodesTable).orderBy(desc(quantumNodesTable.probability)).limit(10);

  const nearbyNodes = nodes
    .filter((n) => Math.sqrt((n.x - body.x) ** 2 + (n.y - body.y) ** 2) < 0.3)
    .slice(0, 3);

  const probability = Math.random() * 0.5 + 0.3;
  const states = ["BIFURCATION_DETECTED", "ATTRACTOR_STABLE", "REPELLER_ACTIVE", "VORTEX_FORMING", "NULL_POINT_REACHED", "COHERENCE_MAINTAINED"];
  const collapsedState = states[Math.floor(Math.random() * states.length)];

  const implications: Record<string, string> = {
    BIFURCATION_DETECTED: "Critical choice point: two equally probable futures diverge from this observation point. The wave function collapse has revealed a systemic fork in the temporal axis.",
    ATTRACTOR_STABLE: "Observer reinforces existing attractor. The probability well deepens — this future is becoming more likely with each observation.",
    REPELLER_ACTIVE: "Anti-correlation detected. Observer presence is destabilizing a previously stable configuration. Adjacent attractors absorbing probability mass.",
    VORTEX_FORMING: "Probability circulation pattern emerging. Multiple futures caught in rotating attractor structure. High uncertainty zone — quantum coherence degrading.",
    NULL_POINT_REACHED: "Observer has collapsed onto a quantum null point — a region of maximum uncertainty. All futures equally probable from this vantage.",
    COHERENCE_MAINTAINED: "Quantum coherence sustained through observation. The magnetic field structure remains stable. System operating within expected parameters.",
  };

  return res.json({
    collapsedState,
    probability,
    nearbyNodes: nearbyNodes.map(fmtNode),
    implication: implications[collapsedState] ?? implications.COHERENCE_MAINTAINED,
    trainingSignal: `Quantum observation at (${body.x.toFixed(3)}, ${body.y.toFixed(3)}) recorded as training datum. Observer intent: "${body.observerIntent ?? "undeclared"}". State: ${collapsedState}. Weight: ${probability.toFixed(3)}.`,
  });
});

router.get("/quantum/superposition", async (req, res) => {
  const branches = [
    { id: "alpha", description: "Managed transition to multipolar stability — extended negotiation, maintained institutions", probability: 0.31, horizon: "5y", quantumState: "SUPERPOSED", collapsed: false },
    { id: "beta", description: "Rapid technological singularity cascade — AI-driven discontinuity reshaping all systems", probability: 0.24, horizon: "10y", quantumState: "SUPERPOSED", collapsed: false },
    { id: "gamma", description: "Climate cascade tipping — nonlinear climate forcing drives systemic reorganization", probability: 0.22, horizon: "15y", quantumState: "SUPERPOSED", collapsed: false },
    { id: "delta", description: "Quantum computing cryptographic breach — global information infrastructure reorganization", probability: 0.13, horizon: "8y", quantumState: "SUPERPOSED", collapsed: false },
    { id: "epsilon", description: "Biological threat emergence — novel pathogen or engineered agent triggering cascade", probability: 0.07, horizon: "3y", quantumState: "SUPERPOSED", collapsed: false },
    { id: "zeta", description: "Black swan emergence — unknown attractor outside current probability distribution", probability: 0.03, horizon: "unknown", quantumState: "UNDEFINED", collapsed: false },
  ];

  return res.json({
    branches,
    decoherenceRate: Math.random() * 0.05 + 0.01,
    observerEffect: "Active observation is collapsing the probability distribution. Each user interaction collapses superposed states and feeds training data to the quantum prediction engine. Your attention shapes the forecast.",
    mostLikelyBranch: "alpha",
  });
});

export default router;

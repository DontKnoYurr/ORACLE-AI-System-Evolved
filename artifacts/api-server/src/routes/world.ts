import { Router } from "express";

const router = Router();

let worldState = {
  globalInstability: 67,
  geopoliticalTension: 74,
  economicVolatility: 58,
  informationWarfare: 82,
  climateStress: 61,
  techDisruption: 79,
  trends: {
    geopoliticalTension: "rising",
    economicVolatility: "volatile",
    informationWarfare: "rising",
    climateStress: "rising",
    techDisruption: "rising",
  },
  regions: [
    { name: "Eastern Europe", instability: 88, primaryThreat: "Military escalation" },
    { name: "East Asia", instability: 72, primaryThreat: "Trade & territorial disputes" },
    { name: "Middle East", instability: 76, primaryThreat: "Proxy conflict intensification" },
    { name: "Sub-Saharan Africa", instability: 63, primaryThreat: "Climate-driven instability" },
    { name: "North America", instability: 54, primaryThreat: "Political polarization" },
    { name: "Western Europe", instability: 49, primaryThreat: "Economic stagnation" },
  ],
  updatedAt: new Date().toISOString(),
};

function drift() {
  const driftFactor = () => (Math.random() - 0.48) * 3;
  worldState = {
    ...worldState,
    globalInstability: Math.min(100, Math.max(0, worldState.globalInstability + driftFactor())),
    geopoliticalTension: Math.min(100, Math.max(0, worldState.geopoliticalTension + driftFactor())),
    economicVolatility: Math.min(100, Math.max(0, worldState.economicVolatility + driftFactor())),
    informationWarfare: Math.min(100, Math.max(0, worldState.informationWarfare + driftFactor())),
    climateStress: Math.min(100, Math.max(0, worldState.climateStress + driftFactor())),
    techDisruption: Math.min(100, Math.max(0, worldState.techDisruption + driftFactor())),
    updatedAt: new Date().toISOString(),
  };
}

setInterval(drift, 30000);

router.get("/world/state", (req, res) => res.json(worldState));

router.post("/world/explain", (req, res) => {
  return res.json({
    globalInstabilityExplanation: `Global instability index at ${worldState.globalInstability.toFixed(1)}% — approaching elevated operational threshold. The seismic intelligence layer detects sustained infrasonic resonance across ${Math.floor(Math.random() * 8 + 4)} major geographic nodes, consistent with systemic pre-crisis signatures. Quantum field measurements show magnetic flux anomalies correlating with historical transition events. The multi-agent council assigns this reading a ${worldState.globalInstability > 70 ? "HIGH" : worldState.globalInstability > 50 ? "MEDIUM" : "LOW"} alert status.`,
    metricExplanations: {
      geopoliticalTension: `GEO_TENSION at ${worldState.geopoliticalTension.toFixed(0)}% — driven by multi-polar realignment stress vectors and sub-threshold conflict escalation patterns across ${Math.floor(Math.random() * 4 + 3)} active theaters.`,
      economicVolatility: `ECON_VOLATILITY at ${worldState.economicVolatility.toFixed(0)}% — cross-border capital flow turbulence detected. Supply chain seismic stress indicators elevated. Currency corridor pressure building.`,
      informationWarfare: `INFO_WARFARE at ${worldState.informationWarfare.toFixed(0)}% — coordinated narrative operations across ${Math.floor(Math.random() * 12 + 8)} information domains. Quantum-encrypted disinformation vectors active.`,
      climateStress: `CLIMATE_STRESS at ${worldState.climateStress.toFixed(0)}% — tipping point proximity assessment ongoing. Seismic resonance patterns in affected regions consistent with large-scale ecological stress signature.`,
      techDisruption: `TECH_DISRUPTION at ${worldState.techDisruption.toFixed(0)}% — AI capability acceleration compressing strategic timelines. Quantum computing threshold approach accelerating cryptographic vulnerability window.`,
    },
    recentDrivers: [
      "Infrasonic resonance surge in Eastern European theater — ground-truth stress indicator",
      "Quantum field coherence drop in financial system attractor nodes",
      "Coordinated information operations activating across social media substrate",
      "Climate tipping point cascade model entering nonlinear regime",
    ].slice(0, Math.floor(Math.random() * 2) + 2),
    outlook: `Oracle temporal axis projection: ${worldState.globalInstability > 70 ? "Elevated instability expected to persist for 60-90 days before bifurcation event. Recommend immediate protocol escalation." : worldState.globalInstability > 50 ? "Moderate instability with 40% probability of escalation within 30-day window. Continue enhanced monitoring." : "Relative stability window. Utilize for system recalibration and training cycle optimization."}`,
  });
});

router.get("/world/dashboard", async (req, res) => {
  return res.json({
    activeSignals: Math.floor(Math.random() * 30 + 40),
    criticalAnomalies: Math.floor(Math.random() * 5 + 1),
    activePredictions: Math.floor(Math.random() * 20 + 15),
    globalInstability: worldState.globalInstability,
    recentActivity: [
      "New seismic resonance event detected — Eastern Europe",
      "Quantum field attractor node coalescence in economic domain",
      "Agent Council session completed — topic: AI capability threshold",
      "Temporal scan identified 3 new immediate-horizon threats",
      "Training cycle completed — accuracy +2.3%",
    ].slice(0, Math.floor(Math.random() * 3) + 3),
    immediateThreats: Math.floor(Math.random() * 4 + 1),
    trainingProgress: Math.random() * 0.3 + 0.65,
  });
});

export default router;

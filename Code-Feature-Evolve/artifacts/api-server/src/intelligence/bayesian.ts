/**
 * ORACLE Proprietary Bayesian Inference Engine
 * Real mathematical posterior probability computation.
 * No external AI — pure statistical reasoning.
 */

export interface Prior {
  probability: number;
  confidence: number;
  domain: string;
  horizon: string;
}

export interface Evidence {
  type: "seismic" | "quantum" | "temporal" | "signal" | "anomaly" | "historical";
  strength: number;      // 0-1: how strongly this evidence bears on the prior
  likelihood: number;    // P(evidence | hypothesis true)
  baserate: number;      // P(evidence | hypothesis false)
}

/**
 * Bayes' theorem: P(H|E) = P(E|H) * P(H) / P(E)
 * Updated iteratively for each piece of evidence.
 */
export function updatePosterior(prior: number, evidence: Evidence[]): number {
  let posterior = Math.max(0.001, Math.min(0.999, prior));
  for (const e of evidence) {
    const pEgivenH = e.likelihood * e.strength + (1 - e.strength) * 0.5;
    const pEgivenNotH = e.baserate * e.strength + (1 - e.strength) * 0.5;
    const pE = pEgivenH * posterior + pEgivenNotH * (1 - posterior);
    if (pE > 0) {
      posterior = (pEgivenH * posterior) / pE;
      posterior = Math.max(0.001, Math.min(0.999, posterior));
    }
  }
  return posterior;
}

/**
 * Compute confidence interval around a probability estimate.
 */
export function confidenceInterval(p: number, n: number): [number, number] {
  // Wilson score interval
  const z = 1.96; // 95% CI
  const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

/**
 * Compute entropy (uncertainty measure) of a probability distribution.
 */
export function entropy(probabilities: number[]): number {
  return -probabilities
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
}

/**
 * Bayesian model averaging across multiple prediction models.
 */
export function modelAverage(predictions: Array<{ value: number; weight: number }>): number {
  const totalWeight = predictions.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return 0.5;
  return predictions.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
}

/**
 * Threat velocity: rate of probability change over time.
 * Returns d(probability)/d(time) normalized.
 */
export function computeVelocity(currentProb: number, historicalProb: number, timeDeltaHours: number): number {
  if (timeDeltaHours <= 0) return 0;
  return (currentProb - historicalProb) / timeDeltaHours;
}

/**
 * Kalman filter step for smoother probability tracking.
 */
export function kalmanUpdate(
  estimate: number,
  estimateUncertainty: number,
  measurement: number,
  measurementNoise: number
): { estimate: number; uncertainty: number } {
  const kalmanGain = estimateUncertainty / (estimateUncertainty + measurementNoise);
  const newEstimate = estimate + kalmanGain * (measurement - estimate);
  const newUncertainty = (1 - kalmanGain) * estimateUncertainty;
  return {
    estimate: Math.max(0, Math.min(1, newEstimate)),
    uncertainty: Math.max(0.001, newUncertainty),
  };
}

/**
 * Cascade probability: P(cascade | primary event occurs)
 * Uses domain-to-domain coupling matrix.
 */
const DOMAIN_COUPLING: Record<string, Record<string, number>> = {
  geopolitical: { economic: 0.72, cyber: 0.58, information: 0.81, military: 0.69 },
  economic:     { geopolitical: 0.61, social: 0.74, financial: 0.88, supply_chain: 0.77 },
  cyber:        { economic: 0.64, infrastructure: 0.83, military: 0.47, information: 0.71 },
  climate:      { economic: 0.69, social: 0.77, biological: 0.52, geopolitical: 0.48 },
  biological:   { economic: 0.71, social: 0.85, geopolitical: 0.43, information: 0.62 },
  information:  { geopolitical: 0.74, social: 0.83, economic: 0.51, cyber: 0.66 },
};

export function cascadeProbability(primaryDomain: string, primaryProb: number): Array<{ domain: string; probability: number }> {
  const couplings = DOMAIN_COUPLING[primaryDomain] ?? {};
  return Object.entries(couplings).map(([domain, coupling]) => ({
    domain,
    probability: primaryProb * coupling * (0.85 + Math.random() * 0.15),
  }));
}

/**
 * Multi-horizon probability projection using exponential decay model.
 */
export function projectAcrossHorizons(
  baseProb: number,
  velocity: number,
  horizons: number[] // in seconds
): Array<{ horizonSeconds: number; probability: number }> {
  return horizons.map(h => {
    const hours = h / 3600;
    const decay = Math.exp(-0.003 * hours); // decay factor
    const drift = velocity * hours * 0.1;
    return {
      horizonSeconds: h,
      probability: Math.max(0.01, Math.min(0.99, baseProb * decay + drift)),
    };
  });
}

/**
 * Compute global instability index from domain metrics.
 */
export function computeInstabilityIndex(metrics: Record<string, number>): number {
  const weights: Record<string, number> = {
    geopoliticalTension: 0.28,
    economicVolatility: 0.22,
    informationWarfare: 0.18,
    climateStress: 0.14,
    techDisruption: 0.12,
    cyberThreat: 0.06,
  };
  let index = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (metrics[key] !== undefined) {
      index += metrics[key] * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? index / totalWeight : 0;
}

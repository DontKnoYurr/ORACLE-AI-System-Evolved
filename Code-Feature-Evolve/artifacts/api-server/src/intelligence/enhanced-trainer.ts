/**
 * ORACLE Enhanced Training System
 * 
 * Extends the base trainer with meta-learning, advanced optimization,
 * RLHF integration, and comprehensive training analytics.
 */

import { db } from "@workspace/db";
import { trainingInteractionsTable, trainingCyclesTable } from "@workspace/db/schema";
import { desc, gte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  initializeAdamState,
  adamStep,
  rmspropStep,
  computeAdaptiveLearningRate,
  computeGradientNorms,
  clipGradients,
  detectGradientAnomalies,
  exponentialMovingAverage,
  OptimizerState,
  AdaptiveSchedule,
} from "./optimizers.js";
import { ModelWeights, DEFAULT_WEIGHTS } from "./trainer.js";

export interface EnhancedTrainingConfig {
  optimizer: 'adam' | 'rmsprop' | 'sgd';
  learningRateSchedule: AdaptiveSchedule;
  epochs: number;
  batchSize: number;
  gradientClipping: boolean;
  clipValue: number;
  enableMetaLearning: boolean;
  rlhfWeight: number;
  validationSplit: number;
}

export interface TrainingMetrics {
  epoch: number;
  trainingLoss: number;
  validationLoss: number;
  learningRate: number;
  gradientNorm: number;
  maxGradient: number;
  modelUpdates: Record<string, number>;
  anomalies: string[];
  timestamp: Date;
}

export interface TrainingSession {
  sessionId: string;
  config: EnhancedTrainingConfig;
  startedAt: Date;
  metrics: TrainingMetrics[];
  optimizerState: OptimizerState;
  bestLoss: number;
  bestEpoch: number;
  earlyStoppingPatience: number;
  patienceCounter: number;
}

// In-memory training sessions for active training
const activeSessions: Map<string, TrainingSession> = new Map();

/**
 * Create a new enhanced training session with specified configuration.
 */
export async function createTrainingSession(
  config: Partial<EnhancedTrainingConfig> = {}
): Promise<TrainingSession> {
  const fullConfig: EnhancedTrainingConfig = {
    optimizer: config.optimizer ?? 'adam',
    learningRateSchedule: config.learningRateSchedule ?? {
      baseRate: 0.001,
      strategy: 'warmup_cosine',
      scheduleParams: { warmupEpochs: 5 },
    },
    epochs: config.epochs ?? 50,
    batchSize: config.batchSize ?? 32,
    gradientClipping: config.gradientClipping ?? true,
    clipValue: config.clipValue ?? 1.0,
    enableMetaLearning: config.enableMetaLearning ?? true,
    rlhfWeight: config.rlhfWeight ?? 0.1,
    validationSplit: config.validationSplit ?? 0.2,
  };

  const sessionId = randomUUID();
  const paramNames = Object.keys(DEFAULT_WEIGHTS);
  
  const session: TrainingSession = {
    sessionId,
    config: fullConfig,
    startedAt: new Date(),
    metrics: [],
    optimizerState: initializeAdamState(paramNames),
    bestLoss: Infinity,
    bestEpoch: 0,
    earlyStoppingPatience: 10,
    patienceCounter: 0,
  };

  activeSessions.set(sessionId, session);
  return session;
}

/**
 * Get active training session by ID.
 */
export function getTrainingSession(sessionId: string): TrainingSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Compute loss with optional RLHF weighting.
 */
export async function computeEnhancedLoss(
  weights: ModelWeights,
  rlhfWeight: number = 0.1
): Promise<{ baseLoss: number; rlhfLoss: number; totalLoss: number }> {
  const interactions = await db.select()
    .from(trainingInteractionsTable)
    .orderBy(desc(trainingInteractionsTable.createdAt))
    .limit(500);

  if (interactions.length === 0) {
    return {
      baseLoss: 1 - weights.system_accuracy,
      rlhfLoss: 0,
      totalLoss: 1 - weights.system_accuracy,
    };
  }

  // Compute base loss (MSE between predicted and actual engagement)
  let baseLoss = 0;
  let rlhfSignal = 0;
  let rlhfCount = 0;

  for (const interaction of interactions) {
    const weight = interaction.trainingWeight ?? 1.0;
    const expected = weight > 1.5 ? 1.0 : weight > 1.0 ? 0.7 : 0.4;
    const predicted = weights.system_accuracy;
    baseLoss += Math.pow(expected - predicted, 2) * (weight / 2);

    // RLHF signal: high-weight interactions indicate human approval
    if (weight > 1.5) {
      rlhfSignal += weight;
      rlhfCount++;
    }
  }

  baseLoss = Math.sqrt(baseLoss / interactions.length);
  
  // RLHF loss: penalize if not enough high-quality interactions
  const rlhfLoss = rlhfCount > 0 ? Math.max(0, 1 - (rlhfSignal / (rlhfCount * 2))) : 0.5;
  const totalLoss = baseLoss * (1 - rlhfWeight) + rlhfLoss * rlhfWeight;

  return { baseLoss, rlhfLoss, totalLoss };
}

/**
 * Compute gradients for all model weights based on interaction patterns.
 */
export async function computeGradients(
  weights: ModelWeights,
  interactions: any[]
): Promise<Record<string, number>> {
  const gradients: Record<string, number> = {};
  
  // Initialize all gradients to zero
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    gradients[key] = 0;
  }

  if (interactions.length === 0) return gradients;

  // Analyze interaction patterns to compute gradients
  const typeCounts: Record<string, number> = {};
  const weightSums: Record<string, number> = {};

  for (const i of interactions) {
    typeCounts[i.type] = (typeCounts[i.type] ?? 0) + 1;
    weightSums[i.type] = (weightSums[i.type] ?? 0) + (i.trainingWeight ?? 1);
  }

  // Gradient for seismic_valence_sensitivity
  if (typeCounts.seismic_pulse > 0) {
    const pulseWeight = weightSums.seismic_pulse / typeCounts.seismic_pulse;
    gradients.seismic_valence_sensitivity = (pulseWeight - 1.5) * 0.1;
    gradients.seismic_amplitude_threshold = -(pulseWeight - 1.5) * 0.05;
  }

  // Gradient for quantum_observer_effect_weight
  if (typeCounts.quantum_collapse > 0) {
    const avgQWeight = weightSums.quantum_collapse / typeCounts.quantum_collapse;
    gradients.quantum_observer_effect_weight = (avgQWeight - 1.5) * 0.08;
  }

  // Gradient for temporal_velocity_multiplier
  if (typeCounts.temporal_observe > 0) {
    gradients.temporal_velocity_multiplier = 0.02;
  }

  // Gradient for system_accuracy
  const totalWeight = Object.values(weightSums).reduce((a, b) => a + b, 0);
  const meanWeight = totalWeight / Math.max(1, interactions.length);
  gradients.system_accuracy = (meanWeight - 1.0) * 0.05;

  // Gradient for Bayesian priors
  const domainInteractions: Record<string, number> = {};
  for (const i of interactions) {
    const domain = i.target?.includes("seismic") ? "seismic" : 
                   i.target?.includes("quantum") ? "quantum" : 
                   i.target?.includes("temporal") ? "temporal" : "general";
    domainInteractions[domain] = (domainInteractions[domain] ?? 0) + (i.trainingWeight ?? 1);
  }

  const totalDomainWeight = Object.values(domainInteractions).reduce((a, b) => a + b, 1);
  if (domainInteractions.seismic) {
    gradients.bayesian_prior_geopolitical = (domainInteractions.seismic / totalDomainWeight - 0.5) * 0.2;
  }

  return gradients;
}

/**
 * Run an enhanced training epoch with advanced optimization.
 */
export async function runEnhancedTrainingEpoch(
  session: TrainingSession,
  weights: ModelWeights,
  epoch: number
): Promise<{ updatedWeights: ModelWeights; metrics: TrainingMetrics }> {
  const config = session.config;
  
  // Fetch training data
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const allInteractions = await db.select()
    .from(trainingInteractionsTable)
    .where(gte(trainingInteractionsTable.createdAt, cutoff))
    .limit(1000);

  // Split into training and validation sets
  const splitIdx = Math.floor(allInteractions.length * (1 - config.validationSplit));
  const trainingData = allInteractions.slice(0, splitIdx);
  const validationData = allInteractions.slice(splitIdx);

  // Compute loss on validation set (before update)
  const validationLoss = await computeEnhancedLoss(weights, config.rlhfWeight);

  // Sample mini-batch from training data
  const batchSize = Math.min(config.batchSize, trainingData.length);
  const batch = trainingData.sort(() => Math.random() - 0.5).slice(0, batchSize);

  // Compute gradients
  let gradients = await computeGradients(weights, batch);

  // Detect gradient anomalies
  const anomalyCheck = detectGradientAnomalies(gradients);

  // Clip gradients if enabled
  if (config.gradientClipping) {
    gradients = clipGradients(gradients, config.clipValue);
  }

  // Compute adaptive learning rate
  const learningRate = computeAdaptiveLearningRate(
    epoch,
    config.epochs,
    config.learningRateSchedule
  );

  // Update weights using selected optimizer
  let updatedWeights: Record<string, number>;
  
  if (config.optimizer === 'adam') {
    updatedWeights = adamStep(weights as any, gradients, session.optimizerState, learningRate);
  } else if (config.optimizer === 'rmsprop') {
    updatedWeights = rmspropStep(weights as any, gradients, session.optimizerState, learningRate);
  } else {
    // Simple SGD
    updatedWeights = { ...weights };
    for (const [param, grad] of Object.entries(gradients)) {
      updatedWeights[param as keyof ModelWeights] = 
        (weights[param as keyof ModelWeights] ?? 0) - learningRate * grad;
    }
  }

  // Clamp weights to valid ranges
  const clampedWeights = clampWeights(updatedWeights as any);

  // Compute training loss on updated weights
  const trainingLoss = await computeEnhancedLoss(clampedWeights, config.rlhfWeight);

  // Compute gradient norms for monitoring
  const gradientNorms = computeGradientNorms(gradients);

  // Create metrics record
  const metrics: TrainingMetrics = {
    epoch,
    trainingLoss: trainingLoss.totalLoss,
    validationLoss: validationLoss.totalLoss,
    learningRate,
    gradientNorm: gradientNorms.l2Norm,
    maxGradient: gradientNorms.maxNorm,
    modelUpdates: gradients,
    anomalies: anomalyCheck.anomalyDetails,
    timestamp: new Date(),
  };

  // Track best loss for early stopping
  if (trainingLoss.totalLoss < session.bestLoss) {
    session.bestLoss = trainingLoss.totalLoss;
    session.bestEpoch = epoch;
    session.patienceCounter = 0;
  } else {
    session.patienceCounter++;
  }

  session.metrics.push(metrics);

  return { updatedWeights: clampedWeights, metrics };
}

/**
 * Clamp weights to valid ranges.
 */
function clampWeights(weights: Record<string, number>): Record<string, number> {
  const clamped = { ...weights };
  
  const ranges: Record<string, [number, number]> = {
    seismic_freq_weight_danger: [0.5, 0.99],
    seismic_freq_weight_mourning: [0.5, 0.99],
    seismic_freq_weight_communication: [0.5, 0.99],
    seismic_valence_sensitivity: [0.3, 0.99],
    seismic_amplitude_threshold: [0.1, 0.9],
    bayesian_prior_geopolitical: [0.1, 0.9],
    bayesian_prior_economic: [0.1, 0.9],
    bayesian_prior_cyber: [0.1, 0.9],
    bayesian_prior_climate: [0.1, 0.9],
    bayesian_prior_biological: [0.1, 0.9],
    bayesian_signal_weight: [0.5, 0.99],
    bayesian_anomaly_weight: [0.5, 0.99],
    temporal_velocity_multiplier: [0.8, 2.0],
    temporal_horizon_decay_rate: [0.0001, 0.01],
    temporal_cascade_coupling: [0.3, 0.95],
    quantum_coherence_threshold: [0.3, 0.85],
    quantum_observer_effect_weight: [0.2, 0.95],
    quantum_decoherence_rate: [0.001, 0.1],
    system_accuracy: [0.6, 0.999],
    system_calibration: [0.6, 0.999],
    prediction_confidence_floor: [0.1, 0.4],
  };

  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (key in clamped) {
      clamped[key] = Math.max(min, Math.min(max, clamped[key]));
    }
  }

  return clamped;
}

/**
 * Check if early stopping criteria are met.
 */
export function shouldEarlyStop(session: TrainingSession): boolean {
  return session.patienceCounter >= session.earlyStoppingPatience;
}

/**
 * Get training session metrics summary.
 */
export function getSessionMetricsSummary(session: TrainingSession) {
  if (session.metrics.length === 0) {
    return null;
  }

  const metrics = session.metrics;
  const lastMetric = metrics[metrics.length - 1];
  const firstMetric = metrics[0];

  return {
    sessionId: session.sessionId,
    totalEpochs: metrics.length,
    startedAt: session.startedAt,
    lastUpdated: lastMetric.timestamp,
    initialLoss: firstMetric.trainingLoss,
    finalLoss: lastMetric.trainingLoss,
    lossImprovement: firstMetric.trainingLoss - lastMetric.trainingLoss,
    bestLoss: session.bestLoss,
    bestEpoch: session.bestEpoch,
    averageGradientNorm: metrics.reduce((sum, m) => sum + m.gradientNorm, 0) / metrics.length,
    maxGradientNorm: Math.max(...metrics.map(m => m.gradientNorm)),
    anomalyCount: metrics.reduce((sum, m) => sum + m.anomalies.length, 0),
    finalLearningRate: lastMetric.learningRate,
  };
}

/**
 * Clean up completed training session.
 */
export function completeTrainingSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

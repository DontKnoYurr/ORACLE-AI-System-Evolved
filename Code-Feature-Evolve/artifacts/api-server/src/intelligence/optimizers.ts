/**
 * ORACLE Advanced Optimization Algorithms
 * 
 * Implements state-of-the-art optimization techniques including Adam, RMSprop,
 * and adaptive learning rate scheduling for superior convergence and stability.
 * Pure mathematical implementations without external ML libraries.
 */

export interface OptimizerState {
  m: Record<string, number>;      // First moment (mean) estimates
  v: Record<string, number>;      // Second moment (variance) estimates
  t: number;                       // Timestep counter
  adamBeta1: number;              // Exponential decay rate for first moment
  adamBeta2: number;              // Exponential decay rate for second moment
  epsilon: number;                // Small constant for numerical stability
}

export interface AdaptiveSchedule {
  baseRate: number;
  strategy: 'exponential' | 'polynomial' | 'cosine' | 'step' | 'warmup_cosine';
  scheduleParams: Record<string, number>;
}

/**
 * Initialize optimizer state for Adam algorithm.
 */
export function initializeAdamState(
  paramNames: string[],
  beta1: number = 0.9,
  beta2: number = 0.999,
  epsilon: number = 1e-8
): OptimizerState {
  const m: Record<string, number> = {};
  const v: Record<string, number> = {};
  
  for (const name of paramNames) {
    m[name] = 0;
    v[name] = 0;
  }
  
  return { m, v, t: 0, adamBeta1: beta1, adamBeta2: beta2, epsilon };
}

/**
 * Adam optimizer step: combines momentum with adaptive learning rates.
 * Highly effective for training deep models with sparse gradients.
 */
export function adamStep(
  params: Record<string, number>,
  gradients: Record<string, number>,
  state: OptimizerState,
  learningRate: number
): Record<string, number> {
  const updated = { ...params };
  state.t += 1;
  
  // Bias correction factors
  const biasCorrection1 = 1 - Math.pow(state.adamBeta1, state.t);
  const biasCorrection2 = 1 - Math.pow(state.adamBeta2, state.t);
  
  for (const [param, grad] of Object.entries(gradients)) {
    // Update biased first moment estimate
    state.m[param] = state.adamBeta1 * state.m[param] + (1 - state.adamBeta1) * grad;
    
    // Update biased second moment estimate
    state.v[param] = state.adamBeta2 * state.v[param] + (1 - state.adamBeta2) * grad * grad;
    
    // Compute bias-corrected first and second moment estimates
    const mHat = state.m[param] / biasCorrection1;
    const vHat = state.v[param] / biasCorrection2;
    
    // Update parameter
    updated[param] = params[param] - learningRate * mHat / (Math.sqrt(vHat) + state.epsilon);
  }
  
  return updated;
}

/**
 * RMSprop optimizer step: uses exponential moving average of squared gradients.
 * Effective for non-stationary problems and recurrent networks.
 */
export function rmspropStep(
  params: Record<string, number>,
  gradients: Record<string, number>,
  state: OptimizerState,
  learningRate: number,
  decayRate: number = 0.99
): Record<string, number> {
  const updated = { ...params };
  
  for (const [param, grad] of Object.entries(gradients)) {
    // Update second moment estimate (exponential moving average of squared gradients)
    state.v[param] = decayRate * state.v[param] + (1 - decayRate) * grad * grad;
    
    // Update parameter
    updated[param] = params[param] - learningRate * grad / (Math.sqrt(state.v[param]) + state.epsilon);
  }
  
  return updated;
}

/**
 * Compute adaptive learning rate based on schedule.
 */
export function computeAdaptiveLearningRate(
  epoch: number,
  totalEpochs: number,
  schedule: AdaptiveSchedule
): number {
  const progress = Math.min(epoch / totalEpochs, 1.0);
  
  switch (schedule.strategy) {
    case 'exponential': {
      const decayRate = schedule.scheduleParams.decayRate ?? 0.95;
      return schedule.baseRate * Math.pow(decayRate, epoch);
    }
    
    case 'polynomial': {
      const power = schedule.scheduleParams.power ?? 1.0;
      return schedule.baseRate * Math.pow(1 - progress, power);
    }
    
    case 'cosine': {
      return schedule.baseRate * 0.5 * (1 + Math.cos(Math.PI * progress));
    }
    
    case 'step': {
      const stepSize = schedule.scheduleParams.stepSize ?? Math.floor(totalEpochs / 3);
      const gamma = schedule.scheduleParams.gamma ?? 0.1;
      const steps = Math.floor(epoch / stepSize);
      return schedule.baseRate * Math.pow(gamma, steps);
    }
    
    case 'warmup_cosine': {
      const warmupEpochs = schedule.scheduleParams.warmupEpochs ?? Math.floor(totalEpochs * 0.1);
      
      if (epoch < warmupEpochs) {
        // Linear warmup phase
        return schedule.baseRate * (epoch / warmupEpochs);
      } else {
        // Cosine annealing phase
        const cosineProgress = (epoch - warmupEpochs) / (totalEpochs - warmupEpochs);
        return schedule.baseRate * 0.5 * (1 + Math.cos(Math.PI * cosineProgress));
      }
    }
    
    default:
      return schedule.baseRate;
  }
}

/**
 * Compute gradient norms for monitoring training stability.
 */
export function computeGradientNorms(gradients: Record<string, number>): {
  l2Norm: number;
  maxNorm: number;
  meanAbsGradient: number;
} {
  const values = Object.values(gradients);
  
  if (values.length === 0) {
    return { l2Norm: 0, maxNorm: 0, meanAbsGradient: 0 };
  }
  
  const l2Norm = Math.sqrt(values.reduce((sum, g) => sum + g * g, 0));
  const maxNorm = Math.max(...values.map(Math.abs));
  const meanAbsGradient = values.reduce((sum, g) => sum + Math.abs(g), 0) / values.length;
  
  return { l2Norm, maxNorm, meanAbsGradient };
}

/**
 * Gradient clipping to prevent exploding gradients.
 */
export function clipGradients(
  gradients: Record<string, number>,
  clipValue: number = 1.0
): Record<string, number> {
  const norms = computeGradientNorms(gradients);
  
  if (norms.l2Norm <= clipValue) {
    return gradients;
  }
  
  const scale = clipValue / norms.l2Norm;
  const clipped: Record<string, number> = {};
  
  for (const [param, grad] of Object.entries(gradients)) {
    clipped[param] = grad * scale;
  }
  
  return clipped;
}

/**
 * Compute exponential moving average for smoothing metrics.
 */
export function exponentialMovingAverage(
  current: number,
  previous: number,
  alpha: number = 0.1
): number {
  return alpha * current + (1 - alpha) * previous;
}

/**
 * Detect gradient anomalies (NaN, Inf, or extreme values).
 */
export function detectGradientAnomalies(
  gradients: Record<string, number>
): { hasAnomalies: boolean; anomalyDetails: string[] } {
  const anomalyDetails: string[] = [];
  
  for (const [param, grad] of Object.entries(gradients)) {
    if (!isFinite(grad)) {
      anomalyDetails.push(`Parameter ${param}: non-finite gradient (${grad})`);
    } else if (Math.abs(grad) > 1e6) {
      anomalyDetails.push(`Parameter ${param}: extremely large gradient (${grad.toFixed(2)})`);
    } else if (Math.abs(grad) < 1e-8 && grad !== 0) {
      anomalyDetails.push(`Parameter ${param}: extremely small gradient (${grad.toExponential(2)})`);
    }
  }
  
  return {
    hasAnomalies: anomalyDetails.length > 0,
    anomalyDetails,
  };
}

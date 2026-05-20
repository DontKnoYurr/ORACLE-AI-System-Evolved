/**
 * Unit Tests for Optimizer Module
 */

import {
  initializeAdamState,
  adamStep,
  rmspropStep,
  computeAdaptiveLearningRate,
  computeGradientNorms,
  clipGradients,
  detectGradientAnomalies,
  exponentialMovingAverage,
} from '../optimizers.js';

describe('Optimizer Module Tests', () => {
  
  describe('Adam Optimizer', () => {
    test('should initialize Adam state correctly', () => {
      const paramNames = ['weight1', 'weight2', 'weight3'];
      const state = initializeAdamState(paramNames);

      expect(state.t).toBe(0);
      expect(state.adamBeta1).toBe(0.9);
      expect(state.adamBeta2).toBe(0.999);
      expect(state.epsilon).toBe(1e-8);
      expect(Object.keys(state.m)).toEqual(paramNames);
      expect(Object.keys(state.v)).toEqual(paramNames);
      
      for (const param of paramNames) {
        expect(state.m[param]).toBe(0);
        expect(state.v[param]).toBe(0);
      }
    });

    test('should perform Adam step correctly', () => {
      const paramNames = ['w1', 'w2'];
      const state = initializeAdamState(paramNames);
      const params = { w1: 1.0, w2: 2.0 };
      const gradients = { w1: 0.1, w2: -0.05 };
      const learningRate = 0.001;

      const updated = adamStep(params, gradients, state, learningRate);

      expect(state.t).toBe(1);
      expect(updated.w1).toBeLessThan(params.w1);
      expect(updated.w2).toBeGreaterThan(params.w2);
      expect(updated.w1).toBeCloseTo(0.9999, 4);
      expect(updated.w2).toBeCloseTo(2.00005, 4);
    });

    test('should handle multiple Adam steps with momentum', () => {
      const paramNames = ['w'];
      const state = initializeAdamState(paramNames);
      const params = { w: 0.0 };
      const learningRate = 0.01;

      let current = params;
      for (let i = 0; i < 5; i++) {
        const gradients = { w: -1.0 };
        current = adamStep(current, gradients, state, learningRate);
      }

      expect(state.t).toBe(5);
      expect(current.w).toBeGreaterThan(0);
      expect(current.w).toBeLessThan(0.1);
    });
  });

  describe('RMSprop Optimizer', () => {
    test('should perform RMSprop step correctly', () => {
      const paramNames = ['w1', 'w2'];
      const state = initializeAdamState(paramNames);
      const params = { w1: 1.0, w2: 2.0 };
      const gradients = { w1: 0.1, w2: -0.05 };
      const learningRate = 0.001;

      const updated = rmspropStep(params, gradients, state, learningRate);

      expect(updated.w1).toBeLessThan(params.w1);
      expect(updated.w2).toBeGreaterThan(params.w2);
    });

    test('should accumulate second moments in RMSprop', () => {
      const paramNames = ['w'];
      const state = initializeAdamState(paramNames);
      const params = { w: 0.0 };

      rmspropStep(params, { w: 2.0 }, state, 0.01);
      expect(state.v.w).toBeCloseTo(0.04, 4);

      rmspropStep(params, { w: 2.0 }, state, 0.01);
      expect(state.v.w).toBeCloseTo(0.0796, 4);
    });
  });

  describe('Learning Rate Scheduling', () => {
    test('should compute exponential decay schedule', () => {
      const schedule = {
        baseRate: 0.1,
        strategy: 'exponential' as const,
        scheduleParams: { decayRate: 0.95 },
      };

      const lr0 = computeAdaptiveLearningRate(0, 100, schedule);
      const lr10 = computeAdaptiveLearningRate(10, 100, schedule);
      const lr50 = computeAdaptiveLearningRate(50, 100, schedule);

      expect(lr0).toBeCloseTo(0.1, 5);
      expect(lr10).toBeLessThan(lr0);
      expect(lr50).toBeLessThan(lr10);
    });

    test('should compute polynomial decay schedule', () => {
      const schedule = {
        baseRate: 0.1,
        strategy: 'polynomial' as const,
        scheduleParams: { power: 2.0 },
      };

      const lr0 = computeAdaptiveLearningRate(0, 100, schedule);
      const lr50 = computeAdaptiveLearningRate(50, 100, schedule);
      const lr99 = computeAdaptiveLearningRate(99, 100, schedule);

      expect(lr0).toBeCloseTo(0.1, 5);
      expect(lr50).toBeCloseTo(0.025, 4);
      expect(lr99).toBeLessThan(0.001);
    });

    test('should compute cosine annealing schedule', () => {
      const schedule = {
        baseRate: 0.1,
        strategy: 'cosine' as const,
        scheduleParams: {},
      };

      const lr0 = computeAdaptiveLearningRate(0, 100, schedule);
      const lr50 = computeAdaptiveLearningRate(50, 100, schedule);
      const lr100 = computeAdaptiveLearningRate(100, 100, schedule);

      expect(lr0).toBeCloseTo(0.1, 5);
      expect(lr50).toBeCloseTo(0.0, 5);
      expect(lr100).toBeCloseTo(0.1, 5);
    });

    test('should compute warmup cosine schedule', () => {
      const schedule = {
        baseRate: 0.1,
        strategy: 'warmup_cosine' as const,
        scheduleParams: { warmupEpochs: 10 },
      };

      const lr0 = computeAdaptiveLearningRate(0, 100, schedule);
      const lr5 = computeAdaptiveLearningRate(5, 100, schedule);
      const lr10 = computeAdaptiveLearningRate(10, 100, schedule);
      const lr55 = computeAdaptiveLearningRate(55, 100, schedule);

      expect(lr0).toBeCloseTo(0.0, 5);
      expect(lr5).toBeCloseTo(0.05, 4);
      expect(lr10).toBeCloseTo(0.1, 5);
      expect(lr55).toBeLessThan(lr10);
    });
  });

  describe('Gradient Norms', () => {
    test('should compute L2 norm correctly', () => {
      const gradients = { w1: 3.0, w2: 4.0 };
      const norms = computeGradientNorms(gradients);

      expect(norms.l2Norm).toBeCloseTo(5.0, 5);
    });

    test('should compute max norm correctly', () => {
      const gradients = { w1: 0.5, w2: -2.0, w3: 1.5 };
      const norms = computeGradientNorms(gradients);

      expect(norms.maxNorm).toBe(2.0);
    });

    test('should compute mean absolute gradient correctly', () => {
      const gradients = { w1: 1.0, w2: -1.0, w3: 2.0 };
      const norms = computeGradientNorms(gradients);

      expect(norms.meanAbsGradient).toBeCloseTo(4.0 / 3, 4);
    });

    test('should handle empty gradients', () => {
      const norms = computeGradientNorms({});

      expect(norms.l2Norm).toBe(0);
      expect(norms.maxNorm).toBe(0);
      expect(norms.meanAbsGradient).toBe(0);
    });
  });

  describe('Gradient Clipping', () => {
    test('should clip gradients when norm exceeds threshold', () => {
      const gradients = { w1: 3.0, w2: 4.0 };
      const clipped = clipGradients(gradients, 2.0);

      const norms = computeGradientNorms(clipped);
      expect(norms.l2Norm).toBeCloseTo(2.0, 5);
    });

    test('should not clip gradients when norm is below threshold', () => {
      const gradients = { w1: 0.3, w2: 0.4 };
      const clipped = clipGradients(gradients, 2.0);

      expect(clipped.w1).toBe(gradients.w1);
      expect(clipped.w2).toBe(gradients.w2);
    });

    test('should preserve gradient direction during clipping', () => {
      const gradients = { w1: 6.0, w2: 8.0 };
      const clipped = clipGradients(gradients, 2.0);

      expect(clipped.w1 / clipped.w2).toBeCloseTo(gradients.w1 / gradients.w2, 5);
    });
  });

  describe('Gradient Anomaly Detection', () => {
    test('should detect NaN gradients', () => {
      const gradients = { w1: NaN, w2: 1.0 };
      const result = detectGradientAnomalies(gradients);

      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalyDetails.length).toBeGreaterThan(0);
    });

    test('should detect infinite gradients', () => {
      const gradients = { w1: Infinity, w2: 1.0 };
      const result = detectGradientAnomalies(gradients);

      expect(result.hasAnomalies).toBe(true);
    });

    test('should detect extremely large gradients', () => {
      const gradients = { w1: 1e7, w2: 1.0 };
      const result = detectGradientAnomalies(gradients);

      expect(result.hasAnomalies).toBe(true);
    });

    test('should detect extremely small gradients', () => {
      const gradients = { w1: 1e-9, w2: 1.0 };
      const result = detectGradientAnomalies(gradients);

      expect(result.hasAnomalies).toBe(true);
    });

    test('should not flag normal gradients', () => {
      const gradients = { w1: 0.1, w2: -0.05, w3: 0.5 };
      const result = detectGradientAnomalies(gradients);

      expect(result.hasAnomalies).toBe(false);
      expect(result.anomalyDetails.length).toBe(0);
    });
  });

  describe('Exponential Moving Average', () => {
    test('should compute EMA correctly', () => {
      const ema1 = exponentialMovingAverage(10, 0, 0.1);
      expect(ema1).toBeCloseTo(1.0, 5);

      const ema2 = exponentialMovingAverage(10, ema1, 0.1);
      expect(ema2).toBeCloseTo(1.9, 5);
    });

    test('should converge to current value with high alpha', () => {
      let ema = 0;
      for (let i = 0; i < 10; i++) {
        ema = exponentialMovingAverage(100, ema, 0.5);
      }
      expect(ema).toBeCloseTo(100, 1);
    });

    test('should smooth with low alpha', () => {
      let ema = 0;
      ema = exponentialMovingAverage(100, ema, 0.01);
      expect(ema).toBeLessThan(2);
    });
  });
});

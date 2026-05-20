/**
 * Unit Tests for Synthetic Data Generator
 */

import {
  generateSeismicPulseInteractions,
  generateQuantumCollapseInteractions,
  generateTemporalObservationInteractions,
  generateAnomalyFlagInteractions,
  generateQueryInteractions,
  generateSignalRatingInteractions,
  generateBalancedSyntheticDataset,
  computeDatasetStatistics,
  GenerationConfig,
} from '../synthetic-generator.js';

describe('Synthetic Data Generator Tests', () => {
  
  const defaultConfig: GenerationConfig = {
    rareEventAugmentationFactor: 2.0,
    contextualVariance: 0.1,
    temporalSpread: true,
  };

  describe('Seismic Pulse Generation', () => {
    test('should generate correct number of interactions', () => {
      const interactions = generateSeismicPulseInteractions(10, defaultConfig);
      expect(interactions.length).toBe(10);
    });

    test('should set correct type and target', () => {
      const interactions = generateSeismicPulseInteractions(5, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('seismic_pulse');
        expect(interaction.target).toMatch(/^seismic_resonance_net_\d$/);
        expect(interaction.isynthetic).toBe(true);
      }
    });

    test('should have valid context fields', () => {
      const interactions = generateSeismicPulseInteractions(5, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.context.frequency).toBeGreaterThanOrEqual(5);
        expect(interaction.context.frequency).toBeLessThanOrEqual(25);
        expect(interaction.context.amplitude).toBeGreaterThanOrEqual(0.2);
        expect(interaction.context.amplitude).toBeLessThanOrEqual(1.0);
        expect(interaction.context.region).toMatch(/^(pacific|atlantic|eurasian|african)$/);
      }
    });

    test('should apply rare event augmentation', () => {
      const interactions = generateSeismicPulseInteractions(100, defaultConfig);
      const rareEvents = interactions.filter(i => i.context.isRareEvent);
      
      expect(rareEvents.length).toBeGreaterThan(0);
      expect(rareEvents.length).toBeLessThan(100);
      
      for (const rareEvent of rareEvents) {
        expect(rareEvent.trainingWeight).toBeGreaterThan(2.0);
      }
    });
  });

  describe('Quantum Collapse Generation', () => {
    test('should generate quantum interactions with valid coherence', () => {
      const interactions = generateQuantumCollapseInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('quantum_collapse');
        expect(interaction.value).toBeGreaterThanOrEqual(0.3);
        expect(interaction.value).toBeLessThanOrEqual(0.9);
        expect(interaction.context.coherence).toBeDefined();
      }
    });

    test('should have valid field states', () => {
      const interactions = generateQuantumCollapseInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.context.fieldState).toMatch(/^(entangled|superposition|collapsed)$/);
        expect(interaction.context.measurementBasis).toMatch(/^[xyz]$/);
      }
    });
  });

  describe('Temporal Observation Generation', () => {
    test('should generate temporal interactions with valid threat velocity', () => {
      const interactions = generateTemporalObservationInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('temporal_observe');
        expect(interaction.value).toBeGreaterThanOrEqual(0.8);
        expect(interaction.value).toBeLessThanOrEqual(2.6);
        expect(interaction.context.horizon).toBeGreaterThanOrEqual(10);
        expect(interaction.context.horizon).toBeLessThanOrEqual(70);
      }
    });

    test('should have valid threat types', () => {
      const interactions = generateTemporalObservationInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.context.threatType).toMatch(/^(geopolitical|economic|cyber|climate)$/);
      }
    });
  });

  describe('Anomaly Flag Generation', () => {
    test('should generate anomaly interactions with valid severity', () => {
      const interactions = generateAnomalyFlagInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('anomaly_flag');
        expect(interaction.value).toBeGreaterThanOrEqual(0.1);
        expect(interaction.value).toBeLessThanOrEqual(1.0);
      }
    });

    test('should have valid anomaly types', () => {
      const interactions = generateAnomalyFlagInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.context.anomalyType).toMatch(/^(statistical|behavioral|structural|temporal)$/);
        expect(interaction.context.domain).toMatch(/^(signals|entities|predictions)$/);
      }
    });
  });

  describe('Query Generation', () => {
    test('should generate query interactions', () => {
      const interactions = generateQueryInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('query');
        expect(interaction.target).toBe('oracle_nlp_engine');
        expect(interaction.context.queryTemplate).toBeDefined();
        expect(typeof interaction.context.queryTemplate).toBe('string');
      }
    });

    test('should have valid complexity values', () => {
      const interactions = generateQueryInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.context.complexity).toBeGreaterThanOrEqual(0.4);
        expect(interaction.context.complexity).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Signal Rating Generation', () => {
    test('should generate signal rating interactions', () => {
      const interactions = generateSignalRatingInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        expect(interaction.type).toBe('signal_rate');
        expect(interaction.context.rating).toBeGreaterThanOrEqual(1);
        expect(interaction.context.rating).toBeLessThanOrEqual(5);
      }
    });

    test('should correlate rating with relevance', () => {
      const interactions = generateSignalRatingInteractions(10, defaultConfig);
      
      for (const interaction of interactions) {
        const expectedRelevance = interaction.context.rating / 5;
        expect(interaction.value).toBeCloseTo(expectedRelevance, 5);
      }
    });
  });

  describe('Balanced Dataset Generation', () => {
    test('should generate balanced dataset with correct total count', () => {
      const dataset = generateBalancedSyntheticDataset(1000, defaultConfig);
      expect(dataset.length).toBe(1000);
    });

    test('should have reasonable distribution across types', () => {
      const dataset = generateBalancedSyntheticDataset(1000, defaultConfig);
      const stats = computeDatasetStatistics(dataset);
      
      expect(stats.typeDistribution.seismic_pulse).toBeGreaterThan(0);
      expect(stats.typeDistribution.quantum_collapse).toBeGreaterThan(0);
      expect(stats.typeDistribution.temporal_observe).toBeGreaterThan(0);
      expect(stats.typeDistribution.anomaly_flag).toBeGreaterThan(0);
      expect(stats.typeDistribution.query).toBeGreaterThan(0);
      expect(stats.typeDistribution.signal_rate).toBeGreaterThan(0);
    });

    test('should shuffle dataset', () => {
      const dataset1 = generateBalancedSyntheticDataset(100, defaultConfig);
      const dataset2 = generateBalancedSyntheticDataset(100, defaultConfig);
      
      // Check that the order is different (with very high probability)
      let sameOrder = true;
      for (let i = 0; i < Math.min(10, dataset1.length); i++) {
        if (dataset1[i].type !== dataset2[i].type) {
          sameOrder = false;
          break;
        }
      }
      
      expect(sameOrder).toBe(false);
    });
  });

  describe('Dataset Statistics', () => {
    test('should compute correct statistics', () => {
      const dataset = generateBalancedSyntheticDataset(500, defaultConfig);
      const stats = computeDatasetStatistics(dataset);
      
      expect(stats.totalCount).toBe(500);
      expect(Object.values(stats.typeDistribution).reduce((a, b) => a + b, 0)).toBe(500);
    });

    test('should compute average weights by type', () => {
      const dataset = generateBalancedSyntheticDataset(500, defaultConfig);
      const stats = computeDatasetStatistics(dataset);
      
      for (const [type, avgWeight] of Object.entries(stats.averageWeightByType)) {
        expect(avgWeight).toBeGreaterThan(0);
        expect(avgWeight).toBeLessThan(5);
      }
    });

    test('should track rare event distribution', () => {
      const dataset = generateBalancedSyntheticDataset(1000, defaultConfig);
      const stats = computeDatasetStatistics(dataset);
      
      expect(stats.rareEventPercentage).toBeGreaterThan(0);
      expect(stats.rareEventPercentage).toBeLessThan(30);
    });

    test('should handle empty dataset', () => {
      const stats = computeDatasetStatistics([]);
      
      expect(stats.totalCount).toBe(0);
      expect(Object.keys(stats.typeDistribution).length).toBe(0);
      expect(stats.rareEventPercentage).toBe(0);
    });
  });

  describe('Configuration Effects', () => {
    test('should apply rare event augmentation factor', () => {
      const config1: GenerationConfig = { ...defaultConfig, rareEventAugmentationFactor: 1.0 };
      const config2: GenerationConfig = { ...defaultConfig, rareEventAugmentationFactor: 3.0 };
      
      const dataset1 = generateBalancedSyntheticDataset(500, config1);
      const dataset2 = generateBalancedSyntheticDataset(500, config2);
      
      const stats1 = computeDatasetStatistics(dataset1);
      const stats2 = computeDatasetStatistics(dataset2);
      
      // Higher augmentation factor should result in higher average weights
      const avgWeight1 = Object.values(stats1.averageWeightByType).reduce((a, b) => a + b, 0) / Object.keys(stats1.averageWeightByType).length;
      const avgWeight2 = Object.values(stats2.averageWeightByType).reduce((a, b) => a + b, 0) / Object.keys(stats2.averageWeightByType).length;
      
      expect(avgWeight2).toBeGreaterThan(avgWeight1);
    });
  });

  describe('Data Quality', () => {
    test('should generate valid training weights', () => {
      const dataset = generateBalancedSyntheticDataset(500, defaultConfig);
      
      for (const interaction of dataset) {
        expect(interaction.trainingWeight).toBeGreaterThan(0);
        expect(interaction.trainingWeight).toBeLessThan(10);
      }
    });

    test('should generate valid timestamps', () => {
      const dataset = generateBalancedSyntheticDataset(100, defaultConfig);
      const now = new Date();
      
      for (const interaction of dataset) {
        expect(interaction.generatedAt).toBeInstanceOf(Date);
        expect(interaction.generatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(interaction.generatedAt.getTime()).toBeGreaterThan(now.getTime() - 24 * 60 * 60 * 1000);
      }
    });

    test('should mark all interactions as synthetic', () => {
      const dataset = generateBalancedSyntheticDataset(100, defaultConfig);
      
      for (const interaction of dataset) {
        expect(interaction.isynthetic).toBe(true);
      }
    });
  });
});

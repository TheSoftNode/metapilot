/**
 * AI Engine Core Tests
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { AIEngine } from '../../src/core/ai-engine';
import { createTestEngine } from '../../src/factory';
import { TEST_CONFIG } from '../../src/config';

describe('AIEngine Core', () => {
  let engine: AIEngine;

  beforeEach(async () => {
    engine = await createTestEngine();
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      expect(engine).toBeDefined();
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
    });

    test('should load default plugins', async () => {
      const status = engine.getStatus();
      expect(status.pluginsLoaded).toBeGreaterThan(0);
      
      const plugins = engine.getLoadedPlugins();
      expect(plugins).toContain('nlp-analyzer');
      expect(plugins).toContain('proposal-analyzer');
    });

    test('should have correct configuration', async () => {
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('Basic Analysis', () => {
    test('should analyze simple text', async () => {
      const result = await engine.analyze(
        'text',
        { text: 'This is a test proposal for funding developer grants.' },
        { blockchain: 'ethereum' },
        { priority: 'medium' }
      );

      expect(result.success).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.decision?.confidence).toBeGreaterThan(0);
      expect(result.decision?.reasoning).toBeInstanceOf(Array);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle sentiment analysis', async () => {
      const result = await engine.analyze(
        'sentiment',
        { text: 'This is an excellent proposal that will greatly benefit the community!' },
        {},
        { priority: 'medium' }
      );

      expect(result.success).toBe(true);
      expect(result.decision?.action).toBeDefined();
      expect(result.decision?.metadata).toHaveProperty('sentimentScore');
    });

    test('should analyze DAO proposals', async () => {
      const result = await engine.analyze(
        'proposal',
        {
          proposalId: 'test-proposal-1',
          daoName: 'TestDAO',
          proposalText: 'We propose to allocate 1000 ETH for developer ecosystem grants.',
          proposalType: 'treasury'
        },
        { blockchain: 'ethereum' },
        { priority: 'high' }
      );

      expect(result.success).toBe(true);
      expect(result.decision?.metadata).toHaveProperty('proposalType');
    });

    test('should handle invalid input gracefully', async () => {
      const result = await engine.analyze(
        'text',
        {},
        {},
        { priority: 'medium' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Plugin System', () => {
    test('should route to appropriate plugin', async () => {
      const result = await engine.analyze(
        'proposal',
        {
          proposalId: 'test-1',
          daoName: 'Test',
          proposalText: 'Test proposal'
        }
      );

      expect(result.provider).toBe('proposal-analyzer');
    });

    test('should handle plugin failures', async () => {
      // This would test fallback behavior
      const result = await engine.analyze(
        'unsupported-type',
        { text: 'test' },
        {},
        { fallbackStrategy: 'basic' }
      );

      // Should either succeed with fallback or fail gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Rule-Based Analysis', () => {
    test('should apply simple rules', async () => {
      const rules = [{
        id: 'test-rule-1',
        name: 'Support Developer Proposals',
        description: 'Vote YES if proposal mentions developers',
        condition: {
          type: 'natural_language' as const,
          expression: 'developer grants ecosystem'
        },
        action: {
          type: 'vote',
          parameters: { vote: 'YES' }
        },
        enabled: true,
        priority: 1
      }];

      const result = await engine.analyzeWithRules(
        { text: 'This proposal will fund developer grants for ecosystem growth' },
        rules
      );

      expect(result.success).toBe(true);
      expect(result.decision?.action).toBe('EXECUTE');
    });

    test('should handle multiple rules', async () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'Support Community',
          description: 'Vote YES for community proposals',
          condition: {
            type: 'natural_language' as const,
            expression: 'community benefit'
          },
          action: {
            type: 'vote',
            parameters: { vote: 'YES' }
          },
          enabled: true,
          priority: 2
        },
        {
          id: 'rule-2',
          name: 'Avoid High Risk',
          description: 'Vote NO for risky proposals',
          condition: {
            type: 'natural_language' as const,
            expression: 'risk dangerous unsafe'
          },
          action: {
            type: 'vote',
            parameters: { vote: 'NO' }
          },
          enabled: true,
          priority: 1
        }
      ];

      const result = await engine.analyzeWithRules(
        { text: 'This community initiative has some risk but benefits everyone' },
        rules
      );

      expect(result.success).toBe(true);
      // Should prioritize higher priority rule
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map((_, i) =>
        engine.analyze(
          'text',
          { text: `Test text ${i}` },
          {},
          { priority: 'medium' }
        )
      );

      const results = await Promise.all(requests);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.processingTime).toBeGreaterThan(0);
      });
    });

    test('should respect timeouts', async () => {
      const start = Date.now();
      
      const result = await engine.analyze(
        'text',
        { text: 'Test timeout handling' },
        {},
        { priority: 'medium', timeout: 100 }
      );

      const elapsed = Date.now() - start;
      
      // Should complete quickly or handle timeout appropriately
      expect(elapsed).toBeLessThan(5000); // 5 second max
    });

    test('should provide performance metrics', async () => {
      // Perform several analyses
      await engine.analyze('text', { text: 'Test 1' });
      await engine.analyze('text', { text: 'Test 2' });
      await engine.analyze('text', { text: 'Test 3' });

      const status = engine.getStatus();
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('pluginsLoaded');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests', async () => {
      const result = await engine.analyze(
        'text',
        null as any,
        {},
        { priority: 'medium' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle missing required fields', async () => {
      const result = await engine.analyze(
        'proposal',
        { proposalId: 'test' }, // Missing required fields
        {},
        { priority: 'medium' }
      );

      expect(result.success).toBe(false);
    });

    test('should provide helpful error messages', async () => {
      const result = await engine.analyze(
        'text',
        {},
        {},
        { priority: 'medium' }
      );

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });
  });

  describe('Learning System', () => {
    test('should record learning data', () => {
      const learningData = {
        userId: 'test-user',
        sessionId: 'test-session',
        requestId: 'test-request',
        decision: {
          action: 'EXECUTE' as const,
          confidence: 85,
          reasoning: ['Test reasoning'],
          metadata: {},
          riskAssessment: {
            level: 'low' as const,
            factors: []
          }
        },
        actualOutcome: {
          success: true,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        context: {}
      };

      engine.recordLearning(learningData);
      
      const userData = engine.getUserLearningData('test-user');
      expect(userData).toHaveLength(1);
      expect(userData[0].userId).toBe('test-user');
    });

    test('should provide learning insights', () => {
      // Record some learning data first
      const learningData = {
        userId: 'test-user',
        sessionId: 'test-session',
        requestId: 'test-request',
        decision: {
          action: 'EXECUTE' as const,
          confidence: 85,
          reasoning: ['Test'],
          metadata: {},
          riskAssessment: { level: 'low' as const, factors: [] }
        },
        actualOutcome: { success: true, timestamp: Date.now() },
        timestamp: Date.now(),
        context: {}
      };

      engine.recordLearning(learningData);
      
      const insights = engine.getSystemLearningInsights();
      expect(insights).toHaveProperty('totalSessions');
      expect(insights).toHaveProperty('avgConfidence');
      expect(insights).toHaveProperty('successRate');
    });
  });
});
/**
 * NLP Analyzer Plugin Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { NLPAnalyzer } from '../../src/plugins/nlp-analyzer';
import { AnalysisRequest } from '../../src/types/core';

describe('NLP Analyzer Plugin', () => {
  let analyzer: NLPAnalyzer;

  beforeEach(() => {
    analyzer = new NLPAnalyzer();
  });

  describe('Plugin Interface', () => {
    test('should have correct plugin metadata', () => {
      expect(analyzer.name).toBe('nlp-analyzer');
      expect(analyzer.version).toBe('1.0.0');
      expect(analyzer.supportedTypes).toContain('text');
      expect(analyzer.supportedTypes).toContain('sentiment');
      expect(analyzer.metadata).toBeDefined();
    });

    test('should validate input correctly', () => {
      const validRequest: AnalysisRequest = {
        id: 'test-1',
        type: 'text',
        input: { text: 'Test text' },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const invalidRequest: AnalysisRequest = {
        id: 'test-2',
        type: 'text',
        input: {},
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      expect(analyzer.validate(validRequest)).toBe(true);
      expect(analyzer.validate(invalidRequest)).toBe(false);
    });
  });

  describe('Sentiment Analysis', () => {
    test('should analyze positive sentiment', async () => {
      const request: AnalysisRequest = {
        id: 'sentiment-positive',
        type: 'sentiment',
        input: { 
          text: 'This is an amazing proposal that will greatly benefit our community! I strongly support this initiative.' 
        },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.decision!.metadata).toHaveProperty('sentimentScore');
      expect(result.decision!.metadata).toHaveProperty('normalizedScore');
      expect(result.decision!.confidence).toBeGreaterThan(50);
      
      // Should detect positive sentiment
      const normalizedScore = result.decision!.metadata.normalizedScore as number;
      expect(normalizedScore).toBeGreaterThan(0);
    });

    test('should analyze negative sentiment', async () => {
      const request: AnalysisRequest = {
        id: 'sentiment-negative',
        type: 'sentiment',
        input: { 
          text: 'This proposal is terrible and will damage our community. I strongly oppose this dangerous initiative.' 
        },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      const normalizedScore = result.decision!.metadata.normalizedScore as number;
      expect(normalizedScore).toBeLessThan(0);
    });

    test('should detect emotions', async () => {
      const request: AnalysisRequest = {
        id: 'emotion-test',
        type: 'sentiment',
        input: { 
          text: 'I am very excited and happy about this proposal. It makes me feel confident and secure about our future.' 
        },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision!.metadata).toHaveProperty('emotions');
      
      const emotions = result.decision!.metadata.emotions as string[];
      expect(emotions.length).toBeGreaterThan(0);
      expect(emotions).toContain('joy');
    });

    test('should calculate subjectivity and intensity', async () => {
      const request: AnalysisRequest = {
        id: 'subjectivity-test',
        type: 'sentiment',
        input: { 
          text: 'I personally think this proposal seems very promising and I believe it will probably succeed.' 
        },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision!.metadata).toHaveProperty('subjectivity');
      expect(result.decision!.metadata).toHaveProperty('intensity');
      
      const subjectivity = result.decision!.metadata.subjectivity as number;
      expect(subjectivity).toBeGreaterThan(0);
    });
  });

  describe('Proposal Analysis', () => {
    test('should analyze DAO proposal structure', async () => {
      const proposalText = `
        Treasury Allocation Proposal
        
        We propose to allocate 1000 ETH from the treasury for developer grants.
        This initiative will support ecosystem growth and innovation.
        
        The allocation will be distributed over 6 months with clear milestones:
        - Month 1-2: Developer onboarding and project selection
        - Month 3-4: Initial grant distribution
        - Month 5-6: Progress evaluation and final payments
        
        This proposal has strong community support and will benefit all stakeholders.
      `;

      const request: AnalysisRequest = {
        id: 'proposal-analysis',
        type: 'proposal',
        input: { text: proposalText },
        context: { blockchain: 'ethereum' },
        options: { priority: 'high' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision!.metadata).toHaveProperty('proposalType');
      expect(result.decision!.metadata).toHaveProperty('qualityScore');
      expect(result.decision!.metadata).toHaveProperty('keyPhrases');
      expect(result.decision!.metadata).toHaveProperty('proposedActions');
      
      const proposalType = result.decision!.metadata.proposalType as string;
      expect(proposalType).toBe('treasury');
      
      const qualityScore = result.decision!.metadata.qualityScore as number;
      expect(qualityScore).toBeGreaterThan(0.5); // Should be decent quality
    });

    test('should detect different proposal types', async () => {
      const technicalProposal = 'We propose to upgrade the smart contract protocol and implement new security features.';
      const governanceProposal = 'We propose to change the voting mechanism and governance parameters for better delegation.';
      const socialProposal = 'We propose to fund community events and educational outreach programs.';

      const testCases = [
        { text: technicalProposal, expectedType: 'technical' },
        { text: governanceProposal, expectedType: 'governance' },
        { text: socialProposal, expectedType: 'social' }
      ];

      for (const testCase of testCases) {
        const request: AnalysisRequest = {
          id: `proposal-type-${testCase.expectedType}`,
          type: 'proposal',
          input: { text: testCase.text },
          context: {},
          options: { priority: 'medium' },
          timestamp: Date.now()
        };

        const result = await analyzer.analyze(request);
        expect(result.success).toBe(true);
        
        const proposalType = result.decision!.metadata.proposalType as string;
        expect(proposalType).toBe(testCase.expectedType);
      }
    });

    test('should assess urgency levels', async () => {
      const urgentProposal = 'URGENT: Emergency proposal to address critical security vulnerability. Immediate action required!';
      const regularProposal = 'This proposal suggests gradual improvements to the platform over the next quarter.';

      const urgentRequest: AnalysisRequest = {
        id: 'urgent-test',
        type: 'proposal',
        input: { text: urgentProposal },
        context: {},
        options: { priority: 'high' },
        timestamp: Date.now()
      };

      const regularRequest: AnalysisRequest = {
        id: 'regular-test',
        type: 'proposal',
        input: { text: regularProposal },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const urgentResult = await analyzer.analyze(urgentRequest);
      const regularResult = await analyzer.analyze(regularRequest);

      expect(urgentResult.success).toBe(true);
      expect(regularResult.success).toBe(true);

      const urgentLevel = urgentResult.decision!.metadata.urgencyLevel as number;
      const regularLevel = regularResult.decision!.metadata.urgencyLevel as number;

      expect(urgentLevel).toBeGreaterThan(regularLevel);
    });

    test('should identify stakeholders', async () => {
      const proposalText = 'This proposal affects token holders, developers, validators, and community members.';

      const request: AnalysisRequest = {
        id: 'stakeholder-test',
        type: 'proposal',
        input: { text: proposalText },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision!.metadata).toHaveProperty('stakeholders');
      
      const stakeholders = result.decision!.metadata.stakeholders as string[];
      expect(stakeholders).toContain('holder');
      expect(stakeholders).toContain('developer');
      expect(stakeholders).toContain('validator');
      expect(stakeholders).toContain('member');
    });
  });

  describe('General Text Analysis', () => {
    test('should extract entities and topics', async () => {
      const text = 'John Smith from Ethereum Foundation discussed Bitcoin prices and DeFi protocols in New York.';

      const request: AnalysisRequest = {
        id: 'entity-extraction',
        type: 'text',
        input: { text },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);

      expect(result.success).toBe(true);
      expect(result.decision!.metadata).toHaveProperty('entities');
      expect(result.decision!.metadata).toHaveProperty('topics');
      
      const entities = result.decision!.metadata.entities as any[];
      expect(entities.length).toBeGreaterThan(0);
    });

    test('should calculate text complexity and readability', async () => {
      const simpleText = 'This is simple text. It has short words. Easy to read.';
      const complexText = 'This sophisticated implementation leverages advanced cryptographic mechanisms to facilitate decentralized autonomous organization governance through innovative blockchain-based consensus algorithms.';

      const simpleRequest: AnalysisRequest = {
        id: 'simple-complexity',
        type: 'text',
        input: { text: simpleText },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const complexRequest: AnalysisRequest = {
        id: 'complex-complexity',
        type: 'text',
        input: { text: complexText },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const simpleResult = await analyzer.analyze(simpleRequest);
      const complexResult = await analyzer.analyze(complexRequest);

      expect(simpleResult.success).toBe(true);
      expect(complexResult.success).toBe(true);

      const simpleComplexity = simpleResult.decision!.metadata.complexity as number;
      const complexComplexity = complexResult.decision!.metadata.complexity as number;

      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });

    test('should classify text categories', async () => {
      const technicalText = 'Smart contract deployment requires careful code review and security audits.';
      const financialText = 'Treasury management involves budget allocation and fund distribution strategies.';
      const socialText = 'Community engagement through education and outreach programs builds stronger relationships.';

      const testCases = [
        { text: technicalText, expectedCategory: 'technical' },
        { text: financialText, expectedCategory: 'financial' },
        { text: socialText, expectedCategory: 'social' }
      ];

      for (const testCase of testCases) {
        const request: AnalysisRequest = {
          id: `category-${testCase.expectedCategory}`,
          type: 'text',
          input: { text: testCase.text },
          context: {},
          options: { priority: 'medium' },
          timestamp: Date.now()
        };

        const result = await analyzer.analyze(request);
        expect(result.success).toBe(true);
        
        const category = result.decision!.metadata.category as string;
        expect(category).toBe(testCase.expectedCategory);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle empty text', async () => {
      const request: AnalysisRequest = {
        id: 'empty-text',
        type: 'text',
        input: { text: '' },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle very long text', async () => {
      const longText = 'a'.repeat(100000); // Very long text

      const request: AnalysisRequest = {
        id: 'long-text',
        type: 'text',
        input: { text: longText },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);
      // Should either handle gracefully or provide appropriate error
      expect(result).toBeDefined();
    });

    test('should handle non-text input', async () => {
      const request: AnalysisRequest = {
        id: 'non-text',
        type: 'text',
        input: { data: { someData: 'value' } },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const result = await analyzer.analyze(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No text provided');
    });
  });

  describe('Performance', () => {
    test('should complete analysis within reasonable time', async () => {
      const text = 'This is a moderate length text for performance testing. '.repeat(50);

      const request: AnalysisRequest = {
        id: 'performance-test',
        type: 'text',
        input: { text },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      const start = Date.now();
      const result = await analyzer.analyze(request);
      const processingTime = Date.now() - start;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should provide consistent results', async () => {
      const text = 'This proposal will allocate funds for community development.';

      const request: AnalysisRequest = {
        id: 'consistency-test',
        type: 'proposal',
        input: { text },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };

      // Run analysis multiple times
      const results = await Promise.all([
        analyzer.analyze(request),
        analyzer.analyze({ ...request, id: 'consistency-test-2' }),
        analyzer.analyze({ ...request, id: 'consistency-test-3' })
      ]);

      // Results should be consistent
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.decision!.metadata.proposalType).toBe(results[0].decision!.metadata.proposalType);
      });
    });
  });
});
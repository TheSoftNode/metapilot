# Plugin Development Guide

## Overview

The MetaPilot AI Engine uses a flexible plugin architecture that allows developers to create custom analyzers for specific domains, blockchains, or analysis types. This guide provides comprehensive information on developing, testing, and deploying custom plugins.

## Table of Contents

- [Plugin Architecture](#plugin-architecture)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Plugin Interface](#plugin-interface)
- [Advanced Features](#advanced-features)
- [Testing Plugins](#testing-plugins)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Deployment](#deployment)

## Plugin Architecture

### Core Concepts

The plugin system is built on several key principles:

1. **Interface Compliance**: All plugins implement the `AnalyzerPlugin` interface
2. **Type Safety**: TypeScript ensures compile-time type checking
3. **Isolation**: Plugins run in isolated contexts with error boundaries
4. **Extensibility**: Plugins can define custom metadata and configuration
5. **Performance**: Built-in caching and optimization support

### Plugin Lifecycle

```
Registration → Validation → Loading → Analysis → Cleanup
```

1. **Registration**: Plugin is registered with the engine
2. **Validation**: Engine validates plugin interface compliance
3. **Loading**: Plugin is loaded and initialized
4. **Analysis**: Plugin processes analysis requests
5. **Cleanup**: Plugin resources are cleaned up on shutdown

## Creating Your First Plugin

### Basic Plugin Structure

```typescript
import { AnalyzerPlugin, AnalysisRequest, AnalysisResult } from '@metapilot/ai-engine';

export class BasicTextAnalyzer implements AnalyzerPlugin {
  name = 'basic-text-analyzer';
  version = '1.0.0';
  supportedTypes = ['basic-text'];
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const { input } = request;
    
    // Validate input
    if (!input.text || typeof input.text !== 'string') {
      return {
        success: false,
        error: 'Text input required',
        processingTime: 0,
        provider: this.name
      };
    }
    
    const startTime = Date.now();
    
    // Perform analysis
    const wordCount = input.text.split(/\s+/).length;
    const charCount = input.text.length;
    
    const decision = {
      action: 'EXECUTE' as const,
      confidence: 95,
      reasoning: [`Analyzed text with ${wordCount} words`],
      metadata: {
        wordCount,
        charCount,
        avgWordLength: charCount / wordCount
      },
      riskAssessment: {
        level: 'low' as const,
        factors: []
      }
    };
    
    return {
      success: true,
      decision,
      processingTime: Date.now() - startTime,
      provider: this.name
    };
  }
  
  validate(request: AnalysisRequest): boolean {
    return request.input && typeof request.input.text === 'string';
  }
}
```

### Registration

```typescript
import { createBasicEngine } from '@metapilot/ai-engine';
import { BasicTextAnalyzer } from './basic-text-analyzer';

const engine = await createBasicEngine();
await engine.loadPlugin('basic-text', new BasicTextAnalyzer());

// Use the plugin
const result = await engine.analyze('basic-text', {
  text: 'Hello, world!'
});
```

## Plugin Interface

### Required Properties

#### name

```typescript
name: string
```

Unique identifier for the plugin. Should follow kebab-case naming convention.

**Guidelines:**
- Use descriptive names (e.g., 'sentiment-analyzer', 'dao-proposal-evaluator')
- Avoid generic names (e.g., 'analyzer', 'plugin')
- Include version in name if needed (e.g., 'nlp-analyzer-v2')

#### version

```typescript
version: string
```

Semantic version string following [SemVer](https://semver.org/) specification.

**Example:**
```typescript
version = '1.2.3'; // Major.Minor.Patch
```

#### supportedTypes

```typescript
supportedTypes: string[]
```

Array of analysis types this plugin can handle.

**Example:**
```typescript
supportedTypes = ['sentiment', 'emotion', 'toxicity'];
```

### Optional Properties

#### supportedBlockchains

```typescript
supportedBlockchains?: string[]
```

Array of blockchain networks this plugin supports.

**Example:**
```typescript
supportedBlockchains = ['ethereum', 'polygon', 'arbitrum'];
```

#### metadata

```typescript
metadata?: PluginMetadata
```

Additional plugin information and configuration.

```typescript
interface PluginMetadata {
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  tags?: string[];
  capabilities?: string[];
  requirements?: {
    apiKeys?: string[];
    dependencies?: string[];
    minEngineVersion?: string;
  };
}
```

### Required Methods

#### analyze()

```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult>
```

Main analysis method that processes requests and returns results.

**Input Validation:**
```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // Always validate input first
  if (!this.validate(request)) {
    return {
      success: false,
      error: 'Invalid input format',
      processingTime: 0,
      provider: this.name
    };
  }
  
  // Continue with analysis...
}
```

**Error Handling:**
```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Analysis logic here
    return {
      success: true,
      decision: result,
      processingTime: Date.now() - startTime,
      provider: this.name
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
      provider: this.name
    };
  }
}
```

### Optional Methods

#### validate()

```typescript
validate?(request: AnalysisRequest): boolean
```

Input validation method for type checking and preprocessing.

```typescript
validate(request: AnalysisRequest): boolean {
  const { input, type } = request;
  
  // Check if plugin supports this analysis type
  if (!this.supportedTypes.includes(type)) {
    return false;
  }
  
  // Validate required input fields
  if (!input.text || typeof input.text !== 'string') {
    return false;
  }
  
  // Additional validation logic
  if (input.text.length > 10000) {
    return false; // Text too long
  }
  
  return true;
}
```

## Advanced Features

### Context-Aware Analysis

```typescript
export class ContextAwareAnalyzer implements AnalyzerPlugin {
  name = 'context-aware-analyzer';
  version = '1.0.0';
  supportedTypes = ['contextual-analysis'];
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const { input, context } = request;
    
    // Use blockchain context
    if (context.blockchain === 'ethereum') {
      return this.analyzeEthereum(input);
    } else if (context.blockchain === 'solana') {
      return this.analyzeSolana(input);
    }
    
    // Use market context
    if (context.marketConditions) {
      const marketSentiment = context.marketConditions.sentiment;
      // Adjust analysis based on market conditions
    }
    
    // Use user history
    if (context.userHistory) {
      // Personalize analysis based on user patterns
    }
    
    return this.performGenericAnalysis(input);
  }
  
  private async analyzeEthereum(input: any): Promise<AnalysisResult> {
    // Ethereum-specific analysis
  }
  
  private async analyzeSolana(input: any): Promise<AnalysisResult> {
    // Solana-specific analysis
  }
}
```

### Multi-Step Analysis

```typescript
export class MultiStepAnalyzer implements AnalyzerPlugin {
  name = 'multi-step-analyzer';
  version = '1.0.0';
  supportedTypes = ['complex-analysis'];
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    const steps: string[] = [];
    
    try {
      // Step 1: Preprocessing
      steps.push('preprocessing');
      const preprocessed = await this.preprocess(request.input);
      
      // Step 2: Feature extraction
      steps.push('feature_extraction');
      const features = await this.extractFeatures(preprocessed);
      
      // Step 3: Analysis
      steps.push('analysis');
      const analysis = await this.performAnalysis(features);
      
      // Step 4: Post-processing
      steps.push('postprocessing');
      const result = await this.postprocess(analysis);
      
      return {
        success: true,
        decision: {
          action: result.action,
          confidence: result.confidence,
          reasoning: result.reasoning,
          metadata: {
            ...result.metadata,
            processingSteps: steps,
            stepTiming: this.getStepTiming()
          },
          riskAssessment: result.riskAssessment
        },
        processingTime: Date.now() - startTime,
        provider: this.name
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed at step: ${steps[steps.length - 1]}: ${error.message}`,
        processingTime: Date.now() - startTime,
        provider: this.name,
        metadata: { failedSteps: steps }
      };
    }
  }
  
  private async preprocess(input: any): Promise<any> {
    // Preprocessing logic
  }
  
  private async extractFeatures(data: any): Promise<any> {
    // Feature extraction logic
  }
  
  private async performAnalysis(features: any): Promise<any> {
    // Core analysis logic
  }
  
  private async postprocess(analysis: any): Promise<any> {
    // Post-processing logic
  }
}
```

### External API Integration

```typescript
export class ExternalAPIAnalyzer implements AnalyzerPlugin {
  name = 'external-api-analyzer';
  version = '1.0.0';
  supportedTypes = ['external-analysis'];
  
  private apiKey: string;
  private rateLimiter: RateLimiter;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
  }
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Check rate limiting
      if (!this.rateLimiter.checkLimit()) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          processingTime: Date.now() - startTime,
          provider: this.name
        };
      }
      
      // Make API call with retry logic
      const apiResult = await this.callExternalAPI(request.input);
      
      const decision = this.processAPIResult(apiResult);
      
      return {
        success: true,
        decision,
        processingTime: Date.now() - startTime,
        provider: this.name,
        metadata: {
          apiProvider: 'external-service',
          apiVersion: apiResult.version
        }
      };
    } catch (error) {
      return this.handleAPIError(error, Date.now() - startTime);
    }
  }
  
  private async callExternalAPI(input: any): Promise<any> {
    const response = await fetch('https://api.external-service.com/analyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  private handleAPIError(error: Error, processingTime: number): AnalysisResult {
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: 'External API rate limit exceeded',
        processingTime,
        provider: this.name
      };
    }
    
    if (error.message.includes('unauthorized')) {
      return {
        success: false,
        error: 'Invalid API credentials',
        processingTime,
        provider: this.name
      };
    }
    
    return {
      success: false,
      error: `External API error: ${error.message}`,
      processingTime,
      provider: this.name
    };
  }
}
```

### Caching Implementation

```typescript
export class CachedAnalyzer implements AnalyzerPlugin {
  name = 'cached-analyzer';
  version = '1.0.0';
  supportedTypes = ['cached-analysis'];
  
  private cache = new Map<string, { result: any; timestamp: number }>();
  private cacheTTL = 300000; // 5 minutes
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          fromCache: true,
          cacheAge: Date.now() - this.cache.get(cacheKey)!.timestamp
        }
      };
    }
    
    // Perform analysis
    const result = await this.performAnalysis(request);
    
    // Cache successful results
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  private generateCacheKey(request: AnalysisRequest): string {
    const keyData = {
      type: request.type,
      input: request.input,
      context: request.context
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }
  
  private getFromCache(key: string): AnalysisResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.result;
  }
  
  private setCache(key: string, result: AnalysisResult): void {
    // Implement size limit
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
}
```

## Testing Plugins

### Unit Testing

```typescript
// my-plugin.test.ts
import { describe, test, expect } from '@jest/globals';
import { MyCustomAnalyzer } from './my-plugin';
import { AnalysisRequest } from '@metapilot/ai-engine';

describe('MyCustomAnalyzer', () => {
  let analyzer: MyCustomAnalyzer;
  
  beforeEach(() => {
    analyzer = new MyCustomAnalyzer();
  });
  
  describe('Plugin Interface', () => {
    test('should have correct metadata', () => {
      expect(analyzer.name).toBe('my-custom-analyzer');
      expect(analyzer.version).toBe('1.0.0');
      expect(analyzer.supportedTypes).toContain('custom');
    });
    
    test('should validate input correctly', () => {
      const validRequest: AnalysisRequest = {
        id: 'test-1',
        type: 'custom',
        input: { text: 'Test input' },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };
      
      expect(analyzer.validate(validRequest)).toBe(true);
    });
  });
  
  describe('Analysis Logic', () => {
    test('should perform analysis successfully', async () => {
      const request: AnalysisRequest = {
        id: 'analysis-test',
        type: 'custom',
        input: { text: 'Test analysis input' },
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };
      
      const result = await analyzer.analyze(request);
      
      expect(result.success).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.provider).toBe('my-custom-analyzer');
    });
    
    test('should handle invalid input', async () => {
      const request: AnalysisRequest = {
        id: 'invalid-test',
        type: 'custom',
        input: {},
        context: {},
        options: { priority: 'medium' },
        timestamp: Date.now()
      };
      
      const result = await analyzer.analyze(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Performance', () => {
    test('should complete within timeout', async () => {
      const request: AnalysisRequest = {
        id: 'performance-test',
        type: 'custom',
        input: { text: 'Performance test input' },
        context: {},
        options: { priority: 'medium', timeout: 5000 },
        timestamp: Date.now()
      };
      
      const start = Date.now();
      const result = await analyzer.analyze(request);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(5000);
      expect(result.processingTime).toBeLessThan(5000);
    });
  });
});
```

### Integration Testing

```typescript
// plugin-integration.test.ts
import { describe, test, expect } from '@jest/globals';
import { createTestEngine } from '@metapilot/ai-engine';
import { MyCustomAnalyzer } from './my-plugin';

describe('Plugin Integration', () => {
  test('should integrate with engine successfully', async () => {
    const engine = await createTestEngine();
    const plugin = new MyCustomAnalyzer();
    
    // Load plugin
    await engine.loadPlugin('my-custom', plugin);
    
    // Verify plugin is loaded
    const loadedPlugins = engine.getLoadedPlugins();
    expect(loadedPlugins).toContain('my-custom');
    
    // Test analysis through engine
    const result = await engine.analyze('custom', {
      text: 'Integration test'
    });
    
    expect(result.success).toBe(true);
    expect(result.provider).toBe('my-custom-analyzer');
  });
  
  test('should handle plugin conflicts', async () => {
    const engine = await createTestEngine();
    const plugin1 = new MyCustomAnalyzer();
    const plugin2 = new MyCustomAnalyzer();
    
    await engine.loadPlugin('plugin1', plugin1);
    
    // Should reject duplicate plugin names
    await expect(
      engine.loadPlugin('plugin1', plugin2)
    ).rejects.toThrow('Plugin name already exists');
  });
});
```

## Best Practices

### Performance Optimization

1. **Implement Caching**
```typescript
class OptimizedAnalyzer implements AnalyzerPlugin {
  private resultCache = new Map();
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.resultCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.result;
    }
    
    const result = await this.performAnalysis(request);
    this.resultCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }
}
```

2. **Use Async Operations**
```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // Parallel processing when possible
  const [sentiment, entities, topics] = await Promise.all([
    this.analyzeSentiment(request.input.text),
    this.extractEntities(request.input.text),
    this.extractTopics(request.input.text)
  ]);
  
  return this.combineResults(sentiment, entities, topics);
}
```

3. **Implement Timeouts**
```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  const timeout = request.options?.timeout || 30000;
  
  return Promise.race([
    this.performAnalysis(request),
    new Promise<AnalysisResult>((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), timeout)
    )
  ]);
}
```

### Error Handling

1. **Graceful Degradation**
```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    return await this.performPrimaryAnalysis(request);
  } catch (error) {
    // Try fallback analysis
    try {
      return await this.performFallbackAnalysis(request);
    } catch (fallbackError) {
      return this.createErrorResult(error, fallbackError);
    }
  }
}
```

2. **Detailed Error Information**
```typescript
private createErrorResult(primaryError: Error, fallbackError?: Error): AnalysisResult {
  return {
    success: false,
    error: `Primary analysis failed: ${primaryError.message}${
      fallbackError ? `. Fallback also failed: ${fallbackError.message}` : ''
    }`,
    processingTime: 0,
    provider: this.name,
    metadata: {
      primaryError: primaryError.message,
      fallbackError: fallbackError?.message,
      errorType: primaryError.constructor.name
    }
  };
}
```

### Input Validation

1. **Comprehensive Validation**
```typescript
validate(request: AnalysisRequest): boolean {
  // Type validation
  if (!this.supportedTypes.includes(request.type)) {
    return false;
  }
  
  // Input validation
  const { input } = request;
  if (!input || typeof input !== 'object') {
    return false;
  }
  
  // Required fields validation
  if (request.type === 'text' && (!input.text || typeof input.text !== 'string')) {
    return false;
  }
  
  // Length validation
  if (input.text && input.text.length > 50000) {
    return false; // Text too long
  }
  
  // Context validation
  if (request.context?.blockchain && 
      this.supportedBlockchains && 
      !this.supportedBlockchains.includes(request.context.blockchain)) {
    return false;
  }
  
  return true;
}
```

2. **Input Sanitization**
```typescript
private sanitizeInput(input: any): any {
  if (input.text) {
    // Remove potentially harmful content
    input.text = input.text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[^\w\s\-.,!?]/g, '')
      .substring(0, 10000); // Limit length
  }
  
  return input;
}
```

### Logging and Monitoring

```typescript
import { Logger } from '@metapilot/ai-engine';

class MonitoredAnalyzer implements AnalyzerPlugin {
  name = 'monitored-analyzer';
  version = '1.0.0';
  supportedTypes = ['monitored'];
  
  private logger = new Logger(this.name);
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageProcessingTime: 0
  };
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    this.logger.info('Starting analysis', {
      requestId: request.id,
      type: request.type,
      inputSize: JSON.stringify(request.input).length
    });
    
    try {
      const result = await this.performAnalysis(request);
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      this.logger.info('Analysis completed', {
        requestId: request.id,
        processingTime,
        success: result.success,
        confidence: result.decision?.confidence
      });
      
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);
      
      this.logger.error('Analysis failed', {
        requestId: request.id,
        error: error.message,
        processingTime
      });
      
      throw error;
    }
  }
  
  private updateMetrics(processingTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    }
    
    // Update average processing time
    const totalProcessingTime = this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1) + processingTime;
    this.metrics.averageProcessingTime = totalProcessingTime / this.metrics.totalRequests;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests
    };
  }
}
```

## Examples

### DAO Proposal Classifier

```typescript
export class DAOProposalClassifier implements AnalyzerPlugin {
  name = 'dao-proposal-classifier';
  version = '1.0.0';
  supportedTypes = ['dao-classification'];
  supportedBlockchains = ['ethereum', 'polygon'];
  
  metadata = {
    description: 'Classifies DAO proposals by type and urgency',
    author: 'MetaPilot Team',
    tags: ['dao', 'governance', 'classification'],
    capabilities: ['proposal-type-detection', 'urgency-assessment']
  };
  
  private proposalTypes = {
    treasury: ['fund', 'allocate', 'budget', 'treasury', 'money'],
    technical: ['upgrade', 'protocol', 'smart contract', 'code', 'implementation'],
    governance: ['voting', 'parameter', 'governance', 'delegate', 'quorum'],
    social: ['community', 'education', 'outreach', 'event', 'marketing']
  };
  
  private urgencyIndicators = {
    high: ['urgent', 'emergency', 'critical', 'immediate', 'asap'],
    medium: ['important', 'timely', 'soon', 'priority'],
    low: ['future', 'eventually', 'consider', 'gradual']
  };
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    if (!this.validate(request)) {
      return {
        success: false,
        error: 'Invalid proposal data',
        processingTime: 0,
        provider: this.name
      };
    }
    
    const { proposalText } = request.input;
    const text = proposalText.toLowerCase();
    
    // Classify proposal type
    const proposalType = this.classifyProposalType(text);
    
    // Assess urgency
    const urgencyLevel = this.assessUrgency(text);
    
    // Calculate confidence based on keyword matches
    const confidence = this.calculateConfidence(text, proposalType, urgencyLevel);
    
    // Determine recommended action
    const action = this.determineAction(proposalType, urgencyLevel, confidence);
    
    const decision = {
      action,
      confidence,
      reasoning: [
        `Classified as ${proposalType} proposal`,
        `Urgency level: ${urgencyLevel}`,
        `Confidence: ${confidence}%`
      ],
      metadata: {
        proposalType,
        urgencyLevel,
        keywordMatches: this.getKeywordMatches(text),
        recommendedTimeframe: this.getRecommendedTimeframe(urgencyLevel)
      },
      riskAssessment: {
        level: this.assessRisk(proposalType, urgencyLevel),
        factors: this.getRiskFactors(proposalType, urgencyLevel)
      }
    };
    
    return {
      success: true,
      decision,
      processingTime: Date.now() - startTime,
      provider: this.name
    };
  }
  
  validate(request: AnalysisRequest): boolean {
    return !!(request.input?.proposalText && typeof request.input.proposalText === 'string');
  }
  
  private classifyProposalType(text: string): string {
    let maxScore = 0;
    let bestType = 'other';
    
    for (const [type, keywords] of Object.entries(this.proposalTypes)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestType = type;
      }
    }
    
    return bestType;
  }
  
  private assessUrgency(text: string): string {
    for (const [level, indicators] of Object.entries(this.urgencyIndicators)) {
      if (indicators.some(indicator => text.includes(indicator))) {
        return level;
      }
    }
    return 'medium'; // Default
  }
  
  private calculateConfidence(text: string, type: string, urgency: string): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on keyword matches
    if (type !== 'other') {
      confidence += 30;
    }
    
    // Adjust based on text length and structure
    if (text.length > 500) {
      confidence += 10; // Longer texts usually have more context
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }
  
  private determineAction(type: string, urgency: string, confidence: number): string {
    if (confidence < 60) {
      return 'DELEGATE'; // Low confidence, needs human review
    }
    
    if (urgency === 'high') {
      return 'ALERT'; // High urgency needs attention
    }
    
    if (type === 'treasury' && urgency === 'medium') {
      return 'WAIT'; // Treasury proposals need careful consideration
    }
    
    return 'EXECUTE'; // Default action
  }
  
  private assessRisk(type: string, urgency: string): string {
    if (type === 'treasury') return 'high';
    if (type === 'technical') return 'medium';
    if (urgency === 'high') return 'medium';
    return 'low';
  }
  
  private getRiskFactors(type: string, urgency: string): string[] {
    const factors = [];
    
    if (type === 'treasury') {
      factors.push('Financial implications');
    }
    
    if (type === 'technical') {
      factors.push('Technical complexity');
    }
    
    if (urgency === 'high') {
      factors.push('Time pressure');
    }
    
    return factors;
  }
}
```

### Market Sentiment Analyzer

```typescript
export class MarketSentimentAnalyzer implements AnalyzerPlugin {
  name = 'market-sentiment-analyzer';
  version = '1.0.0';
  supportedTypes = ['market-sentiment'];
  
  private sentimentWords = {
    positive: ['bullish', 'moon', 'pump', 'gains', 'profit', 'up', 'rise'],
    negative: ['bearish', 'dump', 'crash', 'loss', 'down', 'fall', 'rekt']
  };
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const { text } = request.input;
    const marketData = request.context?.marketData;
    
    // Analyze text sentiment
    const textSentiment = this.analyzeTextSentiment(text);
    
    // Incorporate market data if available
    const marketSentiment = marketData ? this.analyzeMarketData(marketData) : 0;
    
    // Combined sentiment score
    const combinedSentiment = (textSentiment + marketSentiment) / 2;
    
    // Determine market action
    const action = this.determineMarketAction(combinedSentiment);
    
    return {
      success: true,
      decision: {
        action,
        confidence: Math.abs(combinedSentiment) * 100,
        reasoning: [
          `Text sentiment: ${textSentiment > 0 ? 'positive' : 'negative'}`,
          `Market sentiment: ${marketSentiment > 0 ? 'bullish' : 'bearish'}`,
          `Combined score: ${combinedSentiment.toFixed(2)}`
        ],
        metadata: {
          textSentiment,
          marketSentiment,
          combinedSentiment,
          recommendation: this.getMarketRecommendation(combinedSentiment)
        },
        riskAssessment: {
          level: Math.abs(combinedSentiment) > 0.7 ? 'high' : 'medium',
          factors: ['Market volatility', 'Sentiment extremes']
        }
      },
      processingTime: 50,
      provider: this.name
    };
  }
  
  private analyzeTextSentiment(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (this.sentimentWords.positive.includes(word)) {
        positiveCount++;
      } else if (this.sentimentWords.negative.includes(word)) {
        negativeCount++;
      }
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;
    
    return (positiveCount - negativeCount) / totalSentimentWords;
  }
  
  private analyzeMarketData(marketData: any): number {
    // Simple market sentiment based on price change
    const priceChange = marketData.priceChange24h || 0;
    return Math.max(-1, Math.min(1, priceChange / 10)); // Normalize to -1 to 1
  }
  
  private determineMarketAction(sentiment: number): string {
    if (sentiment > 0.5) return 'EXECUTE'; // Strong positive sentiment
    if (sentiment < -0.5) return 'WAIT'; // Strong negative sentiment
    return 'DELEGATE'; // Neutral, needs human decision
  }
  
  private getMarketRecommendation(sentiment: number): string {
    if (sentiment > 0.7) return 'Strong buy signal';
    if (sentiment > 0.3) return 'Moderate buy signal';
    if (sentiment > -0.3) return 'Hold position';
    if (sentiment > -0.7) return 'Moderate sell signal';
    return 'Strong sell signal';
  }
}
```

## Deployment

### NPM Package

1. **Package Structure**
```
my-ai-plugin/
├── src/
│   ├── index.ts
│   ├── my-analyzer.ts
│   └── types.ts
├── tests/
│   └── my-analyzer.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

2. **package.json**
```json
{
  "name": "@your-org/my-ai-plugin",
  "version": "1.0.0",
  "description": "Custom AI analyzer plugin for MetaPilot",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepare": "npm run build"
  },
  "peerDependencies": {
    "@metapilot/ai-engine": "^1.0.0"
  },
  "keywords": ["ai", "metapilot", "plugin", "analyzer"],
  "author": "Your Name",
  "license": "MIT"
}
```

3. **Usage**
```bash
npm install @your-org/my-ai-plugin
```

```typescript
import { createBasicEngine } from '@metapilot/ai-engine';
import { MyAnalyzer } from '@your-org/my-ai-plugin';

const engine = await createBasicEngine();
await engine.loadPlugin('my-analyzer', new MyAnalyzer());
```

### Plugin Registry

Submit your plugin to the MetaPilot plugin registry for community discovery:

1. **Registry Submission**
```typescript
// registry-submission.json
{
  "name": "my-ai-plugin",
  "version": "1.0.0",
  "description": "Description of your plugin",
  "author": "Your Name",
  "repository": "https://github.com/your-org/my-ai-plugin",
  "supportedTypes": ["custom-analysis"],
  "supportedBlockchains": ["ethereum"],
  "tags": ["dao", "governance"],
  "verified": false
}
```

2. **Verification Process**
- Code review by MetaPilot team
- Security audit
- Performance testing
- Documentation review

This comprehensive guide provides everything needed to develop, test, and deploy custom plugins for the MetaPilot AI Engine.
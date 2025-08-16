# API Reference

## Table of Contents

- [Core Classes](#core-classes)
  - [AIEngine](#aiengine)
  - [AnalyzerPlugin](#analyzerplugin)
- [Factory Functions](#factory-functions)
- [Type Definitions](#type-definitions)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Events](#events)

## Core Classes

### AIEngine

The main AI engine class that orchestrates analysis operations.

#### Constructor

```typescript
constructor(config: AIEngineConfig)
```

Creates a new AI engine instance with the specified configuration.

**Parameters:**
- `config` (AIEngineConfig): Engine configuration options

#### Methods

##### initialize()

```typescript
async initialize(): Promise<void>
```

Initializes the AI engine, loads plugins, and sets up systems.

**Throws:**
- `Error`: If initialization fails

**Example:**
```typescript
const engine = new AIEngine(config);
await engine.initialize();
```

##### analyze()

```typescript
async analyze(
  type: string,
  input: AnalysisInput,
  context?: AnalysisContext,
  options?: AnalysisOptions
): Promise<AnalysisResult>
```

Performs AI analysis on the provided input.

**Parameters:**
- `type` (string): Analysis type (e.g., 'text', 'sentiment', 'proposal')
- `input` (AnalysisInput): Input data for analysis
- `context` (AnalysisContext, optional): Environmental context
- `options` (AnalysisOptions, optional): Processing options

**Returns:**
- `Promise<AnalysisResult>`: Analysis result with decision and metadata

**Example:**
```typescript
const result = await engine.analyze(
  'sentiment',
  { text: 'This is amazing!' },
  { blockchain: 'ethereum' },
  { priority: 'high' }
);
```

##### analyzeWithRules()

```typescript
async analyzeWithRules(
  input: AnalysisInput,
  rules: Rule[],
  context?: AnalysisContext
): Promise<AnalysisResult>
```

Performs rule-based analysis using user-defined rules.

**Parameters:**
- `input` (AnalysisInput): Input data for analysis
- `rules` (Rule[]): Array of rules to apply
- `context` (AnalysisContext, optional): Environmental context

**Returns:**
- `Promise<AnalysisResult>`: Analysis result based on rule evaluation

**Example:**
```typescript
const rules = [{
  id: 'support-devs',
  name: 'Support Developers',
  condition: { type: 'natural_language', expression: 'developer grants' },
  action: { type: 'vote', parameters: { vote: 'YES' } },
  enabled: true,
  priority: 1
}];

const result = await engine.analyzeWithRules(
  { text: 'Fund developer ecosystem' },
  rules
);
```

##### loadPlugin()

```typescript
async loadPlugin(name: string, plugin: AnalyzerPlugin): Promise<void>
```

Loads a new analyzer plugin into the engine.

**Parameters:**
- `name` (string): Unique plugin name
- `plugin` (AnalyzerPlugin): Plugin implementation

**Throws:**
- `Error`: If plugin validation fails or name conflicts

**Example:**
```typescript
class CustomAnalyzer implements AnalyzerPlugin {
  name = 'custom-analyzer';
  version = '1.0.0';
  supportedTypes = ['custom'];
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    // Implementation
  }
}

await engine.loadPlugin('custom', new CustomAnalyzer());
```

##### unloadPlugin()

```typescript
unloadPlugin(name: string): boolean
```

Removes a plugin from the engine.

**Parameters:**
- `name` (string): Plugin name to remove

**Returns:**
- `boolean`: True if plugin was removed, false if not found

##### getLoadedPlugins()

```typescript
getLoadedPlugins(): string[]
```

Returns array of loaded plugin names.

**Returns:**
- `string[]`: Array of plugin names

##### recordLearning()

```typescript
recordLearning(data: LearningData): void
```

Records learning data for system improvement.

**Parameters:**
- `data` (LearningData): Learning data with outcomes and feedback

**Example:**
```typescript
engine.recordLearning({
  userId: 'user-123',
  sessionId: 'session-456',
  requestId: 'request-789',
  decision: previousDecision,
  actualOutcome: { success: true, timestamp: Date.now() },
  userFeedback: { rating: 5, correctness: 'correct' },
  timestamp: Date.now(),
  context: { blockchain: 'ethereum' }
});
```

##### getUserLearningData()

```typescript
getUserLearningData(userId: string): LearningData[]
```

Retrieves learning data for a specific user.

**Parameters:**
- `userId` (string): User identifier

**Returns:**
- `LearningData[]`: Array of learning data entries

##### getSystemLearningInsights()

```typescript
getSystemLearningInsights(): SystemLearningInsights
```

Gets aggregated learning insights across all users.

**Returns:**
- `SystemLearningInsights`: Statistical insights and patterns

##### getStatus()

```typescript
getStatus(): EngineStatus
```

Returns current engine status and metrics.

**Returns:**
- `EngineStatus`: Status information including performance metrics

**Example:**
```typescript
const status = engine.getStatus();
console.log(`Plugins loaded: ${status.pluginsLoaded}`);
console.log(`Cache hits: ${status.cacheSize.hits}`);
```

##### addEventListener()

```typescript
addEventListener(event: string, handler: EventHandler): void
```

Adds event listener for engine events.

**Parameters:**
- `event` (string): Event name (see [Events](#events))
- `handler` (EventHandler): Event handler function

**Example:**
```typescript
engine.addEventListener('analysis_completed', (event) => {
  console.log(`Analysis ${event.requestId} completed`);
});
```

##### shutdown()

```typescript
async shutdown(): Promise<void>
```

Gracefully shuts down the engine and cleans up resources.

**Example:**
```typescript
await engine.shutdown();
```

### AnalyzerPlugin

Interface for creating custom analyzer plugins.

#### Properties

##### name

```typescript
name: string
```

Unique plugin identifier.

##### version

```typescript
version: string
```

Plugin version string (semantic versioning recommended).

##### supportedTypes

```typescript
supportedTypes: string[]
```

Array of analysis types this plugin can handle.

##### supportedBlockchains

```typescript
supportedBlockchains?: string[]
```

Optional array of supported blockchain networks.

##### metadata

```typescript
metadata?: PluginMetadata
```

Optional plugin metadata with additional information.

#### Methods

##### analyze()

```typescript
async analyze(request: AnalysisRequest): Promise<AnalysisResult>
```

Main analysis method that processes requests.

**Parameters:**
- `request` (AnalysisRequest): Complete analysis request

**Returns:**
- `Promise<AnalysisResult>`: Analysis result

##### validate()

```typescript
validate?(request: AnalysisRequest): boolean
```

Optional validation method for input checking.

**Parameters:**
- `request` (AnalysisRequest): Request to validate

**Returns:**
- `boolean`: True if request is valid

## Factory Functions

### createBasicEngine()

```typescript
async createBasicEngine(options?: Partial<AIEngineConfig>): Promise<AIEngine>
```

Creates a basic AI engine with core plugins only.

**Parameters:**
- `options` (Partial<AIEngineConfig>, optional): Configuration overrides

**Returns:**
- `Promise<AIEngine>`: Initialized engine instance

**Example:**
```typescript
const engine = await createBasicEngine({
  logLevel: 'info',
  enableCaching: true
});
```

### createEnhancedEngine()

```typescript
async createEnhancedEngine(options: EnhancedEngineOptions): Promise<AIEngine>
```

Creates an enhanced engine with AI provider integration.

**Parameters:**
- `options` (EnhancedEngineOptions): Configuration including API keys

**Returns:**
- `Promise<AIEngine>`: Initialized enhanced engine

**Example:**
```typescript
const engine = await createEnhancedEngine({
  openaiApiKey: 'sk-...',
  logLevel: 'info'
});
```

### createProductionEngine()

```typescript
async createProductionEngine(options: ProductionEngineOptions): Promise<AIEngine>
```

Creates a production-optimized engine with full features.

**Parameters:**
- `options` (ProductionEngineOptions): Production configuration

**Returns:**
- `Promise<AIEngine>`: Production-ready engine

### createLightweightEngine()

```typescript
async createLightweightEngine(): Promise<AIEngine>
```

Creates a minimal engine for resource-constrained environments.

**Returns:**
- `Promise<AIEngine>`: Lightweight engine instance

### createTestEngine()

```typescript
async createTestEngine(): Promise<AIEngine>
```

Creates an engine optimized for testing with mocked dependencies.

**Returns:**
- `Promise<AIEngine>`: Test-configured engine

## Type Definitions

### AnalysisInput

```typescript
interface AnalysisInput {
  text?: string;
  data?: Record<string, unknown>;
  proposalId?: string;
  daoName?: string;
  proposalText?: string;
  proposalType?: string;
  [key: string]: unknown;
}
```

Flexible input structure for various analysis types.

### AnalysisContext

```typescript
interface AnalysisContext {
  blockchain?: string;
  protocol?: string;
  userHistory?: unknown[];
  marketConditions?: Record<string, unknown>;
  timeframe?: string;
  previousDecisions?: AIDecision[];
  userPreferences?: Record<string, unknown>;
  [key: string]: unknown;
}
```

Environmental context for analysis.

### AnalysisOptions

```typescript
interface AnalysisOptions {
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
  fallbackStrategy?: 'none' | 'basic' | 'cached';
  realtime?: boolean;
  [key: string]: unknown;
}
```

Processing options and preferences.

### AIDecision

```typescript
interface AIDecision {
  action: 'EXECUTE' | 'WAIT' | 'SKIP' | 'DELEGATE' | 'ALERT';
  confidence: number; // 0-100
  reasoning: string[];
  metadata: Record<string, unknown>;
  alternatives?: AlternativeAction[];
  riskAssessment: RiskAssessment;
  executionPlan?: ExecutionPlan;
}
```

Standardized decision output from AI analysis.

### AnalysisResult

```typescript
interface AnalysisResult {
  success: boolean;
  decision?: AIDecision;
  error?: string;
  processingTime: number;
  provider: string;
  metadata?: Record<string, unknown>;
}
```

Complete analysis result wrapper.

### Rule

```typescript
interface Rule {
  id: string;
  name: string;
  description?: string;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  priority: number;
}
```

User-defined rule for automated decision making.

### RuleCondition

```typescript
interface RuleCondition {
  type: 'natural_language' | 'numeric' | 'temporal' | 'logical';
  expression: string;
  parameters?: Record<string, unknown>;
}
```

Rule condition specification.

### RuleAction

```typescript
interface RuleAction {
  type: string;
  parameters: Record<string, unknown>;
}
```

Action to take when rule condition is met.

### LearningData

```typescript
interface LearningData {
  userId: string;
  sessionId: string;
  requestId: string;
  decision: AIDecision;
  actualOutcome: ExecutionOutcome;
  userFeedback?: UserFeedback;
  timestamp: number;
  context: AnalysisContext;
}
```

Learning data for system improvement.

### RiskAssessment

```typescript
interface RiskAssessment {
  level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
  score?: number; // 0-100
  mitigations?: string[];
}
```

Risk evaluation structure.

## Configuration

### AIEngineConfig

```typescript
interface AIEngineConfig {
  environment: 'development' | 'testing' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  providers: {
    openai?: OpenAIConfig;
    anthropic?: AnthropicConfig;
    local?: LocalModelConfig;
  };
  
  caching: {
    enabled: boolean;
    ttl: number; // seconds
    maxSize: number;
  };
  
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  features: {
    learningEnabled: boolean;
    fallbackEnabled: boolean;
    streamingEnabled: boolean;
    multiProviderEnabled: boolean;
  };
  
  performance: {
    timeout: number; // milliseconds
    maxConcurrent: number;
    batchSize: number;
  };
}
```

Complete engine configuration structure.

### OpenAIConfig

```typescript
interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  organizationId?: string;
}
```

OpenAI provider configuration.

## Error Handling

### Error Types

#### ValidationError

Thrown when input validation fails.

```typescript
class ValidationError extends Error {
  constructor(message: string, field: string)
}
```

#### PluginError

Thrown when plugin operations fail.

```typescript
class PluginError extends Error {
  constructor(message: string, pluginName: string)
}
```

#### AnalysisError

Thrown when analysis execution fails.

```typescript
class AnalysisError extends Error {
  constructor(message: string, analysisType: string)
}
```

#### RateLimitError

Thrown when rate limits are exceeded.

```typescript
class RateLimitError extends Error {
  constructor(message: string, resetTime: number)
}
```

### Error Handling Patterns

```typescript
try {
  const result = await engine.analyze('proposal', data);
  
  if (!result.success) {
    console.error('Analysis failed:', result.error);
    // Handle analysis failure
  }
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.resetTime));
  } else if (error instanceof ValidationError) {
    // Fix input and retry
    console.error('Invalid input:', error.message);
  } else {
    // General error handling
    console.error('Unexpected error:', error);
  }
}
```

## Events

The AI engine emits various events for monitoring and integration.

### Event Types

#### analysis_started

Emitted when analysis begins.

```typescript
interface AnalysisStartedEvent {
  requestId: string;
  type: string;
  timestamp: number;
}
```

#### analysis_completed

Emitted when analysis completes successfully.

```typescript
interface AnalysisCompletedEvent {
  requestId: string;
  type: string;
  processingTime: number;
  provider: string;
  timestamp: number;
}
```

#### analysis_failed

Emitted when analysis fails.

```typescript
interface AnalysisFailedEvent {
  requestId: string;
  type: string;
  error: string;
  processingTime: number;
  timestamp: number;
}
```

#### plugin_loaded

Emitted when a plugin is loaded.

```typescript
interface PluginLoadedEvent {
  pluginName: string;
  version: string;
  supportedTypes: string[];
  timestamp: number;
}
```

#### cache_hit

Emitted when cached result is used.

```typescript
interface CacheHitEvent {
  requestId: string;
  cacheKey: string;
  timestamp: number;
}
```

#### rate_limit_exceeded

Emitted when rate limit is exceeded.

```typescript
interface RateLimitExceededEvent {
  identifier: string;
  limit: number;
  resetTime: number;
  timestamp: number;
}
```

### Event Usage

```typescript
// Monitor performance
engine.addEventListener('analysis_completed', (event) => {
  console.log(`${event.type} analysis took ${event.processingTime}ms`);
});

// Handle failures
engine.addEventListener('analysis_failed', (event) => {
  console.error(`Analysis ${event.requestId} failed: ${event.error}`);
});

// Track cache efficiency
let cacheHits = 0;
let totalRequests = 0;

engine.addEventListener('cache_hit', () => cacheHits++);
engine.addEventListener('analysis_started', () => totalRequests++);

setInterval(() => {
  const hitRate = (cacheHits / totalRequests) * 100;
  console.log(`Cache hit rate: ${hitRate.toFixed(1)}%`);
}, 60000);
```

## Constants

### Analysis Types

```typescript
export const ANALYSIS_TYPES = {
  TEXT: 'text',
  SENTIMENT: 'sentiment',
  PROPOSAL: 'proposal',
  CONTEXTUAL: 'contextual',
  MARKET: 'market',
  RISK: 'risk'
} as const;
```

### Decision Actions

```typescript
export const DECISION_ACTIONS = {
  EXECUTE: 'EXECUTE',
  WAIT: 'WAIT',
  SKIP: 'SKIP',
  DELEGATE: 'DELEGATE',
  ALERT: 'ALERT'
} as const;
```

### Risk Levels

```typescript
export const RISK_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
} as const;
```

This API reference provides comprehensive documentation for all public interfaces and methods in the MetaPilot AI Engine.
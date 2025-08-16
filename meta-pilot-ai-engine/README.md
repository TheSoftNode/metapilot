# MetaPilot AI Engine

🤖 **Advanced AI Engine for Web3 Automation and Decision Making**

A flexible, extensible AI system designed for Web3 projects like MetaPilot, enabling intelligent automation of DAO voting, transaction optimization, and blockchain decision-making through natural language rules and machine learning.

## 🚀 Features

### Core Capabilities
- **Natural Language Processing**: Parse and understand user-defined rules in plain English
- **Multi-Modal Analysis**: Text, sentiment, numerical data, and temporal pattern analysis
- **Blockchain Intelligence**: Specialized knowledge for Web3/DAO governance and DeFi operations
- **Cross-Chain Support**: Works across Ethereum, Solana, and other blockchain networks
- **Real-Time Processing**: Sub-second analysis for time-sensitive decisions

### AI Analysis Types
- **DAO Proposal Analysis**: Comprehensive governance proposal evaluation
- **Sentiment Analysis**: Advanced emotion and sentiment detection
- **Market Intelligence**: Price trends, volatility, and timing analysis
- **Risk Assessment**: Multi-factor risk evaluation and mitigation strategies
- **Transaction Optimization**: Gas optimization and execution timing

### Advanced Features
- **Plugin Architecture**: Extensible system for custom analyzers
- **Learning System**: Adaptive improvement based on outcomes and user feedback
- **Multiple AI Providers**: OpenAI GPT, Anthropic Claude, and local model support
- **Performance Optimization**: Caching, rate limiting, and batch processing
- **Production Ready**: Comprehensive logging, monitoring, and error handling

## 📦 Installation

```bash
npm install @metapilot/ai-engine
```

## 🏃‍♂️ Quick Start

### Basic Usage

```typescript
import { createBasicEngine } from '@metapilot/ai-engine';

// Create basic AI engine
const aiEngine = await createBasicEngine({
  logLevel: 'info',
  enableCaching: true
});

// Analyze text
const result = await aiEngine.analyze(
  'sentiment',
  { text: 'This proposal will greatly benefit our community!' },
  { blockchain: 'ethereum' },
  { priority: 'medium' }
);

console.log('AI Decision:', result.decision);
// Output: { action: 'EXECUTE', confidence: 87, reasoning: [...] }
```

### DAO Proposal Analysis

```typescript
import { createEnhancedEngine } from '@metapilot/ai-engine';

// Create enhanced engine with OpenAI
const aiEngine = await createEnhancedEngine({
  openaiApiKey: 'your-openai-api-key',
  logLevel: 'info'
});

// Analyze DAO proposal
const proposalResult = await aiEngine.analyze(
  'proposal',
  {
    proposalId: 'prop-123',
    daoName: 'Uniswap',
    proposalText: 'Allocate 1000 ETH for developer ecosystem grants...',
    proposalType: 'treasury'
  },
  {
    blockchain: 'ethereum',
    marketConditions: { sentiment: 0.7, volatility: 0.3 }
  },
  { priority: 'high' }
);

console.log('Proposal Analysis:', proposalResult.decision);
```

### Rule-Based Decision Making

```typescript
// Define natural language rules
const votingRules = [
  {
    id: 'support-developers',
    name: 'Support Developer Ecosystem',
    description: 'Vote YES if proposal supports developers',
    condition: {
      type: 'natural_language',
      expression: 'developer grant ecosystem funding'
    },
    action: {
      type: 'vote',
      parameters: { vote: 'YES' }
    },
    enabled: true,
    priority: 1
  }
];

// Apply rules to proposal
const ruleResult = await aiEngine.analyzeWithRules(
  { text: 'This proposal will fund developer grants for ecosystem growth' },
  votingRules
);

console.log('Rule Decision:', ruleResult.decision);
// Output: { action: 'EXECUTE', confidence: 92, reasoning: ['Rule "Support Developer Ecosystem" triggered'] }
```

## 🔧 Configuration Options

### Engine Types

```typescript
// Basic Engine - Core plugins only
const basicEngine = await createBasicEngine({
  logLevel: 'info',
  enableCaching: true,
  enableRateLimit: true
});

// Enhanced Engine - With AI providers
const enhancedEngine = await createEnhancedEngine({
  openaiApiKey: 'sk-...',
  anthropicApiKey: 'your-key',
  environment: 'production'
});

// Production Engine - Optimized for scale
const productionEngine = await createProductionEngine({
  openaiApiKey: 'sk-...',
  logLevel: 'info',
  customConfig: {
    rateLimiting: {
      requestsPerMinute: 200,
      requestsPerHour: 2000
    }
  }
});

// Lightweight Engine - Minimal footprint
const lightEngine = await createLightweightEngine();
```

### Custom Configuration

```typescript
import { createAIEngine, DEFAULT_CONFIG } from '@metapilot/ai-engine';

const customConfig = {
  ...DEFAULT_CONFIG,
  environment: 'production',
  logLevel: 'warn',
  
  // Provider settings
  providers: {
    openai: {
      apiKey: 'your-key',
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000
    }
  },
  
  // Performance settings
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 10000
  },
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 100,
    requestsPerHour: 1000
  },
  
  // Feature flags
  features: {
    learningEnabled: true,
    fallbackEnabled: true,
    streamingEnabled: true,
    multiProviderEnabled: true
  }
};

const engine = await createAIEngine(customConfig);
```

## 🔌 Plugin System

### Core Plugins

#### NLP Analyzer
Advanced natural language processing for text analysis:

```typescript
// Automatic sentiment analysis
const sentimentResult = await engine.analyze('sentiment', {
  text: 'This proposal is excellent and will benefit everyone!'
});

// Extract entities and topics
const textResult = await engine.analyze('text', {
  text: 'John from Ethereum Foundation discussed DeFi protocols in NYC'
});
console.log(textResult.decision.metadata.entities);
// Output: [{ text: 'John', type: 'person' }, { text: 'Ethereum Foundation', type: 'organization' }]
```

#### Proposal Analyzer
Specialized DAO governance proposal analysis:

```typescript
const proposalAnalysis = await engine.analyze('proposal', {
  proposalId: 'uniswap-123',
  daoName: 'Uniswap',
  proposalText: 'Proposal to adjust fee structure...',
  proposalType: 'technical'
});

console.log(proposalAnalysis.decision.metadata);
// Output: {
//   proposalType: 'technical',
//   riskAssessment: { level: 'medium', factors: [...] },
//   stakeholderImpact: { users: 'high', developers: 'medium' },
//   implementationFeasibility: { score: 0.8, level: 'high' }
// }
```

#### OpenAI Enhanced Analyzer
Advanced reasoning with GPT models:

```typescript
const enhancedAnalysis = await engine.analyze('contextual', {
  text: 'Complex multi-faceted proposal...',
  data: { historicalVotes: [...], marketData: {...} }
}, {
  previousDecisions: [...],
  userPreferences: {...}
});
```

### Custom Plugins

```typescript
import { AnalyzerPlugin } from '@metapilot/ai-engine';

class CustomMarketAnalyzer implements AnalyzerPlugin {
  name = 'market-analyzer';
  version = '1.0.0';
  supportedTypes = ['market', 'price', 'trading'];
  
  async analyze(request) {
    // Your custom analysis logic
    return {
      success: true,
      decision: {
        action: 'EXECUTE',
        confidence: 85,
        reasoning: ['Market conditions favorable'],
        metadata: { marketTrend: 'bullish' },
        riskAssessment: { level: 'low', factors: [] }
      },
      processingTime: 150,
      provider: this.name
    };
  }
}

// Load custom plugin
await engine.loadPlugin('market-analyzer', new CustomMarketAnalyzer());
```

## 📊 Learning and Adaptation

### Recording Outcomes

```typescript
// Record actual outcomes for learning
engine.recordLearning({
  userId: 'user-123',
  sessionId: 'session-456',
  requestId: 'request-789',
  decision: aiDecision,
  actualOutcome: {
    success: true,
    metrics: { gasUsed: 21000, executionTime: 15000 },
    timestamp: Date.now()
  },
  userFeedback: {
    rating: 5,
    correctness: 'correct',
    helpfulness: 'very_helpful'
  },
  timestamp: Date.now(),
  context: { blockchain: 'ethereum' }
});
```

### Learning Insights

```typescript
// Get user-specific learning data
const userLearning = engine.getUserLearningData('user-123');

// Get system-wide insights
const insights = engine.getSystemLearningInsights();
console.log(insights);
// Output: {
//   totalSessions: 1500,
//   avgConfidence: 82.5,
//   successRate: 87.3,
//   topFailureReasons: ['Gas price too high', 'Proposal rejected'],
//   userFeedbackStats: { avgRating: 4.2, correctnessStats: {...} }
// }
```

## 🎯 Use Cases

### 1. DAO Voting Automation

```typescript
// MetaPilot DAO voting integration
const votingDecision = await aiEngine.analyzeWithRules(
  {
    proposalId: 'compound-prop-123',
    daoName: 'Compound',
    proposalText: proposalContent
  },
  userVotingRules,
  {
    blockchain: 'ethereum',
    userHistory: previousVotes,
    marketConditions: currentMarket
  }
);

if (votingDecision.decision.action === 'EXECUTE') {
  // Execute vote through smart contract
  await executeVote(proposalId, votingDecision.decision.metadata.vote);
}
```

### 2. Transaction Timing Optimization

```typescript
// Gas optimization for swaps
const gasAnalysis = await aiEngine.analyze('transaction', {
  transactionType: 'swap',
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1.5',
  gasSettings: { maxGas: 50, priority: 'standard' }
}, {
  marketConditions: realTimeGasData,
  timeframe: '1h'
});

if (gasAnalysis.decision.action === 'WAIT') {
  console.log('Waiting for better gas conditions...');
  // Set up monitoring for optimal execution time
}
```

### 3. Cross-Chain Decision Making

```typescript
// Solana program analysis
const solanaAnalysis = await aiEngine.analyze('proposal', {
  proposalId: 'marinade-123',
  daoName: 'Marinade Finance',
  proposalText: 'Adjust staking rewards parameters...'
}, {
  blockchain: 'solana',
  protocol: 'marinade'
});

// Ethereum DAO analysis
const ethereumAnalysis = await aiEngine.analyze('proposal', {
  proposalId: 'uniswap-456',
  daoName: 'Uniswap',
  proposalText: 'Deploy V4 on new L2...'
}, {
  blockchain: 'ethereum',
  protocol: 'uniswap'
});
```

## 🚀 Performance and Monitoring

### Performance Metrics

```typescript
// Get engine status
const status = engine.getStatus();
console.log(status);
// Output: {
//   initialized: true,
//   pluginsLoaded: 5,
//   rulesActive: 12,
//   cacheSize: { keys: 150, hits: 89, misses: 61 },
//   learningDataPoints: 1250,
//   rateLimitStatus: { requestsThisMinute: 15, requestsThisHour: 450 }
// }

// Performance monitoring
engine.addEventListener('analysis_completed', (event) => {
  console.log(`Analysis ${event.requestId} completed in ${event.processingTime}ms`);
});

engine.addEventListener('analysis_failed', (event) => {
  console.log(`Analysis ${event.requestId} failed: ${event.error}`);
});
```

### Error Handling

```typescript
try {
  const result = await engine.analyze('proposal', proposalData);
  
  if (!result.success) {
    console.error('Analysis failed:', result.error);
    
    // Try fallback strategy
    const fallbackResult = await engine.analyze(
      'proposal', 
      proposalData, 
      {}, 
      { fallbackStrategy: 'basic' }
    );
  }
} catch (error) {
  console.error('Engine error:', error);
  
  // Handle rate limiting
  if (error.message.includes('rate limit')) {
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="NLP Analyzer"

# Watch mode for development
npm run test:watch
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Multi-component interaction testing
- **Performance Tests**: Load and timing validation
- **End-to-End Tests**: Complete workflow validation

### Example Test

```typescript
import { createTestEngine } from '@metapilot/ai-engine';

describe('Custom Analysis Flow', () => {
  let engine;

  beforeEach(async () => {
    engine = await createTestEngine();
  });

  test('should analyze proposal and return decision', async () => {
    const result = await engine.analyze('proposal', {
      proposalText: 'Fund developer grants',
      proposalId: 'test-123'
    });

    expect(result.success).toBe(true);
    expect(result.decision.confidence).toBeGreaterThan(50);
    expect(result.decision.reasoning).toHaveLength(1);
  });
});
```

## 📖 API Reference

### Core Classes

#### AIEngine
Main engine class for analysis and decision making.

```typescript
class AIEngine {
  // Initialize the engine
  async initialize(): Promise<void>
  
  // Main analysis method
  async analyze(
    type: string,
    input: AnalysisInput,
    context?: AnalysisContext,
    options?: AnalysisOptions
  ): Promise<AnalysisResult>
  
  // Rule-based analysis
  async analyzeWithRules(
    input: AnalysisInput,
    rules: Rule[],
    context?: AnalysisContext
  ): Promise<AnalysisResult>
  
  // Plugin management
  async loadPlugin(name: string, plugin: AnalyzerPlugin): Promise<void>
  unloadPlugin(name: string): boolean
  getLoadedPlugins(): string[]
  
  // Learning system
  recordLearning(data: LearningData): void
  getUserLearningData(userId: string): LearningData[]
  getSystemLearningInsights(): any
  
  // Status and monitoring
  getStatus(): any
  addEventListener(event: string, handler: EventHandler): void
  
  // Cleanup
  async shutdown(): Promise<void>
}
```

#### AnalyzerPlugin Interface

```typescript
interface AnalyzerPlugin {
  name: string;
  version: string;
  supportedTypes: string[];
  supportedBlockchains?: string[];
  
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
  validate?(request: AnalysisRequest): boolean;
  
  metadata?: PluginMetadata;
}
```

### Type Definitions

#### AIDecision
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

#### AnalysisRequest
```typescript
interface AnalysisRequest {
  id: string;
  type: string;
  input: AnalysisInput;
  context: AnalysisContext;
  options: AnalysisOptions;
  timestamp: number;
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/metapilot/ai-engine.git
cd ai-engine

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Plugin Development

Create custom analyzers by implementing the `AnalyzerPlugin` interface:

```typescript
export class YourCustomAnalyzer implements AnalyzerPlugin {
  name = 'your-analyzer';
  version = '1.0.0';
  supportedTypes = ['your-type'];
  
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    // Your analysis logic here
  }
  
  validate(request: AnalysisRequest): boolean {
    // Validation logic
  }
}
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.metapilot.ai/ai-engine](https://docs.metapilot.ai/ai-engine)
- **GitHub Issues**: [Report bugs and request features](https://github.com/metapilot/ai-engine/issues)
- **Discord**: [Join our community](https://discord.gg/metapilot)
- **Email**: support@metapilot.ai

---

**Built with ❤️ by the MetaPilot Team**

*Empowering the future of Web3 automation through intelligent AI decision-making.*
# Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the MetaPilot AI Engine into various applications, frameworks, and environments. Whether you're building a React frontend, Node.js backend, or integrating with blockchain applications, this guide covers all the essential integration patterns.

## Table of Contents

- [Frontend Integration](#frontend-integration)
- [Backend Integration](#backend-integration)
- [Blockchain Integration](#blockchain-integration)
- [Framework-Specific Guides](#framework-specific-guides)
- [API Integration](#api-integration)
- [Real-time Integration](#real-time-integration)
- [Production Deployment](#production-deployment)
- [Performance Optimization](#performance-optimization)

## Frontend Integration

### React Integration

#### React Hook Implementation

```typescript
// hooks/useAIAnalysis.ts
import { useState, useEffect, useCallback } from 'react';
import { AIEngine, AnalysisResult } from '@metapilot/ai-engine';

interface UseAIAnalysisOptions {
  priority?: 'low' | 'medium' | 'high';
  realtime?: boolean;
  autoAnalyze?: boolean;
}

interface UseAIAnalysisReturn {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (type: string, input: any, context?: any) => Promise<void>;
  clearAnalysis: () => void;
}

export const useAIAnalysis = (
  aiEngine: AIEngine,
  options: UseAIAnalysisOptions = {}
): UseAIAnalysisReturn => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (
    type: string,
    input: any,
    context: any = {}
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiEngine.analyze(
        type,
        input,
        context,
        { priority: options.priority || 'medium' }
      );

      setAnalysis(result);
      
      if (!result.success) {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiEngine, options.priority]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyze,
    clearAnalysis
  };
};
```

#### React Context Provider

```typescript
// context/AIEngineContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AIEngine, createEnhancedEngine } from '@metapilot/ai-engine';

interface AIEngineContextType {
  aiEngine: AIEngine | null;
  isInitialized: boolean;
  error: string | null;
}

const AIEngineContext = createContext<AIEngineContextType>({
  aiEngine: null,
  isInitialized: false,
  error: null
});

interface AIEngineProviderProps {
  children: ReactNode;
  config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    environment?: 'development' | 'production';
  };
}

export const AIEngineProvider: React.FC<AIEngineProviderProps> = ({
  children,
  config
}) => {
  const [aiEngine, setAIEngine] = useState<AIEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeEngine = async () => {
      try {
        const engine = await createEnhancedEngine({
          ...config,
          logLevel: config.environment === 'development' ? 'debug' : 'info'
        });

        setAIEngine(engine);
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AI engine';
        setError(errorMessage);
      }
    };

    initializeEngine();

    return () => {
      if (aiEngine) {
        aiEngine.shutdown();
      }
    };
  }, []);

  return (
    <AIEngineContext.Provider value={{ aiEngine, isInitialized, error }}>
      {children}
    </AIEngineContext.Provider>
  );
};

export const useAIEngine = () => {
  const context = useContext(AIEngineContext);
  if (!context) {
    throw new Error('useAIEngine must be used within an AIEngineProvider');
  }
  return context;
};
```

#### Component Examples

```typescript
// components/ProposalAnalyzer.tsx
import React, { useState } from 'react';
import { useAIEngine } from '../context/AIEngineContext';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

interface ProposalAnalyzerProps {
  proposalId: string;
  proposalText: string;
  daoName: string;
}

export const ProposalAnalyzer: React.FC<ProposalAnalyzerProps> = ({
  proposalId,
  proposalText,
  daoName
}) => {
  const { aiEngine } = useAIEngine();
  const { analysis, isAnalyzing, error, analyze } = useAIAnalysis(aiEngine!);
  const [userRules, setUserRules] = useState([]);

  const handleAnalyze = async () => {
    if (!aiEngine) return;

    await analyze('proposal', {
      proposalId,
      proposalText,
      daoName,
      proposalType: 'treasury'
    }, {
      blockchain: 'ethereum',
      userRules
    });
  };

  if (!aiEngine) {
    return <div>Initializing AI Engine...</div>;
  }

  return (
    <div className="proposal-analyzer">
      <h3>AI Proposal Analysis</h3>
      
      <button 
        onClick={handleAnalyze} 
        disabled={isAnalyzing}
        className="analyze-button"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Proposal'}
      </button>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {analysis && analysis.success && (
        <div className="analysis-results">
          <h4>Analysis Results</h4>
          
          <div className="decision">
            <strong>Recommended Action:</strong> {analysis.decision?.action}
          </div>
          
          <div className="confidence">
            <strong>Confidence:</strong> {analysis.decision?.confidence}%
          </div>
          
          <div className="reasoning">
            <strong>Reasoning:</strong>
            <ul>
              {analysis.decision?.reasoning.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
          
          {analysis.decision?.metadata && (
            <div className="metadata">
              <strong>Details:</strong>
              <pre>{JSON.stringify(analysis.decision.metadata, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

```typescript
// components/RealTimeAnalyzer.tsx
import React, { useEffect, useState } from 'react';
import { useAIEngine } from '../context/AIEngineContext';

export const RealTimeAnalyzer: React.FC = () => {
  const { aiEngine } = useAIEngine();
  const [inputText, setInputText] = useState('');
  const [sentiment, setSentiment] = useState<any>(null);

  // Real-time sentiment analysis
  useEffect(() => {
    if (!aiEngine || !inputText.trim()) {
      setSentiment(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const result = await aiEngine.analyze('sentiment', {
          text: inputText
        });

        if (result.success) {
          setSentiment(result.decision?.metadata);
        }
      } catch (error) {
        console.error('Real-time analysis failed:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [inputText, aiEngine]);

  return (
    <div className="realtime-analyzer">
      <h3>Real-time Sentiment Analysis</h3>
      
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your text here for real-time analysis..."
        className="input-textarea"
      />

      {sentiment && (
        <div className="sentiment-display">
          <div className="sentiment-score">
            Sentiment: {sentiment.normalizedScore > 0 ? 'Positive' : 'Negative'}
          </div>
          <div className="sentiment-intensity">
            Intensity: {Math.abs(sentiment.normalizedScore * 100).toFixed(1)}%
          </div>
          {sentiment.emotions && (
            <div className="emotions">
              Emotions: {sentiment.emotions.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Vue.js Integration

```typescript
// composables/useAIAnalysis.ts
import { ref, computed } from 'vue';
import { AIEngine, AnalysisResult } from '@metapilot/ai-engine';

export const useAIAnalysis = (aiEngine: AIEngine) => {
  const analysis = ref<AnalysisResult | null>(null);
  const isAnalyzing = ref(false);
  const error = ref<string | null>(null);

  const analyze = async (type: string, input: any, context: any = {}) => {
    isAnalyzing.value = true;
    error.value = null;

    try {
      const result = await aiEngine.analyze(type, input, context);
      analysis.value = result;
      
      if (!result.success) {
        error.value = result.error || 'Analysis failed';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      analysis.value = null;
    } finally {
      isAnalyzing.value = false;
    }
  };

  const clearAnalysis = () => {
    analysis.value = null;
    error.value = null;
  };

  const hasResults = computed(() => analysis.value?.success === true);
  const decision = computed(() => analysis.value?.decision);

  return {
    analysis: readonly(analysis),
    isAnalyzing: readonly(isAnalyzing),
    error: readonly(error),
    hasResults,
    decision,
    analyze,
    clearAnalysis
  };
};
```

## Backend Integration

### Express.js API Server

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProductionEngine, AIEngine } from '@metapilot/ai-engine';
import { aiAnalysisRouter } from './routes/ai-analysis';
import { authMiddleware } from './middleware/auth';

class AIAnalysisServer {
  private app: express.Application;
  private aiEngine: AIEngine | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      const status = this.aiEngine?.getStatus();
      res.json({
        status: 'ok',
        aiEngine: {
          initialized: status?.initialized || false,
          pluginsLoaded: status?.pluginsLoaded || 0
        },
        timestamp: new Date().toISOString()
      });
    });

    // AI analysis routes
    this.app.use('/api/ai', authMiddleware, aiAnalysisRouter(this.aiEngine));

    // Error handling
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
  }

  async initialize() {
    try {
      // Initialize AI Engine
      this.aiEngine = await createProductionEngine({
        openaiApiKey: process.env.OPENAI_API_KEY!,
        logLevel: 'info',
        customConfig: {
          rateLimiting: {
            requestsPerMinute: 200,
            requestsPerHour: 2000
          }
        }
      });

      console.log('AI Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Engine:', error);
      throw error;
    }
  }

  async start(port: number = 3001) {
    await this.initialize();
    
    this.app.listen(port, () => {
      console.log(`AI Analysis Server running on port ${port}`);
    });
  }

  async shutdown() {
    if (this.aiEngine) {
      await this.aiEngine.shutdown();
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.shutdown();
  process.exit(0);
});

const server = new AIAnalysisServer();
server.start(parseInt(process.env.PORT || '3001'));
```

### API Routes

```typescript
// routes/ai-analysis.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AIEngine } from '@metapilot/ai-engine';

export const aiAnalysisRouter = (aiEngine: AIEngine | null) => {
  const router = Router();

  // Middleware to check AI engine availability
  const checkAIEngine = (req: any, res: any, next: any) => {
    if (!aiEngine) {
      return res.status(503).json({
        error: 'AI Engine not available',
        message: 'The AI engine is not initialized'
      });
    }
    next();
  };

  // Validation middleware
  const validateAnalysisRequest = [
    body('type').isString().notEmpty().withMessage('Analysis type is required'),
    body('input').isObject().withMessage('Input data is required'),
    body('context').optional().isObject(),
    body('options').optional().isObject()
  ];

  // Basic analysis endpoint
  router.post('/analyze', 
    checkAIEngine,
    validateAnalysisRequest,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
          });
        }

        const { type, input, context = {}, options = {} } = req.body;
        
        // Add user context
        const analysisContext = {
          ...context,
          userId: req.user?.id,
          timestamp: Date.now()
        };

        const result = await aiEngine!.analyze(type, input, analysisContext, options);

        res.json({
          success: true,
          result,
          meta: {
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
          error: 'Analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Rule-based analysis endpoint
  router.post('/analyze-with-rules',
    checkAIEngine,
    [
      body('input').isObject().withMessage('Input data is required'),
      body('rules').isArray().withMessage('Rules array is required'),
      body('context').optional().isObject()
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
          });
        }

        const { input, rules, context = {} } = req.body;

        const result = await aiEngine!.analyzeWithRules(input, rules, {
          ...context,
          userId: req.user?.id
        });

        res.json({
          success: true,
          result,
          meta: {
            rulesApplied: rules.length,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('Rule-based analysis error:', error);
        res.status(500).json({
          error: 'Rule-based analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Batch analysis endpoint
  router.post('/analyze-batch',
    checkAIEngine,
    [
      body('requests').isArray().withMessage('Requests array is required'),
      body('requests.*').isObject()
    ],
    async (req, res) => {
      try {
        const { requests } = req.body;
        
        if (requests.length > 10) {
          return res.status(400).json({
            error: 'Batch size too large',
            message: 'Maximum 10 requests per batch'
          });
        }

        const results = await Promise.allSettled(
          requests.map((request: any) =>
            aiEngine!.analyze(
              request.type,
              request.input,
              { ...request.context, userId: req.user?.id },
              request.options
            )
          )
        );

        const formattedResults = results.map((result, index) => ({
          index,
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason.message : null
        }));

        res.json({
          success: true,
          results: formattedResults,
          meta: {
            totalRequests: requests.length,
            successfulRequests: formattedResults.filter(r => r.success).length
          }
        });

      } catch (error) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
          error: 'Batch analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Learning feedback endpoint
  router.post('/feedback',
    checkAIEngine,
    [
      body('requestId').isString().notEmpty(),
      body('decision').isObject(),
      body('actualOutcome').isObject(),
      body('userFeedback').optional().isObject()
    ],
    async (req, res) => {
      try {
        const { requestId, decision, actualOutcome, userFeedback } = req.body;

        aiEngine!.recordLearning({
          userId: req.user?.id || 'anonymous',
          sessionId: req.sessionID,
          requestId,
          decision,
          actualOutcome,
          userFeedback,
          timestamp: Date.now(),
          context: {}
        });

        res.json({
          success: true,
          message: 'Feedback recorded successfully'
        });

      } catch (error) {
        console.error('Feedback recording error:', error);
        res.status(500).json({
          error: 'Failed to record feedback',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Engine status endpoint
  router.get('/status', checkAIEngine, (req, res) => {
    const status = aiEngine!.getStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  });

  return router;
};
```

## Blockchain Integration

### Web3 Integration with ethers.js

```typescript
// integrations/web3-integration.ts
import { ethers } from 'ethers';
import { AIEngine } from '@metapilot/ai-engine';

export class Web3AIIntegration {
  private provider: ethers.providers.Provider;
  private aiEngine: AIEngine;
  private wallet?: ethers.Wallet;

  constructor(
    provider: ethers.providers.Provider,
    aiEngine: AIEngine,
    privateKey?: string
  ) {
    this.provider = provider;
    this.aiEngine = aiEngine;
    
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, provider);
    }
  }

  async analyzeDAOProposal(
    daoAddress: string,
    proposalId: string,
    userRules: any[]
  ): Promise<{
    analysis: any;
    recommendation: string;
    gasEstimate?: ethers.BigNumber;
  }> {
    // Get proposal data from blockchain
    const proposalData = await this.getProposalData(daoAddress, proposalId);
    
    // Analyze with AI engine
    const analysis = await this.aiEngine.analyzeWithRules(
      {
        proposalId,
        daoName: proposalData.daoName,
        proposalText: proposalData.description,
        proposalType: proposalData.type
      },
      userRules,
      {
        blockchain: 'ethereum',
        contract: daoAddress,
        proposalData,
        marketConditions: await this.getMarketConditions()
      }
    );

    // Estimate gas for voting
    let gasEstimate;
    if (this.wallet && analysis.success && analysis.decision?.action === 'EXECUTE') {
      try {
        gasEstimate = await this.estimateVotingGas(daoAddress, proposalId, true);
      } catch (error) {
        console.warn('Gas estimation failed:', error);
      }
    }

    return {
      analysis: analysis.decision,
      recommendation: this.formatRecommendation(analysis),
      gasEstimate
    };
  }

  async executeVote(
    daoAddress: string,
    proposalId: string,
    support: boolean,
    maxGasPrice?: ethers.BigNumber
  ): Promise<ethers.ContractTransaction> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    // Get DAO contract
    const daoContract = new ethers.Contract(
      daoAddress,
      ['function castVote(uint256 proposalId, uint8 support) external'],
      this.wallet
    );

    // Execute vote with gas optimization
    const gasLimit = await daoContract.estimateGas.castVote(proposalId, support ? 1 : 0);
    
    const tx = await daoContract.castVote(proposalId, support ? 1 : 0, {
      gasLimit: gasLimit.mul(110).div(100), // 10% buffer
      maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
      maxFeePerGas: maxGasPrice || ethers.utils.parseUnits('50', 'gwei')
    });

    return tx;
  }

  private async getProposalData(daoAddress: string, proposalId: string): Promise<any> {
    // Implementation depends on DAO contract interface
    // This is a simplified example
    const daoContract = new ethers.Contract(
      daoAddress,
      [
        'function proposals(uint256) view returns (string description, uint256 startTime, uint256 endTime)',
        'function name() view returns (string)'
      ],
      this.provider
    );

    const [description, startTime, endTime] = await daoContract.proposals(proposalId);
    const daoName = await daoContract.name();

    return {
      daoName,
      description,
      startTime: startTime.toNumber(),
      endTime: endTime.toNumber(),
      type: this.inferProposalType(description)
    };
  }

  private async getMarketConditions(): Promise<any> {
    // Get current ETH price and market data
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      return {
        ethPrice: data.ethereum.usd,
        priceChange24h: data.ethereum.usd_24h_change,
        sentiment: data.ethereum.usd_24h_change > 0 ? 0.6 : 0.4
      };
    } catch (error) {
      console.warn('Failed to get market conditions:', error);
      return {};
    }
  }

  private inferProposalType(description: string): string {
    const text = description.toLowerCase();
    
    if (text.includes('treasury') || text.includes('fund')) return 'treasury';
    if (text.includes('upgrade') || text.includes('technical')) return 'technical';
    if (text.includes('governance') || text.includes('parameter')) return 'governance';
    
    return 'other';
  }

  private async estimateVotingGas(
    daoAddress: string,
    proposalId: string,
    support: boolean
  ): Promise<ethers.BigNumber> {
    if (!this.wallet) {
      throw new Error('Wallet required for gas estimation');
    }

    const daoContract = new ethers.Contract(
      daoAddress,
      ['function castVote(uint256 proposalId, uint8 support) external'],
      this.wallet
    );

    return await daoContract.estimateGas.castVote(proposalId, support ? 1 : 0);
  }

  private formatRecommendation(analysis: any): string {
    if (!analysis.success) {
      return 'Analysis failed - manual review required';
    }

    const { action, confidence, reasoning } = analysis.decision;
    
    switch (action) {
      case 'EXECUTE':
        return `Recommend ${confidence > 80 ? 'STRONG' : ''} VOTE (${confidence}% confidence): ${reasoning[0]}`;
      case 'WAIT':
        return `Recommend WAIT (${confidence}% confidence): ${reasoning[0]}`;
      case 'SKIP':
        return `Recommend ABSTAIN (${confidence}% confidence): ${reasoning[0]}`;
      default:
        return `Recommend DELEGATE to human (${confidence}% confidence): ${reasoning[0]}`;
    }
  }
}
```

### Solana Integration

```typescript
// integrations/solana-integration.ts
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { AIEngine } from '@metapilot/ai-engine';

export class SolanaAIIntegration {
  private connection: Connection;
  private aiEngine: AIEngine;

  constructor(connection: Connection, aiEngine: AIEngine) {
    this.connection = connection;
    this.aiEngine = aiEngine;
  }

  async analyzeGovernanceProposal(
    governanceProgram: PublicKey,
    proposalAccount: PublicKey,
    userRules: any[]
  ): Promise<any> {
    // Get proposal data from Solana
    const proposalData = await this.getProposalData(proposalAccount);
    
    // Analyze with AI engine
    const analysis = await this.aiEngine.analyzeWithRules(
      {
        proposalId: proposalAccount.toString(),
        proposalText: proposalData.description,
        proposalType: proposalData.proposalType
      },
      userRules,
      {
        blockchain: 'solana',
        program: governanceProgram.toString(),
        proposal: proposalAccount.toString(),
        slot: await this.connection.getSlot()
      }
    );

    return analysis;
  }

  private async getProposalData(proposalAccount: PublicKey): Promise<any> {
    // Fetch and parse proposal account data
    const accountInfo = await this.connection.getAccountInfo(proposalAccount);
    
    if (!accountInfo) {
      throw new Error('Proposal account not found');
    }

    // Parse proposal data (simplified - actual implementation depends on governance program)
    return {
      description: 'Parsed proposal description',
      proposalType: 'governance'
    };
  }
}
```

## Framework-Specific Guides

### Next.js Integration

```typescript
// pages/api/ai/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createEnhancedEngine } from '@metapilot/ai-engine';

// Initialize AI engine (consider using a singleton or caching)
let aiEngine: any = null;

const getAIEngine = async () => {
  if (!aiEngine) {
    aiEngine = await createEnhancedEngine({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      logLevel: 'info'
    });
  }
  return aiEngine;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, input, context = {} } = req.body;
    
    const engine = await getAIEngine();
    const result = await engine.analyze(type, input, context);

    res.status(200).json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### NestJS Integration

```typescript
// ai-analysis.module.ts
import { Module } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysisController } from './ai-analysis.controller';

@Module({
  providers: [AIAnalysisService],
  controllers: [AIAnalysisController],
  exports: [AIAnalysisService]
})
export class AIAnalysisModule {}

// ai-analysis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIEngine, createEnhancedEngine } from '@metapilot/ai-engine';

@Injectable()
export class AIAnalysisService implements OnModuleInit, OnModuleDestroy {
  private aiEngine: AIEngine | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.aiEngine = await createEnhancedEngine({
      openaiApiKey,
      logLevel: this.configService.get('NODE_ENV') === 'development' ? 'debug' : 'info'
    });
  }

  async onModuleDestroy() {
    if (this.aiEngine) {
      await this.aiEngine.shutdown();
    }
  }

  async analyze(type: string, input: any, context: any = {}) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not initialized');
    }

    return await this.aiEngine.analyze(type, input, context);
  }

  getStatus() {
    return this.aiEngine?.getStatus() || { initialized: false };
  }
}

// ai-analysis.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';

@Controller('ai')
export class AIAnalysisController {
  constructor(private aiAnalysisService: AIAnalysisService) {}

  @Post('analyze')
  async analyze(@Body() body: { type: string; input: any; context?: any }) {
    const { type, input, context = {} } = body;
    const result = await this.aiAnalysisService.analyze(type, input, context);
    
    return {
      success: true,
      result,
      timestamp: new Date().toISOString()
    };
  }

  @Get('status')
  getStatus() {
    return this.aiAnalysisService.getStatus();
  }
}
```

## Real-time Integration

### WebSocket Integration

```typescript
// websocket-server.ts
import { WebSocketServer } from 'ws';
import { createEnhancedEngine, AIEngine } from '@metapilot/ai-engine';

interface WebSocketMessage {
  id: string;
  type: 'analysis_request' | 'analysis_response' | 'error';
  payload: any;
}

export class AIWebSocketServer {
  private wss: WebSocketServer;
  private aiEngine: AIEngine | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketHandlers();
  }

  async initialize() {
    this.aiEngine = await createEnhancedEngine({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      logLevel: 'info'
    });
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      // Send welcome message
      this.sendMessage(ws, {
        id: 'welcome',
        type: 'analysis_response',
        payload: { message: 'Connected to AI Analysis Service' }
      });
    });
  }

  private async handleMessage(ws: any, message: WebSocketMessage) {
    switch (message.type) {
      case 'analysis_request':
        await this.handleAnalysisRequest(ws, message);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleAnalysisRequest(ws: any, message: WebSocketMessage) {
    if (!this.aiEngine) {
      this.sendError(ws, 'AI Engine not initialized');
      return;
    }

    try {
      const { type, input, context = {} } = message.payload;
      
      // Start analysis
      this.sendMessage(ws, {
        id: message.id,
        type: 'analysis_response',
        payload: { status: 'started' }
      });

      const result = await this.aiEngine.analyze(type, input, context);

      // Send results
      this.sendMessage(ws, {
        id: message.id,
        type: 'analysis_response',
        payload: { status: 'completed', result }
      });

    } catch (error) {
      this.sendError(ws, error instanceof Error ? error.message : 'Analysis failed', message.id);
    }
  }

  private sendMessage(ws: any, message: WebSocketMessage) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: any, error: string, id?: string) {
    this.sendMessage(ws, {
      id: id || 'error',
      type: 'error',
      payload: { error }
    });
  }
}

// Usage
const wsServer = new AIWebSocketServer(8080);
await wsServer.initialize();
```

### Real-time React Component

```typescript
// components/RealtimeAnalysis.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface RealtimeAnalysisProps {
  wsUrl: string;
}

export const RealtimeAnalysis: React.FC<RealtimeAnalysisProps> = ({ wsUrl }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      setConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'analysis_response' && message.payload.result) {
        setAnalysis(message.payload.result);
      }
    };

    websocket.onclose = () => {
      setConnected(false);
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, [wsUrl]);

  const requestAnalysis = useCallback(() => {
    if (!ws || !connected || !inputText.trim()) return;

    const message = {
      id: `analysis-${Date.now()}`,
      type: 'analysis_request',
      payload: {
        type: 'sentiment',
        input: { text: inputText },
        context: {}
      }
    };

    ws.send(JSON.stringify(message));
  }, [ws, connected, inputText]);

  return (
    <div className="realtime-analysis">
      <div className="connection-status">
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text for real-time analysis..."
      />

      <button onClick={requestAnalysis} disabled={!connected}>
        Analyze
      </button>

      {analysis && (
        <div className="analysis-results">
          <h4>Analysis Results</h4>
          <pre>{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

## Production Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY meta-pilot-ai-engine/package*.json ./meta-pilot-ai-engine/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aiengine -u 1001

# Change ownership and switch to non-root user
RUN chown -R aiengine:nodejs /app
USER aiengine

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-engine-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - ai-engine-api
    restart: unless-stopped

volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-engine-api
  labels:
    app: ai-engine-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-engine-api
  template:
    metadata:
      labels:
        app: ai-engine-api
    spec:
      containers:
      - name: ai-engine-api
        image: metapilot/ai-engine-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ai-engine-service
spec:
  selector:
    app: ai-engine-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: LoadBalancer
```

This comprehensive integration guide provides all the necessary patterns and examples for integrating the MetaPilot AI Engine into various applications and environments.
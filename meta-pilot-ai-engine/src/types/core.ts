/**
 * Core AI Engine Types - Flexible and Extensible
 * Designed for Web3 automation projects like MetaPilot
 */

import { z } from 'zod';

// ==================== FOUNDATIONAL TYPES ====================

export type Blockchain = 'ethereum' | 'solana' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | string;
export type AnalysisType = 'proposal' | 'transaction' | 'market' | 'sentiment' | 'risk' | 'timing' | string;
export type ConfidenceLevel = number; // 0-100
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ==================== CONTEXT TYPES ====================

export interface AnalysisContext {
  blockchain?: Blockchain;
  protocol?: string;
  timeframe?: string;
  userHistory?: UserHistoryData[];
  marketConditions?: MarketData;
  customParameters?: Record<string, unknown>;
}

export interface UserHistoryData {
  timestamp: number;
  action: string;
  outcome: 'success' | 'failure' | 'pending';
  metadata?: Record<string, unknown>;
}

export interface MarketData {
  timestamp: number;
  prices?: Record<string, number>;
  volumes?: Record<string, number>;
  volatility?: Record<string, number>;
  sentiment?: number; // -1 to 1
  networkMetrics?: NetworkMetrics;
}

export interface NetworkMetrics {
  gasPrice?: number;
  congestion?: number; // 0-1
  activeUsers?: number;
  transactionVolume?: number;
}

// ==================== DECISION FRAMEWORK ====================

export const DecisionSchema = z.object({
  action: z.enum(['EXECUTE', 'WAIT', 'SKIP', 'DELEGATE', 'ALERT']),
  confidence: z.number().min(0).max(100),
  reasoning: z.array(z.string()),
  metadata: z.record(z.unknown()),
  alternatives: z.array(z.object({
    action: z.string(),
    reasoning: z.string(),
    confidence: z.number()
  })).optional(),
  riskAssessment: z.object({
    level: z.enum(['low', 'medium', 'high', 'critical']),
    factors: z.array(z.string()),
    mitigations: z.array(z.string()).optional()
  }),
  executionPlan: z.object({
    steps: z.array(z.string()),
    estimatedTime: z.string(),
    requirements: z.array(z.string()).optional()
  }).optional()
});

export type AIDecision = z.infer<typeof DecisionSchema>;

// ==================== ANALYSIS REQUEST ====================

export interface AnalysisRequest {
  id: string;
  type: AnalysisType;
  input: AnalysisInput;
  context: AnalysisContext;
  options: AnalysisOptions;
  timestamp: number;
}

export interface AnalysisInput {
  // Flexible input that can handle any data type
  text?: string;
  data?: Record<string, unknown>;
  files?: File[];
  urls?: string[];
  rawData?: unknown;
  
  // DAO and proposal-specific fields
  proposalId?: string;
  daoName?: string;
  proposalText?: string;
  proposalType?: string;
  
  // Additional context fields
  [key: string]: unknown;
}

export interface AnalysisOptions {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  fallbackStrategy?: 'basic' | 'cache' | 'skip';
  providers?: string[]; // Which AI providers to use
  caching?: boolean;
  streaming?: boolean;
}

// ==================== RULE SYSTEM ====================

export interface Rule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface RuleCondition {
  type: 'natural_language' | 'logical' | 'composite';
  expression: string;
  parameters?: Record<string, unknown>;
  confidence_threshold?: number;
}

export interface RuleAction {
  type: string;
  parameters: Record<string, unknown>;
  confirmation_required?: boolean;
  conditions?: RuleCondition[];
}

// ==================== PLUGIN SYSTEM ====================

export interface AnalyzerPlugin {
  name: string;
  version: string;
  supportedTypes: AnalysisType[];
  supportedBlockchains?: Blockchain[];
  analyze: (request: AnalysisRequest) => Promise<AnalysisResult>;
  validate?: (request: AnalysisRequest) => boolean;
  metadata?: PluginMetadata;
}

export interface PluginMetadata {
  author: string;
  description: string;
  dependencies?: string[];
  configuration?: Record<string, unknown>;
}

export interface AnalysisResult {
  success: boolean;
  decision?: AIDecision;
  data?: Record<string, unknown>;
  error?: string;
  processingTime: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

// ==================== WEB3 SPECIFIC TYPES ====================

export interface ProposalAnalysisInput extends AnalysisInput {
  proposalId: string;
  daoName: string;
  proposalText: string;
  votingDeadline: number;
  currentVotes?: {
    for: number;
    against: number;
    abstain?: number;
  };
  proposalType?: 'governance' | 'treasury' | 'technical' | 'social';
}

export interface TransactionAnalysisInput extends AnalysisInput {
  transactionType: 'swap' | 'stake' | 'vote' | 'claim' | 'bridge' | 'lend';
  fromToken?: string;
  toToken?: string;
  amount?: string;
  slippage?: number;
  gasSettings?: {
    maxGas: number;
    gasPrice: number;
    priority: 'slow' | 'standard' | 'fast';
  };
}

export interface MarketAnalysisInput extends AnalysisInput {
  assets: string[];
  timeframe: '1h' | '4h' | '1d' | '1w' | '1m';
  indicators?: string[];
  comparisons?: string[];
}

// ==================== LEARNING SYSTEM ====================

export interface LearningData {
  userId: string;
  sessionId: string;
  requestId: string;
  decision: AIDecision;
  actualOutcome: ExecutionOutcome;
  userFeedback?: UserFeedback;
  timestamp: number;
  context: AnalysisContext;
}

export interface ExecutionOutcome {
  success: boolean;
  actualResult?: unknown;
  metrics?: PerformanceMetrics;
  errors?: string[];
  timestamp: number;
}

export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  correctness: 'correct' | 'incorrect' | 'partially_correct';
  helpfulness: 'helpful' | 'not_helpful' | 'very_helpful';
  comments?: string;
  improvements?: string[];
}

export interface PerformanceMetrics {
  executionTime: number;
  gasUsed?: number;
  slippage?: number;
  priceImpact?: number;
  successRate: number;
  errorRate: number;
}

// ==================== CONFIGURATION ====================

export interface AIEngineConfig {
  // Core settings
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Provider settings
  providers: {
    openai?: {
      apiKey: string;
      model: string;
      maxTokens?: number;
    };
    anthropic?: {
      apiKey: string;
      model: string;
    };
    local?: {
      modelPath: string;
      device?: 'cpu' | 'gpu';
    };
  };
  
  // Performance settings
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  // Feature flags
  features: {
    learningEnabled: boolean;
    fallbackEnabled: boolean;
    streamingEnabled: boolean;
    multiProviderEnabled: boolean;
  };
  
  // Custom settings
  customConfig?: Record<string, unknown>;
}

// ==================== EVENT SYSTEM ====================

export interface AIEvent {
  type: AIEventType;
  timestamp: number;
  data: Record<string, unknown>;
  source: string;
}

export type AIEventType = 
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'decision_made'
  | 'execution_started'
  | 'execution_completed'
  | 'learning_updated'
  | 'plugin_loaded'
  | 'plugin_error'
  | 'custom';

export type EventHandler = (event: AIEvent) => void | Promise<void>;

// ==================== UTILITY TYPES ====================

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId: string;
}

// ==================== ERROR HANDLING ====================

// Re-export error types for convenience
export { 
  AIEngineError, 
  ErrorFactory, 
  ErrorHandler, 
  ERROR_CODES,
  type StandardError,
  type ErrorCode 
} from './errors';

// ==================== EXPORT SCHEMAS ====================

export const AnalysisRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  input: z.object({
    text: z.string().optional(),
    data: z.record(z.unknown()).optional(),
    rawData: z.unknown().optional()
  }),
  context: z.object({
    blockchain: z.string().optional(),
    protocol: z.string().optional(),
    timeframe: z.string().optional(),
    customParameters: z.record(z.unknown()).optional()
  }),
  options: z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    timeout: z.number().optional(),
    fallbackStrategy: z.enum(['basic', 'cache', 'skip']).optional(),
    providers: z.array(z.string()).optional(),
    caching: z.boolean().optional()
  }),
  timestamp: z.number()
});

export const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  condition: z.object({
    type: z.enum(['natural_language', 'logical', 'composite']),
    expression: z.string(),
    parameters: z.record(z.unknown()).optional(),
    confidence_threshold: z.number().min(0).max(100).optional()
  }),
  action: z.object({
    type: z.string(),
    parameters: z.record(z.unknown()),
    confirmation_required: z.boolean().optional(),
    conditions: z.array(z.any()).optional()
  }),
  enabled: z.boolean(),
  priority: z.number(),
  metadata: z.record(z.unknown()).optional()
});

// ==================== TYPE GUARDS ====================

export function isProposalAnalysis(input: AnalysisInput): input is ProposalAnalysisInput {
  return ('proposalId' in input || 'daoName' in input) && ('proposalText' in input || 'text' in input);
}

export function isTransactionAnalysis(input: AnalysisInput): input is TransactionAnalysisInput {
  return 'transactionType' in input;
}

export function isMarketAnalysis(input: AnalysisInput): input is MarketAnalysisInput {
  return 'assets' in input && Array.isArray((input as MarketAnalysisInput).assets);
}

export function isValidDecision(decision: unknown): decision is AIDecision {
  try {
    DecisionSchema.parse(decision);
    return true;
  } catch {
    return false;
  }
}
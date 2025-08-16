/**
 * Core AI Engine Types - Flexible and Extensible
 * Designed for Web3 automation projects like MetaPilot
 */
/// <reference types="node" />
import { z } from 'zod';
export type Blockchain = 'ethereum' | 'solana' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | string;
export type AnalysisType = 'proposal' | 'transaction' | 'market' | 'sentiment' | 'risk' | 'timing' | string;
export type ConfidenceLevel = number;
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
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
    sentiment?: number;
    networkMetrics?: NetworkMetrics;
}
export interface NetworkMetrics {
    gasPrice?: number;
    congestion?: number;
    activeUsers?: number;
    transactionVolume?: number;
}
export declare const DecisionSchema: z.ZodObject<{
    action: z.ZodEnum<["EXECUTE", "WAIT", "SKIP", "DELEGATE", "ALERT"]>;
    confidence: z.ZodNumber;
    reasoning: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        reasoning: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        action: string;
        confidence: number;
        reasoning: string;
    }, {
        action: string;
        confidence: number;
        reasoning: string;
    }>, "many">>;
    riskAssessment: z.ZodObject<{
        level: z.ZodEnum<["low", "medium", "high", "critical"]>;
        factors: z.ZodArray<z.ZodString, "many">;
        mitigations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        level: "low" | "medium" | "high" | "critical";
        factors: string[];
        mitigations?: string[] | undefined;
    }, {
        level: "low" | "medium" | "high" | "critical";
        factors: string[];
        mitigations?: string[] | undefined;
    }>;
    executionPlan: z.ZodOptional<z.ZodObject<{
        steps: z.ZodArray<z.ZodString, "many">;
        estimatedTime: z.ZodString;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        steps: string[];
        estimatedTime: string;
        requirements?: string[] | undefined;
    }, {
        steps: string[];
        estimatedTime: string;
        requirements?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: "EXECUTE" | "WAIT" | "SKIP" | "DELEGATE" | "ALERT";
    confidence: number;
    reasoning: string[];
    metadata: Record<string, unknown>;
    riskAssessment: {
        level: "low" | "medium" | "high" | "critical";
        factors: string[];
        mitigations?: string[] | undefined;
    };
    alternatives?: {
        action: string;
        confidence: number;
        reasoning: string;
    }[] | undefined;
    executionPlan?: {
        steps: string[];
        estimatedTime: string;
        requirements?: string[] | undefined;
    } | undefined;
}, {
    action: "EXECUTE" | "WAIT" | "SKIP" | "DELEGATE" | "ALERT";
    confidence: number;
    reasoning: string[];
    metadata: Record<string, unknown>;
    riskAssessment: {
        level: "low" | "medium" | "high" | "critical";
        factors: string[];
        mitigations?: string[] | undefined;
    };
    alternatives?: {
        action: string;
        confidence: number;
        reasoning: string;
    }[] | undefined;
    executionPlan?: {
        steps: string[];
        estimatedTime: string;
        requirements?: string[] | undefined;
    } | undefined;
}>;
export type AIDecision = z.infer<typeof DecisionSchema>;
export interface AnalysisRequest {
    id: string;
    type: AnalysisType;
    input: AnalysisInput;
    context: AnalysisContext;
    options: AnalysisOptions;
    timestamp: number;
}
export interface AnalysisInput {
    text?: string;
    data?: Record<string, unknown>;
    files?: File[];
    urls?: string[];
    rawData?: unknown;
    proposalId?: string;
    daoName?: string;
    proposalText?: string;
    proposalType?: string;
    [key: string]: unknown;
}
export interface AnalysisOptions {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timeout?: number;
    fallbackStrategy?: 'basic' | 'cache' | 'skip';
    providers?: string[];
    caching?: boolean;
    streaming?: boolean;
}
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
export interface AIEngineConfig {
    environment: 'development' | 'staging' | 'production';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
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
    caching: {
        enabled: boolean;
        ttl: number;
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
    customConfig?: Record<string, unknown>;
}
export interface AIEvent {
    type: AIEventType;
    timestamp: number;
    data: Record<string, unknown>;
    source: string;
}
export type AIEventType = 'analysis_started' | 'analysis_completed' | 'analysis_failed' | 'decision_made' | 'execution_started' | 'execution_completed' | 'learning_updated' | 'plugin_loaded' | 'plugin_error' | 'custom';
export type EventHandler = (event: AIEvent) => void | Promise<void>;
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
export declare const AnalysisRequestSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    input: z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        rawData: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        text?: string | undefined;
        data?: Record<string, unknown> | undefined;
        rawData?: unknown;
    }, {
        text?: string | undefined;
        data?: Record<string, unknown> | undefined;
        rawData?: unknown;
    }>;
    context: z.ZodObject<{
        blockchain: z.ZodOptional<z.ZodString>;
        protocol: z.ZodOptional<z.ZodString>;
        timeframe: z.ZodOptional<z.ZodString>;
        customParameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        timeframe?: string | undefined;
        blockchain?: string | undefined;
        protocol?: string | undefined;
        customParameters?: Record<string, unknown> | undefined;
    }, {
        timeframe?: string | undefined;
        blockchain?: string | undefined;
        protocol?: string | undefined;
        customParameters?: Record<string, unknown> | undefined;
    }>;
    options: z.ZodObject<{
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        timeout: z.ZodOptional<z.ZodNumber>;
        fallbackStrategy: z.ZodOptional<z.ZodEnum<["basic", "cache", "skip"]>>;
        providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        caching: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        priority: "low" | "medium" | "high" | "critical";
        timeout?: number | undefined;
        fallbackStrategy?: "basic" | "cache" | "skip" | undefined;
        providers?: string[] | undefined;
        caching?: boolean | undefined;
    }, {
        priority: "low" | "medium" | "high" | "critical";
        timeout?: number | undefined;
        fallbackStrategy?: "basic" | "cache" | "skip" | undefined;
        providers?: string[] | undefined;
        caching?: boolean | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    options: {
        priority: "low" | "medium" | "high" | "critical";
        timeout?: number | undefined;
        fallbackStrategy?: "basic" | "cache" | "skip" | undefined;
        providers?: string[] | undefined;
        caching?: boolean | undefined;
    };
    type: string;
    id: string;
    input: {
        text?: string | undefined;
        data?: Record<string, unknown> | undefined;
        rawData?: unknown;
    };
    context: {
        timeframe?: string | undefined;
        blockchain?: string | undefined;
        protocol?: string | undefined;
        customParameters?: Record<string, unknown> | undefined;
    };
    timestamp: number;
}, {
    options: {
        priority: "low" | "medium" | "high" | "critical";
        timeout?: number | undefined;
        fallbackStrategy?: "basic" | "cache" | "skip" | undefined;
        providers?: string[] | undefined;
        caching?: boolean | undefined;
    };
    type: string;
    id: string;
    input: {
        text?: string | undefined;
        data?: Record<string, unknown> | undefined;
        rawData?: unknown;
    };
    context: {
        timeframe?: string | undefined;
        blockchain?: string | undefined;
        protocol?: string | undefined;
        customParameters?: Record<string, unknown> | undefined;
    };
    timestamp: number;
}>;
export declare const RuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    condition: z.ZodObject<{
        type: z.ZodEnum<["natural_language", "logical", "composite"]>;
        expression: z.ZodString;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        confidence_threshold: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "natural_language" | "logical" | "composite";
        expression: string;
        parameters?: Record<string, unknown> | undefined;
        confidence_threshold?: number | undefined;
    }, {
        type: "natural_language" | "logical" | "composite";
        expression: string;
        parameters?: Record<string, unknown> | undefined;
        confidence_threshold?: number | undefined;
    }>;
    action: z.ZodObject<{
        type: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        confirmation_required: z.ZodOptional<z.ZodBoolean>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        parameters: Record<string, unknown>;
        confirmation_required?: boolean | undefined;
        conditions?: any[] | undefined;
    }, {
        type: string;
        parameters: Record<string, unknown>;
        confirmation_required?: boolean | undefined;
        conditions?: any[] | undefined;
    }>;
    enabled: z.ZodBoolean;
    priority: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    action: {
        type: string;
        parameters: Record<string, unknown>;
        confirmation_required?: boolean | undefined;
        conditions?: any[] | undefined;
    };
    id: string;
    priority: number;
    name: string;
    description: string;
    condition: {
        type: "natural_language" | "logical" | "composite";
        expression: string;
        parameters?: Record<string, unknown> | undefined;
        confidence_threshold?: number | undefined;
    };
    enabled: boolean;
    metadata?: Record<string, unknown> | undefined;
}, {
    action: {
        type: string;
        parameters: Record<string, unknown>;
        confirmation_required?: boolean | undefined;
        conditions?: any[] | undefined;
    };
    id: string;
    priority: number;
    name: string;
    description: string;
    condition: {
        type: "natural_language" | "logical" | "composite";
        expression: string;
        parameters?: Record<string, unknown> | undefined;
        confidence_threshold?: number | undefined;
    };
    enabled: boolean;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare function isProposalAnalysis(input: AnalysisInput): input is ProposalAnalysisInput;
export declare function isTransactionAnalysis(input: AnalysisInput): input is TransactionAnalysisInput;
export declare function isMarketAnalysis(input: AnalysisInput): input is MarketAnalysisInput;
export declare function isValidDecision(decision: unknown): decision is AIDecision;
//# sourceMappingURL=core.d.ts.map
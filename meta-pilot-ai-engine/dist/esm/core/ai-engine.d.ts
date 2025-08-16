/**
 * Core AI Engine - Flexible and Extensible Architecture
 * Designed for Web3 automation projects with plugin system
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
import { AIEngineConfig, AnalysisResult, AnalyzerPlugin, Rule, LearningData, EventHandler, AnalysisContext, AnalysisInput, AnalysisOptions } from '../types/core';
export declare class AIEngine extends EventEmitter {
    private config;
    private logger;
    private cache;
    private plugins;
    private rules;
    private learningData;
    private performanceMonitor;
    private rateLimiter;
    private isInitialized;
    constructor(config: AIEngineConfig);
    initialize(): Promise<void>;
    private loadCorePlugins;
    private initializeProviders;
    private setupEventHandlers;
    analyze(type: string, input: AnalysisInput, context?: AnalysisContext, options?: AnalysisOptions): Promise<AnalysisResult>;
    analyzeWithRules(input: AnalysisInput, userRules: Rule[], context?: AnalysisContext): Promise<AnalysisResult>;
    private applyRule;
    private evaluateRuleCondition;
    loadPlugin(pluginName: string, plugin?: AnalyzerPlugin): Promise<void>;
    unloadPlugin(pluginName: string): boolean;
    getLoadedPlugins(): string[];
    private validatePlugin;
    private routeToAnalyzer;
    recordLearning(learningData: LearningData): void;
    getUserLearningData(userId: string): LearningData[];
    getSystemLearningInsights(): any;
    private getCachedResult;
    private cacheResult;
    private generateCacheKey;
    private generateRequestId;
    private handleFallback;
    private basicFallbackAnalysis;
    private handleAnalysisCompleted;
    private handleAnalysisFailed;
    private handleDecisionMade;
    private evaluateNaturalLanguageCondition;
    private evaluateLogicalCondition;
    private evaluateCompositeCondition;
    private extractKeywords;
    private combineRuleResults;
    private calculateAverageConfidence;
    private calculateSuccessRate;
    private getTopFailureReasons;
    private getUserFeedbackStats;
    getStatus(): any;
    addEventListener(event: string, handler: EventHandler): void;
    removeEventListener(event: string, handler: EventHandler): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ai-engine.d.ts.map
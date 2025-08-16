/**
 * Core AI Engine - Flexible and Extensible Architecture
 * Designed for Web3 automation projects with plugin system
 */

import { EventEmitter } from 'events';
import NodeCache from 'node-cache';
import { Logger } from 'winston';
import {
  AIEngineConfig,
  AnalysisRequest,
  AnalysisResult,
  AIDecision,
  AnalyzerPlugin,
  Rule,
  LearningData,
  EventHandler,
  AnalysisContext,
  AnalysisInput,
  AnalysisOptions,
  AnalysisRequestSchema,
} from '../types/core';
import { AIEngineError, ErrorFactory, ErrorHandler, ERROR_CODES } from '../types/errors';
import { createLogger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance';
import { RateLimiter } from '../utils/rate-limiter';
import { PluginSecurityValidator, SecurityPolicy } from '../security/plugin-validator';

export class AIEngine extends EventEmitter {
  private config: AIEngineConfig;
  private logger: Logger;
  private cache: NodeCache;
  private plugins: Map<string, AnalyzerPlugin> = new Map();
  private rules: Map<string, Rule> = new Map();
  private learningData: LearningData[] = [];
  private performanceMonitor: PerformanceMonitor;
  private rateLimiter: RateLimiter;
  private securityValidator: PluginSecurityValidator;
  private isInitialized = false;

  constructor(config: AIEngineConfig) {
    super();
    this.config = config;
    this.logger = createLogger(config.logLevel);
    this.cache = new NodeCache({
      stdTTL: config.caching.ttl,
      maxKeys: config.caching.maxSize,
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
    this.performanceMonitor = new PerformanceMonitor(this.logger);
    this.rateLimiter = new RateLimiter(config.rateLimiting);
    
    // Initialize security validator with default security policy
    const securityPolicy: SecurityPolicy = {
      allowDynamicImports: config.environment !== 'production',
      allowNetworkAccess: true,
      allowFileSystemAccess: config.environment !== 'production',
      allowExecute: false,
      maxMemoryUsage: 256, // 256MB
      maxExecutionTime: 30000, // 30 seconds
      requiredSignature: config.environment === 'production',
      trustedSources: ['@metapilot/', 'https://plugins.metapilot.ai/']
    };
    this.securityValidator = new PluginSecurityValidator(securityPolicy);
  }

  // ==================== INITIALIZATION ====================

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing AI Engine...');
      
      // Load core plugins
      await this.loadCorePlugins();
      
      // Initialize providers
      await this.initializeProviders();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      this.isInitialized = true;
      this.logger.info('AI Engine initialized successfully');
      this.emit('engine_initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize AI Engine:', error);
      throw ErrorFactory.createConfigError(
        `AI Engine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ai-engine',
        'initialization'
      );
    }
  }

  private async loadCorePlugins(): Promise<void> {
    this.logger.info('Loading core plugins...');
    
    try {
      // Import core plugins directly for better compatibility
      const { NLPAnalyzer } = await import('../plugins/nlp-analyzer');
      const { ProposalAnalyzer } = await import('../plugins/proposal-analyzer');
      
      // Load available plugins
      await this.loadPlugin('nlp-analyzer', new NLPAnalyzer());
      await this.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
      
    } catch (error) {
      this.logger.warn('Some core plugins failed to load:', error);
    }
  }

  private async initializeProviders(): Promise<void> {
    this.logger.info('Initializing AI providers...');
    
    // Initialize configured providers
    if (this.config.providers.openai) {
      this.logger.info('OpenAI provider configured');
    }
    
    if (this.config.providers.anthropic) {
      this.logger.info('Anthropic provider configured');
    }
    
    if (this.config.providers.local) {
      this.logger.info('Local provider configured');
    }
  }

  private setupEventHandlers(): void {
    // Setup internal event handlers
    this.on('analysis_completed', this.handleAnalysisCompleted.bind(this));
    this.on('analysis_failed', this.handleAnalysisFailed.bind(this));
    this.on('decision_made', this.handleDecisionMade.bind(this));
  }

  // ==================== MAIN ANALYSIS INTERFACE ====================

  async analyze(
    type: string,
    input: AnalysisInput,
    context: AnalysisContext = {},
    options: AnalysisOptions = { priority: 'medium' }
  ): Promise<AnalysisResult> {
    if (!this.isInitialized) {
      throw ErrorFactory.createConfigError(
        'AI Engine not initialized. Call initialize() first.',
        'ai-engine',
        'initialization'
      );
    }

    // Check rate limiting
    if (!this.rateLimiter.isAllowed()) {
      throw ErrorFactory.createRateLimitError(
        'ai-engine',
        this.config.rateLimiting.requestsPerMinute,
        'minute'
      );
    }

    const requestId = this.generateRequestId();
    const request: AnalysisRequest = {
      id: requestId,
      type,
      input,
      context,
      options,
      timestamp: Date.now()
    };

    // Validate request
    try {
      AnalysisRequestSchema.parse(request);
    } catch (error) {
      throw ErrorFactory.createValidationError(
        `Invalid analysis request: ${error instanceof Error ? error.message : 'Validation failed'}`,
        'ai-engine',
        'request',
        ['Check input format', 'Verify required fields', 'Review analysis type']
      );
    }

    const startTime = Date.now();
    this.emit('analysis_started', { requestId, type, timestamp: startTime });

    try {
      this.logger.info(`Starting analysis: ${requestId} (${type})`);
      
      // Check cache first
      if (options.caching !== false) {
        const cached = this.getCachedResult(request);
        if (cached) {
          this.logger.info(`Cache hit for request: ${requestId}`);
          return cached;
        }
      }

      // Route to appropriate analyzer
      const result = await this.routeToAnalyzer(request);
      
      // Cache successful results
      if (result.success && options.caching !== false) {
        this.cacheResult(request, result);
      }

      // Record performance metrics
      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordAnalysis(type, processingTime, result.success);

      this.emit('analysis_completed', { 
        requestId, 
        type, 
        success: result.success, 
        processingTime 
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Analysis failed: ${requestId}`, error);
      
      this.emit('analysis_failed', { 
        requestId, 
        type, 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime 
      });

      // Try fallback strategy
      if (options.fallbackStrategy) {
        return this.handleFallback(request, error as Error);
      }

      throw error;
    }
  }

  // ==================== RULE-BASED ANALYSIS ====================

  async analyzeWithRules(
    input: AnalysisInput,
    userRules: Rule[],
    context: AnalysisContext = {}
  ): Promise<AnalysisResult> {
    const results: AnalysisResult[] = [];
    
    for (const rule of userRules.filter(r => r.enabled)) {
      try {
        const result = await this.applyRule(rule, input, context);
        results.push(result);
        
        // If rule triggers an action, execute it
        if (result.decision?.action === 'EXECUTE') {
          this.emit('rule_triggered', { rule: rule.id, decision: result.decision });
        }
        
      } catch (error) {
        this.logger.warn(`Rule ${rule.id} failed:`, error);
      }
    }
    
    // Combine results using rule priorities
    return this.combineRuleResults(results, userRules);
  }

  private async applyRule(
    rule: Rule,
    input: AnalysisInput,
    context: AnalysisContext
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Evaluate rule condition
      const conditionMet = await this.evaluateRuleCondition(rule.condition, input, context);
      
      if (!conditionMet.success) {
        return {
          success: true,
          decision: {
            action: 'SKIP',
            confidence: 0,
            reasoning: [`Rule condition not met: ${conditionMet.reason}`],
            metadata: { ruleId: rule.id },
            riskAssessment: {
              level: 'low',
              factors: []
            }
          },
          processingTime: Date.now() - startTime,
          provider: 'rule-engine'
        };
      }

      // Generate decision based on rule action
      const decision: AIDecision = {
        action: 'EXECUTE',
        confidence: conditionMet.confidence,
        reasoning: [
          `Rule "${rule.name}" triggered`,
          `Condition: ${rule.condition.expression}`,
          `Confidence: ${conditionMet.confidence}%`
        ],
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          actionType: rule.action.type,
          actionParameters: rule.action.parameters
        },
        riskAssessment: {
          level: 'low', // Default, can be enhanced
          factors: [`Rule-based decision with ${conditionMet.confidence}% confidence`]
        }
      };

      return {
        success: true,
        decision,
        processingTime: Date.now() - startTime,
        provider: 'rule-engine',
        metadata: { rule: rule.id }
      };

    } catch (error) {
      return {
        success: false,
        error: `Rule application failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: Date.now() - startTime,
        provider: 'rule-engine'
      };
    }
  }

  private async evaluateRuleCondition(
    condition: any,
    input: AnalysisInput,
    context: AnalysisContext
  ): Promise<{ success: boolean; confidence: number; reason: string }> {
    switch (condition.type) {
      case 'natural_language':
        return this.evaluateNaturalLanguageCondition(condition.expression, input);
      
      case 'logical':
        return this.evaluateLogicalCondition(condition.expression, input, context);
      
      case 'composite':
        return this.evaluateCompositeCondition(condition, input, context);
      
      default:
        return { success: false, confidence: 0, reason: 'Unknown condition type' };
    }
  }

  // ==================== PLUGIN SYSTEM ====================

  async loadPlugin(pluginName: string, plugin?: AnalyzerPlugin): Promise<void> {
    try {
      let pluginInstance: AnalyzerPlugin;
      
      if (plugin) {
        pluginInstance = plugin;
      } else {
        // Dynamic import of plugin
        const pluginModule = await import(`../plugins/${pluginName}`);
        pluginInstance = new pluginModule.default();
      }
      
      // Validate plugin
      if (!(await this.validatePlugin(pluginInstance))) {
        throw ErrorFactory.createPluginError(plugin.name, 'validation');
      }
      
      this.plugins.set(pluginName, pluginInstance);
      this.logger.info(`Plugin loaded: ${pluginName} v${pluginInstance.version}`);
      this.emit('plugin_loaded', { name: pluginName, version: pluginInstance.version });
      
    } catch (error) {
      this.logger.error(`Failed to load plugin: ${pluginName}`, error);
      this.emit('plugin_error', { name: pluginName, error });
      throw error;
    }
  }

  unloadPlugin(pluginName: string): boolean {
    if (this.plugins.has(pluginName)) {
      this.plugins.delete(pluginName);
      this.logger.info(`Plugin unloaded: ${pluginName}`);
      return true;
    }
    return false;
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  private async validatePlugin(plugin: AnalyzerPlugin): Promise<boolean> {
    // Basic structural validation
    const basicValid = !!(
      plugin.name &&
      plugin.version &&
      plugin.supportedTypes &&
      Array.isArray(plugin.supportedTypes) &&
      typeof plugin.analyze === 'function'
    );

    if (!basicValid) {
      return false;
    }

    // Security validation for production
    if (this.config.environment === 'production') {
      try {
        const validationResult = await this.securityValidator.validatePlugin(plugin);
        
        if (!validationResult.isValid) {
          this.logger.error(`Plugin security validation failed: ${plugin.name}`, {
            violations: validationResult.violations
          });
          return false;
        }

        // Log warnings but don't fail validation
        if (validationResult.warnings.length > 0) {
          this.logger.warn(`Plugin security warnings: ${plugin.name}`, {
            warnings: validationResult.warnings
          });
        }

        return true;
      } catch (error) {
        this.logger.error(`Plugin security validation error: ${plugin.name}`, error);
        return false;
      }
    }

    return true;
  }

  // ==================== ROUTING AND EXECUTION ====================

  private async routeToAnalyzer(request: AnalysisRequest): Promise<AnalysisResult> {
    // Find suitable plugins for this analysis type
    const suitablePlugins = Array.from(this.plugins.values()).filter(plugin =>
      plugin.supportedTypes.includes(request.type) &&
      (!plugin.supportedBlockchains || 
       !request.context.blockchain || 
       plugin.supportedBlockchains.includes(request.context.blockchain))
    );

    if (suitablePlugins.length === 0) {
      throw ErrorFactory.createAnalysisError(
        request.type,
        'ai-engine',
        new Error(`No suitable analyzer found for type: ${request.type}`)
      );
    }

    // Use the first suitable plugin (can be enhanced with routing logic)
    const plugin = suitablePlugins[0];
    
    try {
      this.logger.debug(`Routing to plugin: ${plugin.name} for ${request.type}`);
      return await plugin.analyze(request);
    } catch (error) {
      this.logger.error(`Plugin ${plugin.name} failed:`, error);
      
      // Try next plugin if available
      if (suitablePlugins.length > 1) {
        this.logger.info(`Trying fallback plugin for ${request.type}`);
        return await suitablePlugins[1].analyze(request);
      }
      
      throw error;
    }
  }

  // ==================== LEARNING SYSTEM ====================

  recordLearning(learningData: LearningData): void {
    if (!this.config.features.learningEnabled) return;

    this.learningData.push(learningData);
    this.logger.debug(`Learning data recorded for user: ${learningData.userId}`);
    
    // Limit learning data size
    if (this.learningData.length > 10000) {
      this.learningData = this.learningData.slice(-5000);
    }

    this.emit('learning_updated', { userId: learningData.userId });
  }

  getUserLearningData(userId: string): LearningData[] {
    return this.learningData.filter(data => data.userId === userId);
  }

  getSystemLearningInsights(): any {
    return {
      totalSessions: this.learningData.length,
      avgConfidence: this.calculateAverageConfidence(),
      successRate: this.calculateSuccessRate(),
      topFailureReasons: this.getTopFailureReasons(),
      userFeedbackStats: this.getUserFeedbackStats()
    };
  }

  // ==================== CACHING ====================

  private getCachedResult(request: AnalysisRequest): AnalysisResult | null {
    if (!this.config.caching.enabled) return null;
    
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get<AnalysisResult>(cacheKey);
    
    if (cached) {
      // Check if cache is still valid (not too old for time-sensitive analysis)
      const cacheAge = Date.now() - (cached.metadata?.cachedAt || 0);
      const maxAge = this.getCacheMaxAge(request.type);
      
      if (cacheAge > maxAge) {
        this.cache.del(cacheKey);
        this.logger.debug(`Cache expired for key: ${cacheKey}`);
        return null;
      }
      
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached;
    }
    
    return null;
  }

  private cacheResult(request: AnalysisRequest, result: AnalysisResult): void {
    if (!this.config.caching.enabled) return;
    
    const cacheKey = this.generateCacheKey(request);
    
    // Add cache metadata for better performance monitoring
    const cachedResult = {
      ...result,
      metadata: {
        ...result.metadata,
        cachedAt: Date.now(),
        cacheKey: cacheKey
      }
    };
    
    this.cache.set(cacheKey, cachedResult);
    this.logger.debug(`Cached result for key: ${cacheKey}`);
  }

  private generateCacheKey(request: AnalysisRequest): string {
    // Create a more efficient cache key with only relevant data
    const keyData = {
      type: request.type,
      // Only include input data that affects analysis
      input: {
        text: request.input.text,
        proposalText: request.input.proposalText,
        proposalId: request.input.proposalId,
        daoName: request.input.daoName,
        proposalType: request.input.proposalType,
        data: request.input.data
      },
      // Only include context that significantly affects results
      context: {
        blockchain: request.context.blockchain,
        protocol: request.context.protocol,
        timeframe: request.context.timeframe
      },
      // Include options that affect analysis
      providers: request.options.providers?.sort() // Sort to ensure consistent ordering
    };
    
    // Use a more efficient hashing approach
    const jsonString = JSON.stringify(keyData, Object.keys(keyData).sort());
    
    // Create a shorter, more efficient hash
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `ai_cache_${Math.abs(hash).toString(36)}_${request.type}`;
  }

  private getCacheMaxAge(analysisType: AnalysisType): number {
    // Different analysis types have different cache validity periods
    const cacheAges = {
      'proposal': 5 * 60 * 1000,    // 5 minutes for proposals (they can change)
      'sentiment': 30 * 60 * 1000,  // 30 minutes for sentiment analysis
      'market': 2 * 60 * 1000,      // 2 minutes for market data (highly volatile)
      'transaction': 10 * 60 * 1000, // 10 minutes for transaction analysis
      'risk': 15 * 60 * 1000,       // 15 minutes for risk analysis
      'default': 10 * 60 * 1000     // 10 minutes default
    };
    
    return cacheAges[analysisType as keyof typeof cacheAges] || cacheAges.default;
  }

  public getCacheStats(): { hits: number; misses: number; size: number } {
    // This would require extending node-cache or implementing custom statistics
    // For now, return basic stats
    return {
      hits: 0, // Would track in implementation
      misses: 0, // Would track in implementation
      size: this.cache.keys().length
    };
  }

  public clearCache(): void {
    this.cache.flushAll();
    this.logger.info('Cache cleared');
  }

  // ==================== UTILITIES ====================

  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleFallback(request: AnalysisRequest, error: Error): Promise<AnalysisResult> {
    this.logger.info(`Applying fallback strategy: ${request.options.fallbackStrategy}`);
    
    switch (request.options.fallbackStrategy) {
      case 'basic':
        return this.basicFallbackAnalysis(request);
      
      case 'cache':
        const cached = this.getCachedResult(request);
        if (cached) return cached;
        throw error;
      
      case 'skip':
      default:
        throw error;
    }
  }

  private async basicFallbackAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    // Provide basic analysis when advanced methods fail
    return {
      success: true,
      decision: {
        action: 'WAIT',
        confidence: 30,
        reasoning: ['Fallback analysis - insufficient data for confident decision'],
        metadata: { fallback: true },
        riskAssessment: {
          level: 'medium',
          factors: ['Analysis failed, using basic fallback']
        }
      },
      processingTime: 100,
      provider: 'fallback'
    };
  }

  // ==================== EVENT HANDLERS ====================

  private handleAnalysisCompleted(event: any): void {
    this.logger.debug('Analysis completed', event);
  }

  private handleAnalysisFailed(event: any): void {
    this.logger.warn('Analysis failed', event);
  }

  private handleDecisionMade(event: any): void {
    this.logger.info('Decision made', event);
  }

  // ==================== HELPER METHODS ====================

  private async evaluateNaturalLanguageCondition(
    expression: string,
    input: AnalysisInput
  ): Promise<{ success: boolean; confidence: number; reason: string }> {
    // Basic keyword matching for now - can be enhanced with NLP
    if (!input.text) {
      return { success: false, confidence: 0, reason: 'No text to analyze' };
    }

    const keywords = this.extractKeywords(expression);
    const matchedKeywords = keywords.filter(keyword =>
      input.text!.toLowerCase().includes(keyword.toLowerCase())
    );

    const confidence = keywords.length > 0 ? (matchedKeywords.length / keywords.length) * 100 : 0;
    const success = confidence > 50; // Threshold can be configurable

    return {
      success,
      confidence,
      reason: `Matched ${matchedKeywords.length}/${keywords.length} keywords: ${matchedKeywords.join(', ')}`
    };
  }

  private async evaluateLogicalCondition(
    expression: string,
    input: AnalysisInput,
    context: AnalysisContext
  ): Promise<{ success: boolean; confidence: number; reason: string }> {
    // Implement logical expression evaluation
    // For now, return basic implementation
    return { success: true, confidence: 75, reason: 'Logical condition evaluated' };
  }

  private async evaluateCompositeCondition(
    condition: any,
    input: AnalysisInput,
    context: AnalysisContext
  ): Promise<{ success: boolean; confidence: number; reason: string }> {
    // Implement composite condition evaluation
    return { success: true, confidence: 80, reason: 'Composite condition evaluated' };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['and', 'or', 'if', 'then', 'the', 'this', 'that'].includes(word));
  }

  private combineRuleResults(results: AnalysisResult[], rules: Rule[]): AnalysisResult {
    if (results.length === 0) {
      return {
        success: false,
        error: 'No rule results to combine',
        processingTime: 0,
        provider: 'rule-engine'
      };
    }

    // Sort by rule priority and confidence
    const sortedResults = results
      .filter(r => r.success && r.decision)
      .sort((a, b) => {
        const priorityA = rules.find(r => r.id === a.metadata?.rule)?.priority || 0;
        const priorityB = rules.find(r => r.id === b.metadata?.rule)?.priority || 0;
        
        if (priorityA !== priorityB) return priorityB - priorityA; // Higher priority first
        return (b.decision?.confidence || 0) - (a.decision?.confidence || 0); // Higher confidence first
      });

    if (sortedResults.length === 0) {
      return results[0]; // Return first result even if failed
    }

    // Return highest priority, highest confidence result
    return sortedResults[0];
  }

  private calculateAverageConfidence(): number {
    if (this.learningData.length === 0) return 0;
    
    const totalConfidence = this.learningData.reduce((sum, data) => 
      sum + data.decision.confidence, 0);
    
    return totalConfidence / this.learningData.length;
  }

  private calculateSuccessRate(): number {
    if (this.learningData.length === 0) return 0;
    
    const successfulExecutions = this.learningData.filter(data =>
      data.actualOutcome.success).length;
    
    return (successfulExecutions / this.learningData.length) * 100;
  }

  private getTopFailureReasons(): string[] {
    const failures = this.learningData.filter(data => !data.actualOutcome.success);
    const reasonCounts: Record<string, number> = {};
    
    failures.forEach(failure => {
      failure.actualOutcome.errors?.forEach(error => {
        reasonCounts[error] = (reasonCounts[error] || 0) + 1;
      });
    });
    
    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);
  }

  private getUserFeedbackStats(): any {
    const feedbacks = this.learningData
      .filter(data => data.userFeedback)
      .map(data => data.userFeedback!);
    
    if (feedbacks.length === 0) return null;
    
    const avgRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
    const correctnessStats = feedbacks.reduce((stats, fb) => {
      stats[fb.correctness] = (stats[fb.correctness] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    return { avgRating, correctnessStats, totalFeedbacks: feedbacks.length };
  }

  // ==================== PUBLIC API ====================

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      pluginsLoaded: this.plugins.size,
      rulesActive: Array.from(this.rules.values()).filter(r => r.enabled).length,
      cacheSize: this.cache.getStats(),
      learningDataPoints: this.learningData.length,
      rateLimitStatus: this.rateLimiter.getStatus()
    };
  }

  addEventListener(event: string, handler: EventHandler): void {
    this.on(event, handler);
  }

  removeEventListener(event: string, handler: EventHandler): void {
    this.off(event, handler);
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down AI Engine...');
    this.cache.flushAll();
    this.removeAllListeners();
    this.isInitialized = false;
    this.logger.info('AI Engine shutdown complete');
  }
}
/**
 * Core AI Engine - Flexible and Extensible Architecture
 * Designed for Web3 automation projects with plugin system
 */
import { EventEmitter } from 'events';
import NodeCache from 'node-cache';
import { AnalysisRequestSchema } from '../types/core';
import { createLogger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance';
import { RateLimiter } from '../utils/rate-limiter';
export class AIEngine extends EventEmitter {
    constructor(config) {
        super();
        this.plugins = new Map();
        this.rules = new Map();
        this.learningData = [];
        this.isInitialized = false;
        this.config = config;
        this.logger = createLogger(config.logLevel);
        this.cache = new NodeCache({
            stdTTL: config.caching.ttl,
            maxKeys: config.caching.maxSize,
            checkperiod: 600 // Check for expired keys every 10 minutes
        });
        this.performanceMonitor = new PerformanceMonitor(this.logger);
        this.rateLimiter = new RateLimiter(config.rateLimiting);
    }
    // ==================== INITIALIZATION ====================
    async initialize() {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize AI Engine:', error);
            throw new Error(`AI Engine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async loadCorePlugins() {
        this.logger.info('Loading core plugins...');
        try {
            // Import core plugins directly for better compatibility
            const { NLPAnalyzer } = await import('../plugins/nlp-analyzer');
            const { ProposalAnalyzer } = await import('../plugins/proposal-analyzer');
            // Load available plugins
            await this.loadPlugin('nlp-analyzer', new NLPAnalyzer());
            await this.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
        }
        catch (error) {
            this.logger.warn('Some core plugins failed to load:', error);
        }
    }
    async initializeProviders() {
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
    setupEventHandlers() {
        // Setup internal event handlers
        this.on('analysis_completed', this.handleAnalysisCompleted.bind(this));
        this.on('analysis_failed', this.handleAnalysisFailed.bind(this));
        this.on('decision_made', this.handleDecisionMade.bind(this));
    }
    // ==================== MAIN ANALYSIS INTERFACE ====================
    async analyze(type, input, context = {}, options = { priority: 'medium' }) {
        if (!this.isInitialized) {
            throw new Error('AI Engine not initialized. Call initialize() first.');
        }
        // Check rate limiting
        if (!this.rateLimiter.isAllowed()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        const requestId = this.generateRequestId();
        const request = {
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
        }
        catch (error) {
            throw new Error(`Invalid analysis request: ${error instanceof Error ? error.message : 'Validation failed'}`);
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
        }
        catch (error) {
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
                return this.handleFallback(request, error);
            }
            throw error;
        }
    }
    // ==================== RULE-BASED ANALYSIS ====================
    async analyzeWithRules(input, userRules, context = {}) {
        const results = [];
        for (const rule of userRules.filter(r => r.enabled)) {
            try {
                const result = await this.applyRule(rule, input, context);
                results.push(result);
                // If rule triggers an action, execute it
                if (result.decision?.action === 'EXECUTE') {
                    this.emit('rule_triggered', { rule: rule.id, decision: result.decision });
                }
            }
            catch (error) {
                this.logger.warn(`Rule ${rule.id} failed:`, error);
            }
        }
        // Combine results using rule priorities
        return this.combineRuleResults(results, userRules);
    }
    async applyRule(rule, input, context) {
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
            const decision = {
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
        }
        catch (error) {
            return {
                success: false,
                error: `Rule application failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                processingTime: Date.now() - startTime,
                provider: 'rule-engine'
            };
        }
    }
    async evaluateRuleCondition(condition, input, context) {
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
    async loadPlugin(pluginName, plugin) {
        try {
            let pluginInstance;
            if (plugin) {
                pluginInstance = plugin;
            }
            else {
                // Dynamic import of plugin
                const pluginModule = await import(`../plugins/${pluginName}`);
                pluginInstance = new pluginModule.default();
            }
            // Validate plugin
            if (!this.validatePlugin(pluginInstance)) {
                throw new Error('Invalid plugin structure');
            }
            this.plugins.set(pluginName, pluginInstance);
            this.logger.info(`Plugin loaded: ${pluginName} v${pluginInstance.version}`);
            this.emit('plugin_loaded', { name: pluginName, version: pluginInstance.version });
        }
        catch (error) {
            this.logger.error(`Failed to load plugin: ${pluginName}`, error);
            this.emit('plugin_error', { name: pluginName, error });
            throw error;
        }
    }
    unloadPlugin(pluginName) {
        if (this.plugins.has(pluginName)) {
            this.plugins.delete(pluginName);
            this.logger.info(`Plugin unloaded: ${pluginName}`);
            return true;
        }
        return false;
    }
    getLoadedPlugins() {
        return Array.from(this.plugins.keys());
    }
    validatePlugin(plugin) {
        return !!(plugin.name &&
            plugin.version &&
            plugin.supportedTypes &&
            Array.isArray(plugin.supportedTypes) &&
            typeof plugin.analyze === 'function');
    }
    // ==================== ROUTING AND EXECUTION ====================
    async routeToAnalyzer(request) {
        // Find suitable plugins for this analysis type
        const suitablePlugins = Array.from(this.plugins.values()).filter(plugin => plugin.supportedTypes.includes(request.type) &&
            (!plugin.supportedBlockchains ||
                !request.context.blockchain ||
                plugin.supportedBlockchains.includes(request.context.blockchain)));
        if (suitablePlugins.length === 0) {
            throw new Error(`No suitable analyzer found for type: ${request.type}`);
        }
        // Use the first suitable plugin (can be enhanced with routing logic)
        const plugin = suitablePlugins[0];
        try {
            this.logger.debug(`Routing to plugin: ${plugin.name} for ${request.type}`);
            return await plugin.analyze(request);
        }
        catch (error) {
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
    recordLearning(learningData) {
        if (!this.config.features.learningEnabled)
            return;
        this.learningData.push(learningData);
        this.logger.debug(`Learning data recorded for user: ${learningData.userId}`);
        // Limit learning data size
        if (this.learningData.length > 10000) {
            this.learningData = this.learningData.slice(-5000);
        }
        this.emit('learning_updated', { userId: learningData.userId });
    }
    getUserLearningData(userId) {
        return this.learningData.filter(data => data.userId === userId);
    }
    getSystemLearningInsights() {
        return {
            totalSessions: this.learningData.length,
            avgConfidence: this.calculateAverageConfidence(),
            successRate: this.calculateSuccessRate(),
            topFailureReasons: this.getTopFailureReasons(),
            userFeedbackStats: this.getUserFeedbackStats()
        };
    }
    // ==================== CACHING ====================
    getCachedResult(request) {
        if (!this.config.caching.enabled)
            return null;
        const cacheKey = this.generateCacheKey(request);
        return this.cache.get(cacheKey) || null;
    }
    cacheResult(request, result) {
        if (!this.config.caching.enabled)
            return;
        const cacheKey = this.generateCacheKey(request);
        this.cache.set(cacheKey, result);
    }
    generateCacheKey(request) {
        // Create a deterministic cache key based on request content
        const keyData = {
            type: request.type,
            input: request.input,
            context: request.context,
            options: request.options
        };
        return Buffer.from(JSON.stringify(keyData)).toString('base64');
    }
    // ==================== UTILITIES ====================
    generateRequestId() {
        return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async handleFallback(request, error) {
        this.logger.info(`Applying fallback strategy: ${request.options.fallbackStrategy}`);
        switch (request.options.fallbackStrategy) {
            case 'basic':
                return this.basicFallbackAnalysis(request);
            case 'cache':
                const cached = this.getCachedResult(request);
                if (cached)
                    return cached;
                throw error;
            case 'skip':
            default:
                throw error;
        }
    }
    async basicFallbackAnalysis(request) {
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
    handleAnalysisCompleted(event) {
        this.logger.debug('Analysis completed', event);
    }
    handleAnalysisFailed(event) {
        this.logger.warn('Analysis failed', event);
    }
    handleDecisionMade(event) {
        this.logger.info('Decision made', event);
    }
    // ==================== HELPER METHODS ====================
    async evaluateNaturalLanguageCondition(expression, input) {
        // Basic keyword matching for now - can be enhanced with NLP
        if (!input.text) {
            return { success: false, confidence: 0, reason: 'No text to analyze' };
        }
        const keywords = this.extractKeywords(expression);
        const matchedKeywords = keywords.filter(keyword => input.text.toLowerCase().includes(keyword.toLowerCase()));
        const confidence = keywords.length > 0 ? (matchedKeywords.length / keywords.length) * 100 : 0;
        const success = confidence > 50; // Threshold can be configurable
        return {
            success,
            confidence,
            reason: `Matched ${matchedKeywords.length}/${keywords.length} keywords: ${matchedKeywords.join(', ')}`
        };
    }
    async evaluateLogicalCondition(expression, input, context) {
        // Implement logical expression evaluation
        // For now, return basic implementation
        return { success: true, confidence: 75, reason: 'Logical condition evaluated' };
    }
    async evaluateCompositeCondition(condition, input, context) {
        // Implement composite condition evaluation
        return { success: true, confidence: 80, reason: 'Composite condition evaluated' };
    }
    extractKeywords(text) {
        // Simple keyword extraction - can be enhanced
        return text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['and', 'or', 'if', 'then', 'the', 'this', 'that'].includes(word));
    }
    combineRuleResults(results, rules) {
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
            if (priorityA !== priorityB)
                return priorityB - priorityA; // Higher priority first
            return (b.decision?.confidence || 0) - (a.decision?.confidence || 0); // Higher confidence first
        });
        if (sortedResults.length === 0) {
            return results[0]; // Return first result even if failed
        }
        // Return highest priority, highest confidence result
        return sortedResults[0];
    }
    calculateAverageConfidence() {
        if (this.learningData.length === 0)
            return 0;
        const totalConfidence = this.learningData.reduce((sum, data) => sum + data.decision.confidence, 0);
        return totalConfidence / this.learningData.length;
    }
    calculateSuccessRate() {
        if (this.learningData.length === 0)
            return 0;
        const successfulExecutions = this.learningData.filter(data => data.actualOutcome.success).length;
        return (successfulExecutions / this.learningData.length) * 100;
    }
    getTopFailureReasons() {
        const failures = this.learningData.filter(data => !data.actualOutcome.success);
        const reasonCounts = {};
        failures.forEach(failure => {
            failure.actualOutcome.errors?.forEach(error => {
                reasonCounts[error] = (reasonCounts[error] || 0) + 1;
            });
        });
        return Object.entries(reasonCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([reason]) => reason);
    }
    getUserFeedbackStats() {
        const feedbacks = this.learningData
            .filter(data => data.userFeedback)
            .map(data => data.userFeedback);
        if (feedbacks.length === 0)
            return null;
        const avgRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
        const correctnessStats = feedbacks.reduce((stats, fb) => {
            stats[fb.correctness] = (stats[fb.correctness] || 0) + 1;
            return stats;
        }, {});
        return { avgRating, correctnessStats, totalFeedbacks: feedbacks.length };
    }
    // ==================== PUBLIC API ====================
    getStatus() {
        return {
            initialized: this.isInitialized,
            pluginsLoaded: this.plugins.size,
            rulesActive: Array.from(this.rules.values()).filter(r => r.enabled).length,
            cacheSize: this.cache.getStats(),
            learningDataPoints: this.learningData.length,
            rateLimitStatus: this.rateLimiter.getStatus()
        };
    }
    addEventListener(event, handler) {
        this.on(event, handler);
    }
    removeEventListener(event, handler) {
        this.off(event, handler);
    }
    async shutdown() {
        this.logger.info('Shutting down AI Engine...');
        this.cache.flushAll();
        this.removeAllListeners();
        this.isInitialized = false;
        this.logger.info('AI Engine shutdown complete');
    }
}
//# sourceMappingURL=ai-engine.js.map
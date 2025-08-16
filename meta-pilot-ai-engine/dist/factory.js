"use strict";
/**
 * Factory Functions for AI Engine Creation
 * Provides easy-to-use constructors for different AI engine configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestEngine = exports.createProductionEngine = exports.createLightweightEngine = exports.createAIEngine = exports.createEnhancedEngine = exports.createBasicEngine = void 0;
const ai_engine_1 = require("./core/ai-engine");
const nlp_analyzer_1 = require("./plugins/nlp-analyzer");
const proposal_analyzer_1 = require("./plugins/proposal-analyzer");
const openai_analyzer_1 = require("./enhanced/openai-analyzer");
const config_1 = require("./config");
/**
 * Create a basic AI engine with core plugins only
 */
async function createBasicEngine(options = {}) {
    const config = {
        ...config_1.DEFAULT_CONFIG,
        environment: options.environment || 'development',
        logLevel: options.logLevel || 'info',
        caching: {
            ...config_1.DEFAULT_CONFIG.caching,
            enabled: options.enableCaching ?? true
        },
        rateLimiting: {
            ...config_1.DEFAULT_CONFIG.rateLimiting,
            enabled: options.enableRateLimit ?? true
        },
        ...options.customConfig
    };
    const engine = new ai_engine_1.AIEngine(config);
    // Load core plugins
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new proposal_analyzer_1.ProposalAnalyzer());
    await engine.initialize();
    return engine;
}
exports.createBasicEngine = createBasicEngine;
/**
 * Create an enhanced AI engine with external AI providers
 */
async function createEnhancedEngine(options) {
    if (!options.openaiApiKey && !options.anthropicApiKey) {
        throw new Error('Enhanced engine requires at least one AI provider API key');
    }
    const config = {
        ...config_1.DEFAULT_CONFIG,
        environment: options.environment || 'development',
        logLevel: options.logLevel || 'info',
        providers: {
            ...config_1.DEFAULT_CONFIG.providers,
            ...(options.openaiApiKey && {
                openai: {
                    apiKey: options.openaiApiKey,
                    model: 'gpt-4-turbo-preview',
                    maxTokens: 2000
                }
            }),
            ...(options.anthropicApiKey && {
                anthropic: {
                    apiKey: options.anthropicApiKey,
                    model: 'claude-3-sonnet-20240229'
                }
            })
        },
        features: {
            ...config_1.DEFAULT_CONFIG.features,
            multiProviderEnabled: true
        },
        ...options.customConfig
    };
    const engine = new ai_engine_1.AIEngine(config);
    // Load core plugins
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new proposal_analyzer_1.ProposalAnalyzer());
    // Load enhanced plugins
    if (options.openaiApiKey) {
        await engine.loadPlugin('openai-analyzer', new openai_analyzer_1.OpenAIAnalyzer(options.openaiApiKey));
    }
    await engine.initialize();
    return engine;
}
exports.createEnhancedEngine = createEnhancedEngine;
/**
 * Create a custom AI engine with specific configuration
 */
async function createAIEngine(config, plugins) {
    const engine = new ai_engine_1.AIEngine(config);
    // Load default plugins
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new proposal_analyzer_1.ProposalAnalyzer());
    // Load custom plugins
    if (plugins) {
        for (const { name, plugin } of plugins) {
            await engine.loadPlugin(name, plugin);
        }
    }
    await engine.initialize();
    return engine;
}
exports.createAIEngine = createAIEngine;
/**
 * Create a lightweight engine for basic text analysis
 */
async function createLightweightEngine() {
    const config = {
        ...config_1.DEFAULT_CONFIG,
        environment: 'development',
        logLevel: 'warn',
        caching: { enabled: false, ttl: 0, maxSize: 0 },
        rateLimiting: { enabled: false, requestsPerMinute: 0, requestsPerHour: 0 },
        features: {
            learningEnabled: false,
            fallbackEnabled: true,
            streamingEnabled: false,
            multiProviderEnabled: false
        }
    };
    const engine = new ai_engine_1.AIEngine(config);
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.initialize();
    return engine;
}
exports.createLightweightEngine = createLightweightEngine;
/**
 * Create an engine optimized for production use
 */
async function createProductionEngine(options) {
    const config = {
        ...config_1.DEFAULT_CONFIG,
        environment: 'production',
        logLevel: 'info',
        caching: {
            enabled: true,
            ttl: 3600, // 1 hour
            maxSize: 10000
        },
        rateLimiting: {
            enabled: true,
            requestsPerMinute: 100,
            requestsPerHour: 1000
        },
        features: {
            learningEnabled: true,
            fallbackEnabled: true,
            streamingEnabled: false,
            multiProviderEnabled: !!options.openaiApiKey
        },
        providers: {
            ...(options.openaiApiKey && {
                openai: {
                    apiKey: options.openaiApiKey,
                    model: 'gpt-4-turbo-preview'
                }
            })
        },
        ...options.customConfig
    };
    const engine = new ai_engine_1.AIEngine(config);
    // Load all available plugins for production
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new proposal_analyzer_1.ProposalAnalyzer());
    if (options.openaiApiKey) {
        await engine.loadPlugin('openai-analyzer', new openai_analyzer_1.OpenAIAnalyzer(options.openaiApiKey));
    }
    await engine.initialize();
    return engine;
}
exports.createProductionEngine = createProductionEngine;
/**
 * Create an engine for testing purposes
 */
async function createTestEngine() {
    const config = {
        ...config_1.DEFAULT_CONFIG,
        environment: 'development',
        logLevel: 'debug',
        caching: { enabled: false, ttl: 0, maxSize: 0 },
        rateLimiting: { enabled: false, requestsPerMinute: 0, requestsPerHour: 0 },
        features: {
            learningEnabled: false,
            fallbackEnabled: true,
            streamingEnabled: false,
            multiProviderEnabled: false
        }
    };
    const engine = new ai_engine_1.AIEngine(config);
    await engine.loadPlugin('nlp-analyzer', new nlp_analyzer_1.NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new proposal_analyzer_1.ProposalAnalyzer());
    await engine.initialize();
    return engine;
}
exports.createTestEngine = createTestEngine;
//# sourceMappingURL=factory.js.map
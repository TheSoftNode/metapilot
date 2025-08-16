/**
 * Factory Functions for AI Engine Creation
 * Provides easy-to-use constructors for different AI engine configurations
 */
import { AIEngine } from './core/ai-engine';
import { NLPAnalyzer } from './plugins/nlp-analyzer';
import { ProposalAnalyzer } from './plugins/proposal-analyzer';
import { OpenAIAnalyzer } from './enhanced/openai-analyzer';
import { DEFAULT_CONFIG } from './config';
/**
 * Create a basic AI engine with core plugins only
 */
export async function createBasicEngine(options = {}) {
    const config = {
        ...DEFAULT_CONFIG,
        environment: options.environment || 'development',
        logLevel: options.logLevel || 'info',
        caching: {
            ...DEFAULT_CONFIG.caching,
            enabled: options.enableCaching ?? true
        },
        rateLimiting: {
            ...DEFAULT_CONFIG.rateLimiting,
            enabled: options.enableRateLimit ?? true
        },
        ...options.customConfig
    };
    const engine = new AIEngine(config);
    // Load core plugins
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
    await engine.initialize();
    return engine;
}
/**
 * Create an enhanced AI engine with external AI providers
 */
export async function createEnhancedEngine(options) {
    if (!options.openaiApiKey && !options.anthropicApiKey) {
        throw new Error('Enhanced engine requires at least one AI provider API key');
    }
    const config = {
        ...DEFAULT_CONFIG,
        environment: options.environment || 'development',
        logLevel: options.logLevel || 'info',
        providers: {
            ...DEFAULT_CONFIG.providers,
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
            ...DEFAULT_CONFIG.features,
            multiProviderEnabled: true
        },
        ...options.customConfig
    };
    const engine = new AIEngine(config);
    // Load core plugins
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
    // Load enhanced plugins
    if (options.openaiApiKey) {
        await engine.loadPlugin('openai-analyzer', new OpenAIAnalyzer(options.openaiApiKey));
    }
    await engine.initialize();
    return engine;
}
/**
 * Create a custom AI engine with specific configuration
 */
export async function createAIEngine(config, plugins) {
    const engine = new AIEngine(config);
    // Load default plugins
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
    // Load custom plugins
    if (plugins) {
        for (const { name, plugin } of plugins) {
            await engine.loadPlugin(name, plugin);
        }
    }
    await engine.initialize();
    return engine;
}
/**
 * Create a lightweight engine for basic text analysis
 */
export async function createLightweightEngine() {
    const config = {
        ...DEFAULT_CONFIG,
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
    const engine = new AIEngine(config);
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.initialize();
    return engine;
}
/**
 * Create an engine optimized for production use
 */
export async function createProductionEngine(options) {
    const config = {
        ...DEFAULT_CONFIG,
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
    const engine = new AIEngine(config);
    // Load all available plugins for production
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
    if (options.openaiApiKey) {
        await engine.loadPlugin('openai-analyzer', new OpenAIAnalyzer(options.openaiApiKey));
    }
    await engine.initialize();
    return engine;
}
/**
 * Create an engine for testing purposes
 */
export async function createTestEngine() {
    const config = {
        ...DEFAULT_CONFIG,
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
    const engine = new AIEngine(config);
    await engine.loadPlugin('nlp-analyzer', new NLPAnalyzer());
    await engine.loadPlugin('proposal-analyzer', new ProposalAnalyzer());
    await engine.initialize();
    return engine;
}
//# sourceMappingURL=factory.js.map
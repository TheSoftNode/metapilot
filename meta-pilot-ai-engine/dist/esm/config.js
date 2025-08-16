/**
 * Default Configurations for AI Engine
 */
export const DEFAULT_CONFIG = {
    environment: 'development',
    logLevel: 'info',
    providers: {
        // OpenAI configuration (API key must be provided)
        openai: {
            apiKey: '', // Must be set by user
            model: 'gpt-4-turbo-preview',
            maxTokens: 2000
        }
    },
    caching: {
        enabled: true,
        ttl: 1800, // 30 minutes
        maxSize: 1000
    },
    rateLimiting: {
        enabled: true,
        requestsPerMinute: 60,
        requestsPerHour: 1000
    },
    features: {
        learningEnabled: true,
        fallbackEnabled: true,
        streamingEnabled: false,
        multiProviderEnabled: false
    }
};
export const PLUGIN_CONFIGS = {
    'nlp-analyzer': {
        priority: 1,
        fallbackWeight: 0.8,
        supportedLanguages: ['en', 'es', 'fr', 'de'],
        maxTextLength: 50000
    },
    'proposal-analyzer': {
        priority: 2,
        fallbackWeight: 0.9,
        supportedChains: ['ethereum', 'solana', 'polygon'],
        analysisDepth: 'deep'
    },
    'openai-analyzer': {
        priority: 3,
        fallbackWeight: 1.0,
        defaultModel: 'gpt-4-turbo-preview',
        maxRetries: 3,
        timeout: 30000
    }
};
export const DEVELOPMENT_CONFIG = {
    environment: 'development',
    logLevel: 'debug',
    caching: {
        enabled: false,
        ttl: 300, // 5 minutes
        maxSize: 100
    },
    rateLimiting: {
        enabled: false,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
    }
};
export const PRODUCTION_CONFIG = {
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
        streamingEnabled: true,
        multiProviderEnabled: true
    }
};
export const TEST_CONFIG = {
    environment: 'development',
    logLevel: 'error', // Minimal logging for tests
    caching: {
        enabled: false,
        ttl: 0,
        maxSize: 0
    },
    rateLimiting: {
        enabled: false,
        requestsPerMinute: 0,
        requestsPerHour: 0
    },
    features: {
        learningEnabled: false,
        fallbackEnabled: true,
        streamingEnabled: false,
        multiProviderEnabled: false
    }
};
//# sourceMappingURL=config.js.map
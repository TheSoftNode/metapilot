/**
 * Default Configurations for AI Engine
 */
import { AIEngineConfig } from './types/core';
export declare const DEFAULT_CONFIG: AIEngineConfig;
export declare const PLUGIN_CONFIGS: {
    'nlp-analyzer': {
        priority: number;
        fallbackWeight: number;
        supportedLanguages: string[];
        maxTextLength: number;
    };
    'proposal-analyzer': {
        priority: number;
        fallbackWeight: number;
        supportedChains: string[];
        analysisDepth: string;
    };
    'openai-analyzer': {
        priority: number;
        fallbackWeight: number;
        defaultModel: string;
        maxRetries: number;
        timeout: number;
    };
};
export declare const DEVELOPMENT_CONFIG: Partial<AIEngineConfig>;
export declare const PRODUCTION_CONFIG: Partial<AIEngineConfig>;
export declare const TEST_CONFIG: Partial<AIEngineConfig>;
//# sourceMappingURL=config.d.ts.map
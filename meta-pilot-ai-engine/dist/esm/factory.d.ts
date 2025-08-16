/**
 * Factory Functions for AI Engine Creation
 * Provides easy-to-use constructors for different AI engine configurations
 */
import { AIEngine } from './core/ai-engine';
import { AIEngineConfig } from './types/core';
export interface EngineOptions {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    environment?: 'development' | 'staging' | 'production';
    enableCaching?: boolean;
    enableRateLimit?: boolean;
    customConfig?: Partial<AIEngineConfig>;
}
/**
 * Create a basic AI engine with core plugins only
 */
export declare function createBasicEngine(options?: EngineOptions): Promise<AIEngine>;
/**
 * Create an enhanced AI engine with external AI providers
 */
export declare function createEnhancedEngine(options: EngineOptions): Promise<AIEngine>;
/**
 * Create a custom AI engine with specific configuration
 */
export declare function createAIEngine(config: AIEngineConfig, plugins?: Array<{
    name: string;
    plugin: any;
}>): Promise<AIEngine>;
/**
 * Create a lightweight engine for basic text analysis
 */
export declare function createLightweightEngine(): Promise<AIEngine>;
/**
 * Create an engine optimized for production use
 */
export declare function createProductionEngine(options: EngineOptions): Promise<AIEngine>;
/**
 * Create an engine for testing purposes
 */
export declare function createTestEngine(): Promise<AIEngine>;
//# sourceMappingURL=factory.d.ts.map
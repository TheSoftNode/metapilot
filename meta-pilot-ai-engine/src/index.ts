/**
 * MetaPilot AI Engine - Main Export
 * Complete AI system for Web3 automation and decision making
 */

// Core exports
export { AIEngine } from './core/ai-engine';
export type * from './types/core';

// Plugin exports
export { NLPAnalyzer } from './plugins/nlp-analyzer';
export { ProposalAnalyzer } from './plugins/proposal-analyzer';

// Enhanced AI exports
export { OpenAIAnalyzer } from './enhanced/openai-analyzer';

// Utility exports
export { createLogger } from './utils/logger';
export { PerformanceMonitor } from './utils/performance';
export { RateLimiter } from './utils/rate-limiter';

// Factory functions for easy initialization
export { createAIEngine, createBasicEngine, createEnhancedEngine } from './factory';

// Security exports
export { PluginSecurityValidator, PluginSandbox } from './security/plugin-validator';
export type { SecurityPolicy, PluginManifest, ValidationResult } from './security/plugin-validator';

// Constants and configurations
export { DEFAULT_CONFIG, PLUGIN_CONFIGS } from './config';
/**
 * Standardized Error Types for MetaPilot AI Engine
 * Provides consistent error handling and messaging across all components
 */

export interface StandardError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
  timestamp: number;
  component: string;
}

export class AIEngineError extends Error implements StandardError {
  public readonly code: string;
  public readonly details?: any;
  public readonly suggestions?: string[];
  public readonly timestamp: number;
  public readonly component: string;

  constructor(
    code: string,
    message: string,
    component: string,
    details?: any,
    suggestions?: string[]
  ) {
    super(message);
    this.name = 'AIEngineError';
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
    this.timestamp = Date.now();
    this.component = component;
  }

  toJSON(): StandardError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      component: this.component
    };
  }
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  
  // Plugin errors
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_FAILED: 'PLUGIN_LOAD_FAILED',
  PLUGIN_VALIDATION_FAILED: 'PLUGIN_VALIDATION_FAILED',
  PLUGIN_EXECUTION_FAILED: 'PLUGIN_EXECUTION_FAILED',
  
  // Analysis errors
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  ANALYSIS_TIMEOUT: 'ANALYSIS_TIMEOUT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  UNSUPPORTED_ANALYSIS_TYPE: 'UNSUPPORTED_ANALYSIS_TYPE',
  
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  
  // System errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CACHE_ERROR: 'CACHE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Error factory functions for common error scenarios
export class ErrorFactory {
  static createValidationError(
    message: string,
    component: string,
    field?: string,
    suggestions?: string[]
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.INVALID_INPUT,
      message,
      component,
      { field },
      suggestions
    );
  }

  static createPluginError(
    pluginName: string,
    operation: string,
    originalError?: Error
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.PLUGIN_EXECUTION_FAILED,
      `Plugin ${pluginName} failed during ${operation}`,
      'plugin-system',
      { pluginName, operation, originalError: originalError?.message },
      ['Check plugin configuration', 'Verify plugin dependencies']
    );
  }

  static createAnalysisError(
    analysisType: string,
    component: string,
    originalError?: Error
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.ANALYSIS_FAILED,
      `Analysis failed for type: ${analysisType}`,
      component,
      { analysisType, originalError: originalError?.message },
      ['Check input format', 'Verify analysis type is supported', 'Try with fallback strategy']
    );
  }

  static createProviderError(
    provider: string,
    operation: string,
    originalError?: Error
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.PROVIDER_UNAVAILABLE,
      `AI provider ${provider} is unavailable for ${operation}`,
      'ai-provider',
      { provider, operation, originalError: originalError?.message },
      ['Check API key', 'Verify network connectivity', 'Try alternative provider']
    );
  }

  static createRateLimitError(
    component: string,
    limit: number,
    timeWindow: string
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${timeWindow}`,
      component,
      { limit, timeWindow },
      ['Wait before retrying', 'Reduce request frequency', 'Upgrade rate limit plan']
    );
  }

  static createConfigError(
    message: string,
    component: string,
    configField?: string
  ): AIEngineError {
    return new AIEngineError(
      ERROR_CODES.INVALID_CONFIG,
      message,
      component,
      { configField },
      ['Check configuration file', 'Verify environment variables', 'Review documentation']
    );
  }
}

// Error handling utilities
export class ErrorHandler {
  static formatError(error: Error | AIEngineError): StandardError {
    if (error instanceof AIEngineError) {
      return error.toJSON();
    }
    
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      timestamp: Date.now(),
      component: 'unknown'
    };
  }

  static isRetryableError(error: AIEngineError): boolean {
    const retryableErrors = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.PROVIDER_UNAVAILABLE,
      ERROR_CODES.ANALYSIS_TIMEOUT,
      ERROR_CODES.CACHE_ERROR
    ];
    
    return retryableErrors.includes(error.code as ErrorCode);
  }

  static getSeverityLevel(error: AIEngineError): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverity = [
      ERROR_CODES.INVALID_API_KEY,
      ERROR_CODES.PLUGIN_VALIDATION_FAILED,
      ERROR_CODES.INTERNAL_ERROR
    ];
    
    const mediumSeverity = [
      ERROR_CODES.ANALYSIS_FAILED,
      ERROR_CODES.PLUGIN_EXECUTION_FAILED,
      ERROR_CODES.PROVIDER_UNAVAILABLE
    ];
    
    if (highSeverity.includes(error.code as ErrorCode)) return 'high';
    if (mediumSeverity.includes(error.code as ErrorCode)) return 'medium';
    
    return 'low';
  }
}
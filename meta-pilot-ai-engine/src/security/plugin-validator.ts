/**
 * Plugin Security Validator
 * Validates plugins for security vulnerabilities and compliance
 */

import { AnalyzerPlugin } from '../types/core';
import { AIEngineError, ErrorFactory, ERROR_CODES } from '../types/errors';

interface SecurityPolicy {
  allowDynamicImports: boolean;
  allowNetworkAccess: boolean;
  allowFileSystemAccess: boolean;
  allowExecute: boolean;
  maxMemoryUsage: number; // in MB
  maxExecutionTime: number; // in milliseconds
  requiredSignature: boolean;
  trustedSources: string[];
}

interface PluginManifest {
  name: string;
  version: string;
  author: string;
  permissions: string[];
  dependencies: string[];
  signature?: string;
  source?: string;
  checksum?: string;
}

export class PluginSecurityValidator {
  private securityPolicy: SecurityPolicy;
  private trustedPlugins: Set<string> = new Set();

  constructor(securityPolicy: SecurityPolicy) {
    this.securityPolicy = securityPolicy;
    
    // Add core plugins to trusted list
    this.trustedPlugins.add('nlp-analyzer');
    this.trustedPlugins.add('proposal-analyzer');
    this.trustedPlugins.add('openai-analyzer');
  }

  /**
   * Validates a plugin for security compliance
   */
  async validatePlugin(plugin: AnalyzerPlugin, manifest?: PluginManifest): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Core validation checks
      this.validatePluginStructure(plugin, result);
      this.validatePluginMetadata(plugin, result);
      
      if (manifest) {
        this.validateManifest(manifest, result);
        this.validatePermissions(manifest, result);
        this.validateSignature(manifest, result);
      }

      // Runtime security checks
      this.validateCodeStructure(plugin, result);
      this.checkForDangerousPatterns(plugin, result);
      
      // Trust validation
      this.validateTrustLevel(plugin, manifest, result);

    } catch (error) {
      result.isValid = false;
      result.violations.push({
        severity: 'critical',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR'
      });
    }

    return result;
  }

  private validatePluginStructure(plugin: AnalyzerPlugin, result: ValidationResult): void {
    // Check required properties
    const requiredProps = ['name', 'version', 'supportedTypes', 'analyze'];
    
    for (const prop of requiredProps) {
      if (!(prop in plugin)) {
        result.violations.push({
          severity: 'critical',
          message: `Missing required property: ${prop}`,
          code: 'MISSING_PROPERTY'
        });
        result.isValid = false;
      }
    }

    // Validate analyze function
    if (typeof plugin.analyze !== 'function') {
      result.violations.push({
        severity: 'critical',
        message: 'analyze property must be a function',
        code: 'INVALID_ANALYZE_FUNCTION'
      });
      result.isValid = false;
    }
  }

  private validatePluginMetadata(plugin: AnalyzerPlugin, result: ValidationResult): void {
    // Validate name format
    if (!/^[a-z0-9-]+$/.test(plugin.name)) {
      result.violations.push({
        severity: 'medium',
        message: 'Plugin name should only contain lowercase letters, numbers, and hyphens',
        code: 'INVALID_NAME_FORMAT'
      });
    }

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(plugin.version)) {
      result.violations.push({
        severity: 'medium',
        message: 'Plugin version should follow semantic versioning (x.y.z)',
        code: 'INVALID_VERSION_FORMAT'
      });
    }

    // Check metadata completeness
    if (!plugin.metadata) {
      result.warnings.push({
        severity: 'low',
        message: 'Plugin metadata is missing',
        code: 'MISSING_METADATA'
      });
    } else {
      if (!plugin.metadata.author) {
        result.warnings.push({
          severity: 'low',
          message: 'Plugin author information is missing',
          code: 'MISSING_AUTHOR'
        });
      }
      
      if (!plugin.metadata.description) {
        result.warnings.push({
          severity: 'low',
          message: 'Plugin description is missing',
          code: 'MISSING_DESCRIPTION'
        });
      }
    }
  }

  private validateManifest(manifest: PluginManifest, result: ValidationResult): void {
    // Validate manifest completeness
    const requiredFields = ['name', 'version', 'author', 'permissions'];
    
    for (const field of requiredFields) {
      if (!(field in manifest)) {
        result.violations.push({
          severity: 'high',
          message: `Missing required manifest field: ${field}`,
          code: 'MISSING_MANIFEST_FIELD'
        });
        result.isValid = false;
      }
    }

    // Validate checksum if provided
    if (manifest.checksum && !/^[a-f0-9]{64}$/.test(manifest.checksum)) {
      result.violations.push({
        severity: 'high',
        message: 'Invalid checksum format (should be SHA-256 hex)',
        code: 'INVALID_CHECKSUM'
      });
    }
  }

  private validatePermissions(manifest: PluginManifest, result: ValidationResult): void {
    const dangerousPermissions = [
      'FILE_SYSTEM_WRITE',
      'NETWORK_UNRESTRICTED',
      'EXECUTE_COMMANDS',
      'DYNAMIC_IMPORTS',
      'EVAL_CODE'
    ];

    for (const permission of manifest.permissions) {
      if (dangerousPermissions.includes(permission)) {
        if (!this.securityPolicy.allowNetworkAccess && permission.includes('NETWORK')) {
          result.violations.push({
            severity: 'critical',
            message: `Dangerous permission not allowed by policy: ${permission}`,
            code: 'FORBIDDEN_PERMISSION'
          });
          result.isValid = false;
        } else {
          result.warnings.push({
            severity: 'high',
            message: `Plugin requests dangerous permission: ${permission}`,
            code: 'DANGEROUS_PERMISSION'
          });
        }
      }
    }
  }

  private validateSignature(manifest: PluginManifest, result: ValidationResult): void {
    if (this.securityPolicy.requiredSignature) {
      if (!manifest.signature) {
        result.violations.push({
          severity: 'critical',
          message: 'Plugin signature is required by security policy',
          code: 'MISSING_SIGNATURE'
        });
        result.isValid = false;
        return;
      }

      // Validate signature format
      if (!/^[a-f0-9]{128}$/.test(manifest.signature)) {
        result.violations.push({
          severity: 'critical',
          message: 'Invalid signature format',
          code: 'INVALID_SIGNATURE'
        });
        result.isValid = false;
      }

      // Check if source is from trusted source
      if (manifest.source && this.securityPolicy.trustedSources.length > 0) {
        const isTrusted = this.securityPolicy.trustedSources.some(source => 
          manifest.source?.startsWith(source)
        );
        
        if (!isTrusted) {
          result.violations.push({
            severity: 'high',
            message: 'Plugin source is not from a trusted source',
            code: 'UNTRUSTED_SOURCE'
          });
        }
      }
    }
  }

  private validateCodeStructure(plugin: AnalyzerPlugin, result: ValidationResult): void {
    const pluginStr = plugin.toString();
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /require\s*\(/gi,
      /import\s*\(/gi,
      /process\.exit/gi,
      /process\.kill/gi,
      /child_process/gi,
      /fs\.write/gi,
      /fs\.unlink/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginStr)) {
        result.violations.push({
          severity: 'high',
          message: `Potentially dangerous code pattern detected: ${pattern.source}`,
          code: 'DANGEROUS_CODE_PATTERN'
        });
      }
    }
  }

  private checkForDangerousPatterns(plugin: AnalyzerPlugin, result: ValidationResult): void {
    try {
      // Attempt to serialize and check for circular references
      JSON.stringify(plugin);
    } catch (error) {
      result.violations.push({
        severity: 'medium',
        message: 'Plugin contains circular references or non-serializable data',
        code: 'CIRCULAR_REFERENCE'
      });
    }

    // Check for prototype pollution attempts
    if (plugin.constructor !== Object && plugin.constructor.name !== plugin.name) {
      result.warnings.push({
        severity: 'medium',
        message: 'Plugin constructor name mismatch detected',
        code: 'CONSTRUCTOR_MISMATCH'
      });
    }
  }

  private validateTrustLevel(plugin: AnalyzerPlugin, manifest: PluginManifest | undefined, result: ValidationResult): void {
    const isCoreTrusted = this.trustedPlugins.has(plugin.name);
    
    if (!isCoreTrusted) {
      result.warnings.push({
        severity: 'medium',
        message: 'Plugin is not in the core trusted plugins list',
        code: 'UNTRUSTED_PLUGIN'
      });

      // Additional scrutiny for untrusted plugins
      if (!manifest) {
        result.violations.push({
          severity: 'high',
          message: 'Untrusted plugins must provide a manifest',
          code: 'MISSING_MANIFEST'
        });
        result.isValid = false;
      }
    }
  }

  /**
   * Creates a sandboxed environment for plugin execution
   */
  createSandbox(): PluginSandbox {
    return new PluginSandbox(this.securityPolicy);
  }

  /**
   * Adds a plugin to the trusted list
   */
  addTrustedPlugin(pluginName: string): void {
    this.trustedPlugins.add(pluginName);
  }

  /**
   * Removes a plugin from the trusted list
   */
  removeTrustedPlugin(pluginName: string): void {
    this.trustedPlugins.delete(pluginName);
  }
}

/**
 * Plugin execution sandbox
 */
class PluginSandbox {
  private policy: SecurityPolicy;
  private memoryUsage: number = 0;
  private executionStart: number = 0;

  constructor(policy: SecurityPolicy) {
    this.policy = policy;
  }

  async executePlugin<T>(
    plugin: AnalyzerPlugin,
    method: string,
    args: any[]
  ): Promise<T> {
    this.executionStart = Date.now();
    
    try {
      // Monitor memory usage
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Execute with timeout
      const result = await Promise.race([
        this.executeWithTimeout(plugin, method, args),
        this.createTimeoutPromise()
      ]);

      // Check memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      this.memoryUsage = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      if (this.memoryUsage > this.policy.maxMemoryUsage) {
        throw new AIEngineError(
          ERROR_CODES.PLUGIN_EXECUTION_FAILED,
          `Plugin exceeded memory limit: ${this.memoryUsage}MB > ${this.policy.maxMemoryUsage}MB`,
          'plugin-sandbox'
        );
      }

      return result;
      
    } catch (error) {
      if (error instanceof AIEngineError) {
        throw error;
      }
      
      throw ErrorFactory.createPluginError(
        plugin.name,
        method,
        error instanceof Error ? error : new Error('Unknown execution error')
      );
    }
  }

  private async executeWithTimeout<T>(
    plugin: AnalyzerPlugin,
    method: string,
    args: any[]
  ): Promise<T> {
    const pluginMethod = (plugin as any)[method];
    
    if (typeof pluginMethod !== 'function') {
      throw new Error(`Method ${method} not found on plugin`);
    }
    
    return await pluginMethod.apply(plugin, args);
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AIEngineError(
          ERROR_CODES.ANALYSIS_TIMEOUT,
          `Plugin execution timeout after ${this.policy.maxExecutionTime}ms`,
          'plugin-sandbox'
        ));
      }, this.policy.maxExecutionTime);
    });
  }

  getExecutionStats() {
    return {
      executionTime: Date.now() - this.executionStart,
      memoryUsage: this.memoryUsage
    };
  }
}

// Types
interface ValidationResult {
  isValid: boolean;
  violations: SecurityViolation[];
  warnings: SecurityViolation[];
  recommendations: string[];
}

interface SecurityViolation {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code: string;
}

export { PluginSandbox, SecurityPolicy, PluginManifest, ValidationResult, SecurityViolation };
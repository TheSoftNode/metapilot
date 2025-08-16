"use strict";
/**
 * Core AI Engine Types - Flexible and Extensible
 * Designed for Web3 automation projects like MetaPilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDecision = exports.isMarketAnalysis = exports.isTransactionAnalysis = exports.isProposalAnalysis = exports.RuleSchema = exports.AnalysisRequestSchema = exports.DecisionSchema = void 0;
const zod_1 = require("zod");
// ==================== DECISION FRAMEWORK ====================
exports.DecisionSchema = zod_1.z.object({
    action: zod_1.z.enum(['EXECUTE', 'WAIT', 'SKIP', 'DELEGATE', 'ALERT']),
    confidence: zod_1.z.number().min(0).max(100),
    reasoning: zod_1.z.array(zod_1.z.string()),
    metadata: zod_1.z.record(zod_1.z.unknown()),
    alternatives: zod_1.z.array(zod_1.z.object({
        action: zod_1.z.string(),
        reasoning: zod_1.z.string(),
        confidence: zod_1.z.number()
    })).optional(),
    riskAssessment: zod_1.z.object({
        level: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        factors: zod_1.z.array(zod_1.z.string()),
        mitigations: zod_1.z.array(zod_1.z.string()).optional()
    }),
    executionPlan: zod_1.z.object({
        steps: zod_1.z.array(zod_1.z.string()),
        estimatedTime: zod_1.z.string(),
        requirements: zod_1.z.array(zod_1.z.string()).optional()
    }).optional()
});
// ==================== EXPORT SCHEMAS ====================
exports.AnalysisRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    input: zod_1.z.object({
        text: zod_1.z.string().optional(),
        data: zod_1.z.record(zod_1.z.unknown()).optional(),
        rawData: zod_1.z.unknown().optional()
    }),
    context: zod_1.z.object({
        blockchain: zod_1.z.string().optional(),
        protocol: zod_1.z.string().optional(),
        timeframe: zod_1.z.string().optional(),
        customParameters: zod_1.z.record(zod_1.z.unknown()).optional()
    }),
    options: zod_1.z.object({
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        timeout: zod_1.z.number().optional(),
        fallbackStrategy: zod_1.z.enum(['basic', 'cache', 'skip']).optional(),
        providers: zod_1.z.array(zod_1.z.string()).optional(),
        caching: zod_1.z.boolean().optional()
    }),
    timestamp: zod_1.z.number()
});
exports.RuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    condition: zod_1.z.object({
        type: zod_1.z.enum(['natural_language', 'logical', 'composite']),
        expression: zod_1.z.string(),
        parameters: zod_1.z.record(zod_1.z.unknown()).optional(),
        confidence_threshold: zod_1.z.number().min(0).max(100).optional()
    }),
    action: zod_1.z.object({
        type: zod_1.z.string(),
        parameters: zod_1.z.record(zod_1.z.unknown()),
        confirmation_required: zod_1.z.boolean().optional(),
        conditions: zod_1.z.array(zod_1.z.any()).optional()
    }),
    enabled: zod_1.z.boolean(),
    priority: zod_1.z.number(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
// ==================== TYPE GUARDS ====================
function isProposalAnalysis(input) {
    return 'proposalId' in input && 'proposalText' in input;
}
exports.isProposalAnalysis = isProposalAnalysis;
function isTransactionAnalysis(input) {
    return 'transactionType' in input;
}
exports.isTransactionAnalysis = isTransactionAnalysis;
function isMarketAnalysis(input) {
    return 'assets' in input && Array.isArray(input.assets);
}
exports.isMarketAnalysis = isMarketAnalysis;
function isValidDecision(decision) {
    try {
        exports.DecisionSchema.parse(decision);
        return true;
    }
    catch {
        return false;
    }
}
exports.isValidDecision = isValidDecision;
//# sourceMappingURL=core.js.map
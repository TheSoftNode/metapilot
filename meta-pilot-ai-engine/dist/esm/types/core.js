/**
 * Core AI Engine Types - Flexible and Extensible
 * Designed for Web3 automation projects like MetaPilot
 */
import { z } from 'zod';
// ==================== DECISION FRAMEWORK ====================
export const DecisionSchema = z.object({
    action: z.enum(['EXECUTE', 'WAIT', 'SKIP', 'DELEGATE', 'ALERT']),
    confidence: z.number().min(0).max(100),
    reasoning: z.array(z.string()),
    metadata: z.record(z.unknown()),
    alternatives: z.array(z.object({
        action: z.string(),
        reasoning: z.string(),
        confidence: z.number()
    })).optional(),
    riskAssessment: z.object({
        level: z.enum(['low', 'medium', 'high', 'critical']),
        factors: z.array(z.string()),
        mitigations: z.array(z.string()).optional()
    }),
    executionPlan: z.object({
        steps: z.array(z.string()),
        estimatedTime: z.string(),
        requirements: z.array(z.string()).optional()
    }).optional()
});
// ==================== EXPORT SCHEMAS ====================
export const AnalysisRequestSchema = z.object({
    id: z.string(),
    type: z.string(),
    input: z.object({
        text: z.string().optional(),
        data: z.record(z.unknown()).optional(),
        rawData: z.unknown().optional()
    }),
    context: z.object({
        blockchain: z.string().optional(),
        protocol: z.string().optional(),
        timeframe: z.string().optional(),
        customParameters: z.record(z.unknown()).optional()
    }),
    options: z.object({
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        timeout: z.number().optional(),
        fallbackStrategy: z.enum(['basic', 'cache', 'skip']).optional(),
        providers: z.array(z.string()).optional(),
        caching: z.boolean().optional()
    }),
    timestamp: z.number()
});
export const RuleSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    condition: z.object({
        type: z.enum(['natural_language', 'logical', 'composite']),
        expression: z.string(),
        parameters: z.record(z.unknown()).optional(),
        confidence_threshold: z.number().min(0).max(100).optional()
    }),
    action: z.object({
        type: z.string(),
        parameters: z.record(z.unknown()),
        confirmation_required: z.boolean().optional(),
        conditions: z.array(z.any()).optional()
    }),
    enabled: z.boolean(),
    priority: z.number(),
    metadata: z.record(z.unknown()).optional()
});
// ==================== TYPE GUARDS ====================
export function isProposalAnalysis(input) {
    return 'proposalId' in input && 'proposalText' in input;
}
export function isTransactionAnalysis(input) {
    return 'transactionType' in input;
}
export function isMarketAnalysis(input) {
    return 'assets' in input && Array.isArray(input.assets);
}
export function isValidDecision(decision) {
    try {
        DecisionSchema.parse(decision);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=core.js.map
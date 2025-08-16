/**
 * OpenAI Enhanced Analyzer
 * Integrates with OpenAI GPT models for advanced analysis
 */
import { AnalyzerPlugin, AnalysisRequest, AnalysisResult, PluginMetadata } from '../types/core';
export declare class OpenAIAnalyzer implements AnalyzerPlugin {
    name: string;
    version: string;
    supportedTypes: string[];
    metadata: PluginMetadata;
    private openai;
    private defaultModel;
    constructor(apiKey: string, model?: string);
    analyze(request: AnalysisRequest): Promise<AnalysisResult>;
    private performEnhancedAnalysis;
    private getSystemPrompt;
    private buildAnalysisPrompt;
    private parseOpenAIResponse;
    private extractContextFactors;
    private generateMitigations;
    private generateExecutionPlan;
    private estimateExecutionTime;
    private getExecutionRequirements;
    analyzeWithContext(request: AnalysisRequest, additionalContext: any): Promise<AnalysisResult>;
    compareOptions(options: {
        option: string;
        data: any;
    }[], criteria: string[]): Promise<AnalysisResult>;
    private buildComparisonPrompt;
    private parseComparisonResponse;
    validate(request: AnalysisRequest): boolean;
}
export default OpenAIAnalyzer;
//# sourceMappingURL=openai-analyzer.d.ts.map
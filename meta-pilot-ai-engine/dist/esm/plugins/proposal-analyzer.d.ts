/**
 * DAO Proposal Analyzer Plugin
 * Specialized analyzer for DAO governance proposals
 */
import { AnalyzerPlugin, AnalysisRequest, AnalysisResult, PluginMetadata } from '../types/core';
export declare class ProposalAnalyzer implements AnalyzerPlugin {
    name: string;
    version: string;
    supportedTypes: string[];
    supportedBlockchains: string[];
    metadata: PluginMetadata;
    private daoPatterns;
    private riskKeywords;
    private positiveKeywords;
    analyze(request: AnalysisRequest): Promise<AnalysisResult>;
    private analyzeProposal;
    private detectProposalType;
    private assessRisks;
    private analyzeBenefits;
    private analyzeStakeholderImpact;
    private assessStakeholderImpact;
    private assessImplementationFeasibility;
    private getHistoricalContext;
    private getRecommendedApproach;
    private assessCommunityAlignment;
    private assessEconomicImpact;
    private analyzeTimeline;
    private checkCompliance;
    private generateDecision;
    private generateMitigations;
    private containsConcept;
    private extractFinancialAmounts;
    validate(request: AnalysisRequest): boolean;
}
export default ProposalAnalyzer;
//# sourceMappingURL=proposal-analyzer.d.ts.map
/**
 * Natural Language Processing Analyzer Plugin
 * Advanced NLP capabilities for text analysis and understanding
 */
import { AnalyzerPlugin, AnalysisRequest, AnalysisResult, PluginMetadata } from '../types/core';
export declare class NLPAnalyzer implements AnalyzerPlugin {
    name: string;
    version: string;
    supportedTypes: string[];
    metadata: PluginMetadata;
    private tokenizer;
    private stemmer;
    private sentimentAnalyzer;
    private tfidf;
    analyze(request: AnalysisRequest): Promise<AnalysisResult>;
    private analyzeSentiment;
    private analyzeProposal;
    private analyzeText;
    private normalizeSentimentScore;
    private extractEmotions;
    private calculateSubjectivity;
    private calculateIntensity;
    private extractKeyPhrases;
    private classifyProposalType;
    private assessUrgency;
    private identifyStakeholders;
    private extractProposedActions;
    private calculateProposalQuality;
    private makeProposalDecision;
    private calculateProposalConfidence;
    private extractEntities;
    private extractTopics;
    private calculateComplexity;
    private calculateReadability;
    private countSyllables;
    private classifyText;
    private calculateTextConfidence;
    validate(request: AnalysisRequest): boolean;
}
export default NLPAnalyzer;
//# sourceMappingURL=nlp-analyzer.d.ts.map
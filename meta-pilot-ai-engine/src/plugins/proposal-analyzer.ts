/**
 * DAO Proposal Analyzer Plugin
 * Specialized analyzer for DAO governance proposals
 */

import { 
  AnalyzerPlugin, 
  AnalysisRequest, 
  AnalysisResult, 
  AIDecision,
  PluginMetadata,
  isProposalAnalysis
} from '../types/core';
import { ErrorFactory } from '../types/errors';

export class ProposalAnalyzer implements AnalyzerPlugin {
  name = 'proposal-analyzer';
  version = '1.0.0';
  supportedTypes = ['proposal', 'dao', 'governance'];
  supportedBlockchains = ['ethereum', 'solana', 'polygon', 'arbitrum'];
  
  metadata: PluginMetadata = {
    author: 'MetaPilot AI Team',
    description: 'Specialized analyzer for DAO governance proposals with deep domain knowledge',
    dependencies: []
  };

  // DAO-specific knowledge base
  private daoPatterns = {
    treasury: {
      keywords: ['treasury', 'fund', 'allocate', 'budget', 'spend', 'grant', 'payment'],
      riskFactors: ['large amounts', 'unspecified use', 'new recipients'],
      positiveSignals: ['detailed budget', 'milestone-based', 'community benefit']
    },
    technical: {
      keywords: ['upgrade', 'implement', 'deploy', 'contract', 'protocol', 'code'],
      riskFactors: ['unaudited code', 'breaking changes', 'rushed timeline'],
      positiveSignals: ['audited', 'tested', 'gradual rollout']
    },
    governance: {
      keywords: ['governance', 'voting', 'parameter', 'rule', 'process', 'delegation'],
      riskFactors: ['centralization', 'reduced decentralization', 'voting power concentration'],
      positiveSignals: ['increased participation', 'transparency', 'checks and balances']
    },
    social: {
      keywords: ['community', 'education', 'outreach', 'events', 'partnerships'],
      riskFactors: ['vague objectives', 'no measurable outcomes'],
      positiveSignals: ['clear goals', 'measurable metrics', 'community input']
    }
  };

  private riskKeywords = [
    'emergency', 'urgent', 'bypass', 'override', 'immediate', 'unlimited',
    'unrestricted', 'multisig', 'admin', 'centralized', 'temporary'
  ];

  private positiveKeywords = [
    'transparent', 'audited', 'gradual', 'reversible', 'community',
    'tested', 'milestone', 'decentralized', 'open-source', 'public'
  ];

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      if (!isProposalAnalysis(request.input)) {
        throw ErrorFactory.createValidationError(
          'Invalid proposal input format',
          'proposal-analyzer',
          'input',
          ['Ensure proposalText or text field is provided', 'Include proposalId or daoName']
        );
      }

      const proposalInput = request.input;
      const decision = await this.analyzeProposal(proposalInput, request);

      return {
        success: true,
        decision,
        processingTime: Date.now() - startTime,
        provider: this.name,
        metadata: {
          proposalId: proposalInput.proposalId,
          daoName: proposalInput.daoName,
          proposalType: proposalInput.proposalType
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proposal analysis failed',
        processingTime: Date.now() - startTime,
        provider: this.name
      };
    }
  }

  private async analyzeProposal(proposalInput: any, request: AnalysisRequest): Promise<AIDecision> {
    // Handle both proposalText and text fields for flexibility
    const text = proposalInput.proposalText || proposalInput.text;
    if (!text) {
      throw ErrorFactory.createValidationError(
        'Proposal text is required (either proposalText or text field)',
        'proposal-analyzer',
        'text',
        ['Provide proposalText field', 'Provide text field with proposal content']
      );
    }
    
    const daoName = proposalInput.daoName;
    const proposalType = proposalInput.proposalType || this.detectProposalType(text);
    
    // Deep proposal analysis
    const analysis = {
      type: proposalType,
      riskAssessment: this.assessRisks(text, proposalType),
      benefitAnalysis: this.analyzeBenefits(text, proposalType),
      stakeholderImpact: this.analyzeStakeholderImpact(text),
      implementationFeasibility: this.assessImplementationFeasibility(text),
      historicalContext: this.getHistoricalContext(daoName, proposalType),
      communityAlignment: this.assessCommunityAlignment(text, request.context),
      economicImpact: this.assessEconomicImpact(text, proposalInput),
      timelineAnalysis: this.analyzeTimeline(text),
      complianceCheck: this.checkCompliance(text, daoName)
    };

    // Generate decision based on comprehensive analysis
    const decision = this.generateDecision(analysis, proposalInput, request.context);
    
    return decision;
  }

  private detectProposalType(text: string): string {
    const textLower = text.toLowerCase();
    let maxScore = 0;
    let detectedType = 'general';

    Object.entries(this.daoPatterns).forEach(([type, pattern]) => {
      const score = pattern.keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = textLower.match(regex) || [];
        return acc + matches.length;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    });

    return detectedType;
  }

  private assessRisks(text: string, proposalType: string): any {
    const textLower = text.toLowerCase();
    const risks = [];
    let riskScore = 0;

    // General risk keywords
    this.riskKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        risks.push(`Contains risk keyword: ${keyword}`);
        riskScore += 0.1;
      }
    });

    // Type-specific risk assessment
    const typePattern = this.daoPatterns[proposalType as keyof typeof this.daoPatterns];
    if (typePattern) {
      typePattern.riskFactors.forEach(factor => {
        if (this.containsConcept(textLower, factor)) {
          risks.push(`${proposalType} risk: ${factor}`);
          riskScore += 0.15;
        }
      });
    }

    // Financial risk assessment
    const amounts = this.extractFinancialAmounts(text);
    if (amounts.length > 0) {
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 1000000) { // Large amounts (configurable)
        risks.push(`Large financial amount: ${maxAmount}`);
        riskScore += 0.2;
      }
    }

    // Timeline risk assessment
    const hasUrgentTimeline = /\b(immediate|asap|urgent|emergency)\b/i.test(text);
    if (hasUrgentTimeline) {
      risks.push('Urgent timeline may indicate insufficient review time');
      riskScore += 0.1;
    }

    return {
      risks,
      riskScore: Math.min(1, riskScore),
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'
    };
  }

  private analyzeBenefits(text: string, proposalType: string): any {
    const textLower = text.toLowerCase();
    const benefits: string[] = [];
    let benefitScore = 0;

    // General positive indicators
    this.positiveKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        benefits.push(`Positive indicator: ${keyword}`);
        benefitScore += 0.1;
      }
    });

    // Type-specific benefit assessment
    const typePattern = this.daoPatterns[proposalType as keyof typeof this.daoPatterns];
    if (typePattern) {
      typePattern.positiveSignals.forEach(signal => {
        if (this.containsConcept(textLower, signal)) {
          benefits.push(`${proposalType} benefit: ${signal}`);
          benefitScore += 0.15;
        }
      });
    }

    // Innovation and improvement indicators
    const innovationKeywords = ['improve', 'enhance', 'optimize', 'innovate', 'advance'];
    innovationKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        benefits.push(`Innovation indicator: ${keyword}`);
        benefitScore += 0.1;
      }
    });

    return {
      benefits,
      benefitScore: Math.min(1, benefitScore),
      benefitLevel: benefitScore > 0.7 ? 'high' : benefitScore > 0.4 ? 'medium' : 'low'
    };
  }

  private analyzeStakeholderImpact(text: string): any {
    const stakeholders = {
      tokenHolders: this.assessStakeholderImpact(text, ['holder', 'token', 'governance']),
      developers: this.assessStakeholderImpact(text, ['developer', 'build', 'code', 'technical']),
      users: this.assessStakeholderImpact(text, ['user', 'participant', 'community']),
      validators: this.assessStakeholderImpact(text, ['validator', 'node', 'staker']),
      partners: this.assessStakeholderImpact(text, ['partner', 'integration', 'collaboration'])
    };

    const totalImpact = Object.values(stakeholders).reduce((sum: number, impact: any) => sum + impact.score, 0);
    const avgImpact = totalImpact / Object.keys(stakeholders).length;

    return {
      stakeholders,
      overallImpact: avgImpact,
      impactLevel: avgImpact > 0.6 ? 'high' : avgImpact > 0.3 ? 'medium' : 'low'
    };
  }

  private assessStakeholderImpact(text: string, keywords: string[]): any {
    const textLower = text.toLowerCase();
    let mentions = 0;
    let impactIndicators = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = textLower.match(regex) || [];
      mentions += matches.length;
    });

    // Look for impact indicators
    const impactWords = ['affect', 'impact', 'benefit', 'improve', 'change', 'influence'];
    impactWords.forEach(word => {
      if (textLower.includes(word)) {
        impactIndicators++;
      }
    });

    const score = Math.min(1, (mentions * 0.2) + (impactIndicators * 0.1));
    
    return {
      mentions,
      impactIndicators,
      score,
      level: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low'
    };
  }

  private assessImplementationFeasibility(text: string): any {
    const textLower = text.toLowerCase();
    let feasibilityScore = 0.5; // Start with neutral
    const factors = [];

    // Positive feasibility indicators
    const positiveIndicators = [
      'timeline', 'milestone', 'phase', 'gradual', 'tested', 'proven',
      'resource', 'team', 'experience', 'budget', 'plan'
    ];

    positiveIndicators.forEach(indicator => {
      if (textLower.includes(indicator)) {
        feasibilityScore += 0.05;
        factors.push(`Positive: Contains ${indicator}`);
      }
    });

    // Negative feasibility indicators
    const negativeIndicators = [
      'complex', 'difficult', 'challenging', 'unproven', 'experimental',
      'risky', 'uncertain', 'ambitious'
    ];

    negativeIndicators.forEach(indicator => {
      if (textLower.includes(indicator)) {
        feasibilityScore -= 0.05;
        factors.push(`Concern: Contains ${indicator}`);
      }
    });

    // Technical complexity assessment
    const technicalWords = ['contract', 'protocol', 'algorithm', 'consensus', 'cryptographic'];
    const technicalComplexity = technicalWords.filter(word => textLower.includes(word)).length;
    
    if (technicalComplexity > 3) {
      feasibilityScore -= 0.1;
      factors.push('High technical complexity detected');
    }

    feasibilityScore = Math.max(0, Math.min(1, feasibilityScore));

    return {
      score: feasibilityScore,
      level: feasibilityScore > 0.7 ? 'high' : feasibilityScore > 0.4 ? 'medium' : 'low',
      factors
    };
  }

  private getHistoricalContext(daoName: string, proposalType: string): any {
    // This would integrate with historical data in a real implementation
    // For now, return mock analysis based on known patterns
    
    const knownDAOs = {
      'uniswap': { successRate: 0.85, avgDiscussion: 7, riskTolerance: 'medium' },
      'compound': { successRate: 0.78, avgDiscussion: 10, riskTolerance: 'low' },
      'aave': { successRate: 0.82, avgDiscussion: 8, riskTolerance: 'medium' },
      'ens': { successRate: 0.90, avgDiscussion: 5, riskTolerance: 'high' }
    };

    const daoKey = daoName.toLowerCase();
    const daoData = knownDAOs[daoKey as keyof typeof knownDAOs] || 
                   { successRate: 0.75, avgDiscussion: 7, riskTolerance: 'medium' };

    return {
      daoSuccessRate: daoData.successRate,
      averageDiscussionDays: daoData.avgDiscussion,
      riskTolerance: daoData.riskTolerance,
      recommendedApproach: this.getRecommendedApproach(daoData, proposalType)
    };
  }

  private getRecommendedApproach(daoData: any, proposalType: string): string {
    if (daoData.riskTolerance === 'low' && proposalType === 'treasury') {
      return 'Conservative approach recommended - ensure detailed budget and milestones';
    }
    if (daoData.riskTolerance === 'high' && proposalType === 'technical') {
      return 'Innovative approach welcomed - focus on clear implementation plan';
    }
    return 'Standard governance process recommended';
  }

  private assessCommunityAlignment(text: string, context: any): any {
    const textLower = text.toLowerCase();
    let alignmentScore = 0.5;
    const factors = [];

    // Community-focused language
    const communityWords = ['community', 'together', 'collective', 'shared', 'inclusive'];
    const communityMentions = communityWords.filter(word => textLower.includes(word)).length;
    
    if (communityMentions > 0) {
      alignmentScore += communityMentions * 0.1;
      factors.push(`Community-focused language: ${communityMentions} mentions`);
    }

    // Transparency indicators
    const transparencyWords = ['transparent', 'open', 'public', 'report', 'update'];
    const transparencyMentions = transparencyWords.filter(word => textLower.includes(word)).length;
    
    if (transparencyMentions > 0) {
      alignmentScore += transparencyMentions * 0.08;
      factors.push(`Transparency indicators: ${transparencyMentions} mentions`);
    }

    // Previous community feedback (would be real data in implementation)
    if (context.communityFeedback) {
      const feedbackScore = context.communityFeedback.sentiment || 0;
      alignmentScore += feedbackScore * 0.2;
      factors.push(`Previous community feedback: ${feedbackScore}`);
    }

    alignmentScore = Math.max(0, Math.min(1, alignmentScore));

    return {
      score: alignmentScore,
      level: alignmentScore > 0.7 ? 'high' : alignmentScore > 0.4 ? 'medium' : 'low',
      factors
    };
  }

  private assessEconomicImpact(text: string, proposalInput: any): any {
    const amounts = this.extractFinancialAmounts(text);
    const textLower = text.toLowerCase();

    let economicImpact = 0.5; // Neutral starting point
    const factors = [];

    // Financial magnitude assessment
    if (amounts.length > 0) {
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      
      // Assess relative to DAO treasury (if known)
      if (proposalInput.treasurySize) {
        const percentage = (totalAmount / proposalInput.treasurySize) * 100;
        
        if (percentage > 10) {
          economicImpact -= 0.2;
          factors.push(`Large treasury allocation: ${percentage.toFixed(1)}%`);
        } else if (percentage > 5) {
          economicImpact -= 0.1;
          factors.push(`Moderate treasury allocation: ${percentage.toFixed(1)}%`);
        }
      }
    }

    // Revenue generation potential
    const revenueKeywords = ['revenue', 'income', 'generate', 'profit', 'return'];
    const revenueIndicators = revenueKeywords.filter(word => textLower.includes(word)).length;
    
    if (revenueIndicators > 0) {
      economicImpact += 0.1;
      factors.push(`Revenue generation potential indicated`);
    }

    // Cost efficiency indicators
    const efficiencyKeywords = ['efficient', 'optimize', 'reduce cost', 'save'];
    const efficiencyIndicators = efficiencyKeywords.filter(word => textLower.includes(word)).length;
    
    if (efficiencyIndicators > 0) {
      economicImpact += 0.1;
      factors.push(`Cost efficiency improvements indicated`);
    }

    economicImpact = Math.max(0, Math.min(1, economicImpact));

    return {
      financialAmounts: amounts,
      totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
      impactScore: economicImpact,
      impactLevel: economicImpact > 0.7 ? 'positive' : economicImpact < 0.3 ? 'negative' : 'neutral',
      factors
    };
  }

  private analyzeTimeline(text: string): any {
    const textLower = text.toLowerCase();
    
    // Extract timeline mentions
    const timelineRegex = /\b(\d+)\s*(day|week|month|year)s?\b/gi;
    const timelineMatches = text.match(timelineRegex) || [];
    
    // Urgency assessment
    const urgencyKeywords = ['immediate', 'urgent', 'asap', 'emergency', 'critical'];
    const hasUrgency = urgencyKeywords.some(keyword => textLower.includes(keyword));
    
    // Planning indicators
    const planningKeywords = ['timeline', 'schedule', 'milestone', 'phase', 'roadmap'];
    const hasPlanning = planningKeywords.some(keyword => textLower.includes(keyword));

    let timelineScore = 0.5;
    const factors = [];

    if (hasPlanning) {
      timelineScore += 0.2;
      factors.push('Timeline planning indicated');
    }

    if (hasUrgency) {
      timelineScore -= 0.1;
      factors.push('Urgency detected - may need expedited review');
    }

    if (timelineMatches.length > 0) {
      timelineScore += 0.1;
      factors.push(`Specific timelines mentioned: ${timelineMatches.join(', ')}`);
    }

    return {
      timelineMentions: timelineMatches,
      hasUrgency,
      hasPlanning,
      score: Math.max(0, Math.min(1, timelineScore)),
      factors
    };
  }

  private checkCompliance(text: string, daoName: string): any {
    const textLower = text.toLowerCase();
    const complianceIssues = [];
    let complianceScore = 1.0; // Start with full compliance

    // Check for governance process adherence
    const governanceKeywords = ['discuss', 'feedback', 'review', 'vote', 'proposal'];
    const governanceMentions = governanceKeywords.filter(word => textLower.includes(word)).length;
    
    if (governanceMentions < 2) {
      complianceIssues.push('Limited governance process mentions');
      complianceScore -= 0.1;
    }

    // Check for transparency requirements
    const transparencyRequired = ['details', 'specification', 'implementation', 'outcome'];
    const transparencyMentions = transparencyRequired.filter(word => textLower.includes(word)).length;
    
    if (transparencyMentions < 2) {
      complianceIssues.push('Insufficient detail for transparency requirements');
      complianceScore -= 0.1;
    }

    // Check for risk disclosure
    const riskDisclosure = textLower.includes('risk') || textLower.includes('consideration');
    if (!riskDisclosure) {
      complianceIssues.push('No risk considerations mentioned');
      complianceScore -= 0.1;
    }

    return {
      score: Math.max(0, complianceScore),
      issues: complianceIssues,
      level: complianceScore > 0.8 ? 'compliant' : complianceScore > 0.6 ? 'minor_issues' : 'major_issues'
    };
  }

  private generateDecision(analysis: any, proposalInput: any, context: any): AIDecision {
    let confidence = 50; // Base confidence
    const reasoning = [];
    let action: 'EXECUTE' | 'WAIT' | 'SKIP' = 'WAIT';
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    // Risk assessment influence
    if (analysis.riskAssessment.riskLevel === 'high') {
      action = 'SKIP';
      reasoning.push(`High risk detected: ${analysis.riskAssessment.risks.join(', ')}`);
      riskLevel = 'high';
      confidence -= 20;
    } else if (analysis.riskAssessment.riskLevel === 'low') {
      confidence += 15;
      reasoning.push('Low risk assessment supports execution');
    }

    // Benefit analysis influence
    if (analysis.benefitAnalysis.benefitLevel === 'high') {
      if (action !== 'SKIP') action = 'EXECUTE';
      reasoning.push(`High benefits identified: ${analysis.benefitAnalysis.benefits.join(', ')}`);
      confidence += 20;
    }

    // Implementation feasibility
    if (analysis.implementationFeasibility.level === 'low') {
      action = 'WAIT';
      reasoning.push('Low implementation feasibility suggests waiting for more details');
      confidence -= 15;
    } else if (analysis.implementationFeasibility.level === 'high') {
      confidence += 10;
    }

    // Community alignment
    if (analysis.communityAlignment.level === 'high') {
      confidence += 15;
      reasoning.push('Strong community alignment detected');
    } else if (analysis.communityAlignment.level === 'low') {
      confidence -= 10;
      reasoning.push('Limited community alignment, proceed with caution');
    }

    // Historical context
    const historicalSuccess = analysis.historicalContext.daoSuccessRate;
    if (historicalSuccess > 0.8) {
      confidence += 10;
      reasoning.push(`DAO has strong track record (${(historicalSuccess * 100).toFixed(0)}% success rate)`);
    }

    // Economic impact
    if (analysis.economicImpact.impactLevel === 'negative') {
      action = analysis.riskAssessment.riskLevel === 'high' ? 'SKIP' : 'WAIT';
      reasoning.push('Negative economic impact concerns');
      confidence -= 15;
    }

    // Compliance check
    if (analysis.complianceCheck.level === 'major_issues') {
      action = 'WAIT';
      reasoning.push(`Compliance issues: ${analysis.complianceCheck.issues.join(', ')}`);
      confidence -= 20;
    }

    // Final confidence bounds
    confidence = Math.max(10, Math.min(95, confidence));

    // Risk level determination
    if (analysis.riskAssessment.riskLevel === 'high' || 
        analysis.complianceCheck.level === 'major_issues') {
      riskLevel = 'high';
    } else if (analysis.economicImpact.impactLevel === 'negative' ||
               analysis.implementationFeasibility.level === 'low') {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      action,
      confidence,
      reasoning,
      metadata: {
        proposalType: analysis.type,
        riskAssessment: analysis.riskAssessment,
        benefitAnalysis: analysis.benefitAnalysis,
        stakeholderImpact: analysis.stakeholderImpact,
        implementationFeasibility: analysis.implementationFeasibility,
        historicalContext: analysis.historicalContext,
        communityAlignment: analysis.communityAlignment,
        economicImpact: analysis.economicImpact,
        timelineAnalysis: analysis.timelineAnalysis,
        complianceCheck: analysis.complianceCheck
      },
      riskAssessment: {
        level: riskLevel,
        factors: analysis.riskAssessment.risks,
        mitigations: this.generateMitigations(analysis)
      }
    };
  }

  private generateMitigations(analysis: any): string[] {
    const mitigations = [];

    if (analysis.riskAssessment.riskLevel === 'high') {
      mitigations.push('Request additional risk assessment and mitigation plan');
    }

    if (analysis.implementationFeasibility.level === 'low') {
      mitigations.push('Request detailed implementation roadmap with milestones');
    }

    if (analysis.economicImpact.impactLevel === 'negative') {
      mitigations.push('Consider phased implementation to limit financial exposure');
    }

    if (analysis.complianceCheck.level !== 'compliant') {
      mitigations.push('Address compliance issues before proceeding');
    }

    if (analysis.communityAlignment.level === 'low') {
      mitigations.push('Gather additional community feedback and input');
    }

    return mitigations;
  }

  // ==================== HELPER METHODS ====================

  private containsConcept(text: string, concept: string): boolean {
    const conceptWords = concept.toLowerCase().split(' ');
    return conceptWords.some(word => text.includes(word));
  }

  private extractFinancialAmounts(text: string): number[] {
    const amountRegex = /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|ETH|SOL|BTC|million|M|thousand|K|billion|B)?/gi;
    const matches = text.match(amountRegex) || [];
    
    return matches.map(match => {
      const numStr = match.replace(/[$,]/g, '').match(/\d+(?:\.\d{2})?/)?.[0] || '0';
      let amount = parseFloat(numStr);
      
      // Handle multipliers
      if (/million|M/i.test(match)) amount *= 1000000;
      else if (/thousand|K/i.test(match)) amount *= 1000;
      else if (/billion|B/i.test(match)) amount *= 1000000000;
      
      return amount;
    });
  }

  validate(request: AnalysisRequest): boolean {
    return isProposalAnalysis(request.input) && 
           !!(request.input.proposalText || request.input.text);
  }
}

export default ProposalAnalyzer;
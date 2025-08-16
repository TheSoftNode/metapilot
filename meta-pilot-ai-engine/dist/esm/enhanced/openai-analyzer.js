/**
 * OpenAI Enhanced Analyzer
 * Integrates with OpenAI GPT models for advanced analysis
 */
import OpenAI from 'openai';
export class OpenAIAnalyzer {
    constructor(apiKey, model) {
        this.name = 'openai-analyzer';
        this.version = '1.0.0';
        this.supportedTypes = ['enhanced', 'complex', 'contextual', 'cross-reference'];
        this.metadata = {
            author: 'MetaPilot AI Team',
            description: 'Advanced AI analysis using OpenAI GPT models for complex reasoning',
            dependencies: ['openai']
        };
        this.defaultModel = 'gpt-4-turbo-preview';
        this.openai = new OpenAI({ apiKey });
        if (model)
            this.defaultModel = model;
    }
    async analyze(request) {
        const startTime = Date.now();
        try {
            const decision = await this.performEnhancedAnalysis(request);
            return {
                success: true,
                decision,
                processingTime: Date.now() - startTime,
                provider: this.name,
                metadata: {
                    model: this.defaultModel,
                    enhancedAnalysis: true
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'OpenAI analysis failed',
                processingTime: Date.now() - startTime,
                provider: this.name
            };
        }
    }
    async performEnhancedAnalysis(request) {
        const prompt = this.buildAnalysisPrompt(request);
        try {
            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt(request.type)
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 2000
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }
            const analysis = JSON.parse(content);
            return this.parseOpenAIResponse(analysis, request);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('rate limit')) {
                throw new Error('OpenAI rate limit reached');
            }
            throw error;
        }
    }
    getSystemPrompt(analysisType) {
        const basePrompt = `You are an expert AI assistant specializing in Web3 and DAO governance analysis. You provide detailed, nuanced analysis with high accuracy.

Your responses must be in JSON format with the following structure:
{
  "action": "EXECUTE" | "WAIT" | "SKIP",
  "confidence": number (0-100),
  "reasoning": ["reason1", "reason2", "reason3"],
  "keyFactors": ["factor1", "factor2"],
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskFactors": ["risk1", "risk2"],
  "expectedOutcome": "description",
  "alternatives": [{"action": "alternative", "reasoning": "why"}],
  "metadata": {
    "analysis_depth": "deep" | "standard" | "quick",
    "confidence_factors": ["factor1", "factor2"],
    "domain_expertise": ["area1", "area2"]
  }
}`;
        const typeSpecificPrompts = {
            proposal: `${basePrompt}

Specifically for DAO proposals, consider:
- Governance implications and precedents
- Economic impact and treasury management
- Community alignment and stakeholder effects  
- Implementation feasibility and technical risks
- Historical context and similar proposals
- Regulatory and compliance considerations`,
            market: `${basePrompt}

For market analysis, focus on:
- Price trends and technical indicators
- Market sentiment and momentum
- Fundamental analysis and tokenomics
- Liquidity and trading volume patterns
- External factors and market correlations
- Risk/reward assessment`,
            transaction: `${basePrompt}

For transaction analysis, evaluate:
- Gas optimization and timing
- Slippage and price impact
- Security and smart contract risks
- Optimal execution strategies
- Market conditions and liquidity
- Alternative execution paths`
        };
        return typeSpecificPrompts[analysisType] || basePrompt;
    }
    buildAnalysisPrompt(request) {
        let prompt = `Please analyze the following ${request.type} data:\n\n`;
        // Add input data
        if (request.input.text) {
            prompt += `Text: ${request.input.text}\n\n`;
        }
        if (request.input.data) {
            prompt += `Data: ${JSON.stringify(request.input.data, null, 2)}\n\n`;
        }
        // Add context
        if (request.context.blockchain) {
            prompt += `Blockchain: ${request.context.blockchain}\n`;
        }
        if (request.context.protocol) {
            prompt += `Protocol: ${request.context.protocol}\n`;
        }
        if (request.context.marketConditions) {
            prompt += `Market Conditions: ${JSON.stringify(request.context.marketConditions, null, 2)}\n`;
        }
        if (request.context.userHistory && request.context.userHistory.length > 0) {
            prompt += `User History: ${request.context.userHistory.slice(-5).map(h => `${h.action} (${h.outcome})`).join(', ')}\n`;
        }
        // Add specific analysis requirements
        prompt += `\nAnalysis Requirements:
- Provide confidence level (0-100) based on data quality and certainty
- Identify key factors that influence the decision
- Assess risks and potential negative outcomes
- Consider alternative approaches or actions
- Factor in the current market/protocol context
- Be specific about reasoning and evidence

Priority: ${request.options.priority}
Timeout: ${request.options.timeout || 'standard'}`;
        return prompt;
    }
    parseOpenAIResponse(analysis, request) {
        // Validate OpenAI response structure
        if (!analysis.action || !analysis.confidence || !analysis.reasoning) {
            throw new Error('Invalid OpenAI response structure');
        }
        // Enhanced metadata from OpenAI analysis
        const enhancedMetadata = {
            ...analysis.metadata,
            openaiModel: this.defaultModel,
            analysisType: request.type,
            contextFactors: this.extractContextFactors(request),
            enhancedReasoning: analysis.reasoning,
            keyFactors: analysis.keyFactors || [],
            alternatives: analysis.alternatives || [],
            expectedOutcome: analysis.expectedOutcome,
            analysisTimestamp: Date.now()
        };
        return {
            action: analysis.action,
            confidence: Math.max(0, Math.min(100, analysis.confidence)),
            reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning : [analysis.reasoning],
            metadata: enhancedMetadata,
            alternatives: analysis.alternatives?.map((alt) => ({
                action: alt.action,
                reasoning: alt.reasoning,
                confidence: alt.confidence || analysis.confidence * 0.8
            })),
            riskAssessment: {
                level: analysis.riskLevel || 'medium',
                factors: analysis.riskFactors || [],
                mitigations: this.generateMitigations(analysis)
            },
            executionPlan: this.generateExecutionPlan(analysis, request)
        };
    }
    extractContextFactors(request) {
        const factors = [];
        if (request.context.blockchain) {
            factors.push(`Blockchain: ${request.context.blockchain}`);
        }
        if (request.context.protocol) {
            factors.push(`Protocol: ${request.context.protocol}`);
        }
        if (request.context.marketConditions) {
            factors.push('Market conditions available');
        }
        if (request.context.userHistory && request.context.userHistory.length > 0) {
            factors.push(`User history: ${request.context.userHistory.length} entries`);
        }
        if (request.options.priority !== 'medium') {
            factors.push(`Priority: ${request.options.priority}`);
        }
        return factors;
    }
    generateMitigations(analysis) {
        const mitigations = [];
        if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
            mitigations.push('Implement additional risk controls');
            mitigations.push('Consider reducing position size or exposure');
        }
        if (analysis.confidence < 70) {
            mitigations.push('Gather additional data before proceeding');
            mitigations.push('Consider manual review for low-confidence decisions');
        }
        if (analysis.riskFactors && analysis.riskFactors.length > 2) {
            mitigations.push('Address multiple risk factors before execution');
        }
        // Add specific mitigations based on risk factors
        if (analysis.riskFactors) {
            analysis.riskFactors.forEach((risk) => {
                if (risk.toLowerCase().includes('liquidity')) {
                    mitigations.push('Monitor liquidity conditions closely');
                }
                if (risk.toLowerCase().includes('volatility')) {
                    mitigations.push('Implement volatility-based position sizing');
                }
                if (risk.toLowerCase().includes('smart contract')) {
                    mitigations.push('Verify smart contract security and audits');
                }
            });
        }
        return [...new Set(mitigations)]; // Remove duplicates
    }
    generateExecutionPlan(analysis, request) {
        if (analysis.action === 'SKIP') {
            return {
                steps: ['Analysis complete - no action required'],
                estimatedTime: 'immediate',
                requirements: []
            };
        }
        if (analysis.action === 'WAIT') {
            return {
                steps: [
                    'Monitor conditions for changes',
                    'Re-evaluate when new data available',
                    'Set alerts for key metrics'
                ],
                estimatedTime: 'ongoing monitoring',
                requirements: ['Market data access', 'Alert system']
            };
        }
        // EXECUTE action
        const steps = ['Prepare execution parameters'];
        if (analysis.riskLevel === 'high') {
            steps.push('Implement risk mitigation measures');
        }
        steps.push('Execute action');
        steps.push('Monitor execution results');
        if (request.type === 'proposal') {
            steps.push('Submit vote transaction');
            steps.push('Verify vote confirmation');
        }
        else if (request.type === 'transaction') {
            steps.push('Submit transaction');
            steps.push('Monitor for completion');
        }
        return {
            steps,
            estimatedTime: this.estimateExecutionTime(request.type, analysis.riskLevel),
            requirements: this.getExecutionRequirements(request.type, analysis)
        };
    }
    estimateExecutionTime(type, riskLevel) {
        const baseTime = {
            proposal: '2-5 minutes',
            transaction: '1-3 minutes',
            market: '30 seconds',
            default: '1-2 minutes'
        };
        const time = baseTime[type] || baseTime.default;
        if (riskLevel === 'high') {
            return `${time} (+ risk review time)`;
        }
        return time;
    }
    getExecutionRequirements(type, analysis) {
        const requirements = ['Wallet connection', 'Sufficient balance'];
        if (type === 'proposal') {
            requirements.push('Voting power/tokens', 'Active proposal');
        }
        if (type === 'transaction') {
            requirements.push('Gas for transaction', 'Token approvals if needed');
        }
        if (analysis.riskLevel === 'high') {
            requirements.push('Risk acknowledgment', 'Manual confirmation');
        }
        return requirements;
    }
    // ==================== SPECIALIZED ANALYSIS METHODS ====================
    async analyzeWithContext(request, additionalContext) {
        // Enhanced analysis with additional context
        const enhancedRequest = {
            ...request,
            context: {
                ...request.context,
                ...additionalContext
            }
        };
        return this.analyze(enhancedRequest);
    }
    async compareOptions(options, criteria) {
        const comparisonPrompt = this.buildComparisonPrompt(options, criteria);
        const response = await this.openai.chat.completions.create({
            model: this.defaultModel,
            messages: [
                {
                    role: "system",
                    content: "You are an expert at comparing and ranking options based on multiple criteria. Provide detailed analysis in JSON format."
                },
                {
                    role: "user",
                    content: comparisonPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });
        const analysis = JSON.parse(response.choices[0].message.content || '{}');
        return {
            success: true,
            decision: this.parseComparisonResponse(analysis),
            processingTime: 0,
            provider: this.name,
            metadata: {
                comparisonType: 'multi-option',
                optionsCount: options.length,
                criteriaCount: criteria.length
            }
        };
    }
    buildComparisonPrompt(options, criteria) {
        let prompt = 'Compare the following options based on the given criteria:\n\n';
        prompt += 'OPTIONS:\n';
        options.forEach((option, index) => {
            prompt += `${index + 1}. ${option.option}\n`;
            prompt += `   Data: ${JSON.stringify(option.data, null, 2)}\n\n`;
        });
        prompt += 'CRITERIA:\n';
        criteria.forEach((criterion, index) => {
            prompt += `${index + 1}. ${criterion}\n`;
        });
        prompt += `\nProvide analysis in JSON format:
{
  "ranking": [{"option": "option_name", "score": number, "reasoning": "why"}],
  "recommendation": "top_option_name",
  "confidence": number,
  "reasoning": ["reason1", "reason2"],
  "tradeoffs": {"option": "trade-off description"}
}`;
        return prompt;
    }
    parseComparisonResponse(analysis) {
        return {
            action: 'EXECUTE',
            confidence: analysis.confidence || 80,
            reasoning: analysis.reasoning || ['Comparison analysis completed'],
            metadata: {
                recommendation: analysis.recommendation,
                ranking: analysis.ranking,
                tradeoffs: analysis.tradeoffs,
                comparisonComplete: true
            },
            riskAssessment: {
                level: 'low',
                factors: ['Comparative analysis reduces decision risk']
            }
        };
    }
    validate(request) {
        // OpenAI analyzer can handle most types of requests
        return !!(request.input.text || request.input.data);
    }
}
export default OpenAIAnalyzer;
//# sourceMappingURL=openai-analyzer.js.map
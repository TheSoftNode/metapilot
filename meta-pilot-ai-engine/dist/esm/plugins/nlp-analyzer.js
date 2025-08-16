/**
 * Natural Language Processing Analyzer Plugin
 * Advanced NLP capabilities for text analysis and understanding
 */
import natural from 'natural';
import compromise from 'compromise';
import Sentiment from 'sentiment';
export class NLPAnalyzer {
    constructor() {
        this.name = 'nlp-analyzer';
        this.version = '1.0.0';
        this.supportedTypes = ['text', 'proposal', 'sentiment', 'nlp'];
        this.metadata = {
            author: 'MetaPilot AI Team',
            description: 'Advanced natural language processing for text analysis and understanding',
            dependencies: ['natural', 'compromise', 'sentiment']
        };
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.sentimentAnalyzer = new Sentiment();
        this.tfidf = new natural.TfIdf();
    }
    async analyze(request) {
        const startTime = Date.now();
        try {
            if (!request.input.text) {
                throw new Error('No text provided for NLP analysis');
            }
            const text = request.input.text;
            const analysisType = request.type;
            let decision;
            switch (analysisType) {
                case 'sentiment':
                    decision = await this.analyzeSentiment(text, request);
                    break;
                case 'proposal':
                    decision = await this.analyzeProposal(text, request);
                    break;
                case 'text':
                case 'nlp':
                default:
                    decision = await this.analyzeText(text, request);
                    break;
            }
            return {
                success: true,
                decision,
                processingTime: Date.now() - startTime,
                provider: this.name,
                metadata: {
                    textLength: text.length,
                    wordCount: this.tokenizer.tokenize(text)?.length || 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'NLP analysis failed',
                processingTime: Date.now() - startTime,
                provider: this.name
            };
        }
    }
    async analyzeSentiment(text, request) {
        const sentimentResult = this.sentimentAnalyzer.analyze(text);
        const normalizedScore = this.normalizeSentimentScore(sentimentResult.score, text.length);
        // Advanced sentiment analysis with context
        const emotions = this.extractEmotions(text);
        const subjectivity = this.calculateSubjectivity(text);
        const intensity = this.calculateIntensity(sentimentResult.tokens);
        const confidence = Math.min(95, Math.abs(normalizedScore) * 100 + intensity * 10);
        let action = 'SKIP';
        let reasoning = [];
        if (Math.abs(normalizedScore) > 0.3) {
            action = 'EXECUTE';
            reasoning.push(`Strong ${normalizedScore > 0 ? 'positive' : 'negative'} sentiment detected (${normalizedScore.toFixed(2)})`);
        }
        else if (Math.abs(normalizedScore) > 0.1) {
            action = 'WAIT';
            reasoning.push(`Moderate sentiment detected, consider additional context`);
        }
        else {
            reasoning.push(`Neutral sentiment, no clear emotional direction`);
        }
        reasoning.push(`Sentiment score: ${sentimentResult.score}, comparative: ${sentimentResult.comparative}`);
        reasoning.push(`Subjectivity: ${subjectivity.toFixed(2)}, Intensity: ${intensity.toFixed(2)}`);
        if (emotions.length > 0) {
            reasoning.push(`Detected emotions: ${emotions.join(', ')}`);
        }
        return {
            action,
            confidence,
            reasoning,
            metadata: {
                sentimentScore: sentimentResult.score,
                comparative: sentimentResult.comparative,
                normalizedScore,
                emotions,
                subjectivity,
                intensity,
                positiveWords: sentimentResult.positive,
                negativeWords: sentimentResult.negative
            },
            riskAssessment: {
                level: Math.abs(normalizedScore) > 0.5 ? 'high' : Math.abs(normalizedScore) > 0.2 ? 'medium' : 'low',
                factors: [`Sentiment analysis with ${confidence.toFixed(0)}% confidence`]
            }
        };
    }
    async analyzeProposal(text, request) {
        // Extract key information from proposal text
        const keyPhrases = this.extractKeyPhrases(text);
        const proposalType = this.classifyProposalType(text);
        const urgencyLevel = this.assessUrgency(text);
        const stakeholders = this.identifyStakeholders(text);
        const actions = this.extractProposedActions(text);
        // Calculate proposal quality score
        const qualityScore = this.calculateProposalQuality(text, keyPhrases, actions);
        // Sentiment analysis specific to proposal
        const sentimentResult = this.sentimentAnalyzer.analyze(text);
        const proposalSentiment = this.normalizeSentimentScore(sentimentResult.score, text.length);
        // Rule-based analysis for proposal decision
        let decision = this.makeProposalDecision(qualityScore, proposalSentiment, urgencyLevel, proposalType, request.context);
        const confidence = this.calculateProposalConfidence(qualityScore, Math.abs(proposalSentiment), keyPhrases.length, actions.length);
        return {
            action: decision.action,
            confidence,
            reasoning: decision.reasoning,
            metadata: {
                proposalType,
                qualityScore,
                urgencyLevel,
                stakeholders,
                keyPhrases,
                proposedActions: actions,
                sentimentScore: proposalSentiment,
                wordCount: this.tokenizer.tokenize(text)?.length || 0,
                readabilityScore: this.calculateReadability(text)
            },
            riskAssessment: {
                level: decision.riskLevel,
                factors: decision.riskFactors
            }
        };
    }
    async analyzeText(text, request) {
        // General text analysis
        const tokens = this.tokenizer.tokenize(text) || [];
        const stems = tokens.map(token => this.stemmer.stem(token));
        const doc = compromise(text);
        // Extract linguistic features
        const entities = this.extractEntities(doc);
        const topics = this.extractTopics(text);
        const complexity = this.calculateComplexity(text);
        const readability = this.calculateReadability(text);
        // Text classification
        const category = this.classifyText(text, topics, entities);
        const confidence = this.calculateTextConfidence(complexity, readability, entities.length);
        let action = 'EXECUTE';
        const reasoning = [
            `Text analysis completed for ${tokens?.length || 0} words`,
            `Identified ${entities.length} entities and ${topics.length} topics`,
            `Text complexity: ${complexity.toFixed(2)}, readability: ${readability.toFixed(2)}`,
            `Classified as: ${category}`
        ];
        if (complexity > 0.8) {
            action = 'WAIT';
            reasoning.push('High complexity detected, may require human review');
        }
        return {
            action,
            confidence,
            reasoning,
            metadata: {
                tokenCount: tokens?.length || 0,
                uniqueTokens: new Set(tokens || []).size,
                stems,
                entities,
                topics,
                complexity,
                readability,
                category,
                averageWordLength: tokens?.length ? tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length : 0
            },
            riskAssessment: {
                level: complexity > 0.8 ? 'high' : complexity > 0.5 ? 'medium' : 'low',
                factors: [`Text complexity: ${complexity.toFixed(2)}`]
            }
        };
    }
    // ==================== HELPER METHODS ====================
    normalizeSentimentScore(score, textLength) {
        // Normalize sentiment score based on text length
        const lengthFactor = Math.min(1, textLength / 100); // Normalize by 100 characters
        return (score / Math.max(1, textLength / 10)) * lengthFactor;
    }
    extractEmotions(text) {
        const emotionPatterns = {
            joy: /\b(happy|joy|excited|thrilled|delighted|pleased)\b/gi,
            anger: /\b(angry|mad|furious|outraged|irritated)\b/gi,
            fear: /\b(afraid|scared|worried|anxious|nervous)\b/gi,
            sadness: /\b(sad|depressed|disappointed|unhappy)\b/gi,
            surprise: /\b(surprised|amazed|shocked|astonished)\b/gi,
            trust: /\b(trust|confident|secure|reliable)\b/gi
        };
        const emotions = [];
        Object.entries(emotionPatterns).forEach(([emotion, pattern]) => {
            if (pattern.test(text)) {
                emotions.push(emotion);
            }
        });
        return emotions;
    }
    calculateSubjectivity(text) {
        const subjectiveWords = [
            'i', 'think', 'believe', 'feel', 'opinion', 'personally', 'seem', 'appear',
            'probably', 'possibly', 'maybe', 'perhaps', 'likely', 'unlikely'
        ];
        const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
        const subjectiveCount = tokens.filter(token => subjectiveWords.includes(token)).length;
        return tokens.length > 0 ? subjectiveCount / tokens.length : 0;
    }
    calculateIntensity(tokens) {
        const intensifiers = ['very', 'extremely', 'absolutely', 'completely', 'totally'];
        const intensifierCount = tokens.filter((token) => intensifiers.includes(token.toLowerCase())).length;
        return Math.min(1, intensifierCount / Math.max(1, tokens.length / 10));
    }
    extractKeyPhrases(text) {
        const doc = compromise(text);
        // Extract noun phrases
        const nounPhrases = doc.match('#Noun+ #Noun').out('array');
        // Extract important verb phrases
        const verbPhrases = doc.match('#Verb #Adverb? #Noun').out('array');
        // Combine and deduplicate
        const phrases = [...new Set([...nounPhrases, ...verbPhrases])];
        // Filter by relevance (length and common words)
        return phrases.filter(phrase => phrase.length > 3 &&
            !phrase.toLowerCase().includes('the ') &&
            !phrase.toLowerCase().includes('a ') &&
            !phrase.toLowerCase().includes('an ')).slice(0, 10);
    }
    classifyProposalType(text) {
        const typePatterns = {
            treasury: /\b(fund|treasury|budget|allocat|spend|financ)\b/gi,
            governance: /\b(govern|vote|rule|policy|procedure|process)\b/gi,
            technical: /\b(upgrad|implement|deploy|code|contract|protocol)\b/gi,
            social: /\b(community|social|outreach|education|awareness)\b/gi,
            emergency: /\b(urgent|emergency|critical|immediate|crisis)\b/gi
        };
        let maxMatches = 0;
        let proposalType = 'general';
        Object.entries(typePatterns).forEach(([type, pattern]) => {
            const matches = (text.match(pattern) || []).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                proposalType = type;
            }
        });
        return proposalType;
    }
    assessUrgency(text) {
        const urgencyWords = [
            'urgent', 'immediate', 'emergency', 'critical', 'asap', 'quickly',
            'deadline', 'time-sensitive', 'pressing', 'rush'
        ];
        const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
        const urgencyCount = tokens.filter(token => urgencyWords.includes(token)).length;
        return Math.min(1, urgencyCount / Math.max(1, tokens.length / 20));
    }
    identifyStakeholders(text) {
        const stakeholderPatterns = [
            /\b(user|holder|member|participant|community|developer|team)\b/gi,
            /\b(investor|contributor|validator|delegate|voter)\b/gi
        ];
        const stakeholders = [];
        stakeholderPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            stakeholders.push(...matches.map(match => match.toLowerCase()));
        });
        return [...new Set(stakeholders)];
    }
    extractProposedActions(text) {
        const doc = compromise(text);
        // Look for action verbs with objects
        const actions = doc.match('#Verb+ (#Determiner|#Adjective)? #Noun+').out('array');
        return actions.filter((action) => action.length > 5).slice(0, 5);
    }
    calculateProposalQuality(text, keyPhrases, actions) {
        let score = 0;
        // Length factor (optimal length around 200-500 words)
        const wordCount = this.tokenizer.tokenize(text)?.length || 0;
        const lengthScore = wordCount >= 50 && wordCount <= 1000 ? 0.3 : 0.1;
        score += lengthScore;
        // Structure factor (key phrases indicate good structure)
        const structureScore = Math.min(0.3, keyPhrases.length * 0.05);
        score += structureScore;
        // Action clarity (proposed actions indicate clear intent)
        const actionScore = Math.min(0.2, actions.length * 0.1);
        score += actionScore;
        // Readability factor
        const readability = this.calculateReadability(text);
        const readabilityScore = readability > 0.3 && readability < 0.8 ? 0.2 : 0.1;
        score += readabilityScore;
        return Math.min(1, score);
    }
    makeProposalDecision(qualityScore, sentiment, urgency, proposalType, context) {
        const reasoning = [];
        let riskFactors = [];
        let riskLevel = 'low';
        // Base decision logic
        if (qualityScore > 0.7 && sentiment > 0.2) {
            reasoning.push('High quality proposal with positive sentiment');
            return {
                action: 'EXECUTE',
                reasoning,
                riskLevel: 'low',
                riskFactors: ['Well-structured proposal with positive indicators']
            };
        }
        if (qualityScore < 0.3) {
            reasoning.push('Poor quality proposal structure');
            riskFactors.push('Low proposal quality score');
            riskLevel = 'high';
            return { action: 'SKIP', reasoning, riskLevel, riskFactors };
        }
        if (sentiment < -0.3) {
            reasoning.push('Negative sentiment detected');
            riskFactors.push('Negative community sentiment');
            riskLevel = 'medium';
            return { action: 'WAIT', reasoning, riskLevel, riskFactors };
        }
        if (urgency > 0.7) {
            reasoning.push('High urgency detected, requires immediate attention');
            riskFactors.push('Time-sensitive decision required');
            riskLevel = 'medium';
            return { action: 'EXECUTE', reasoning, riskLevel, riskFactors };
        }
        reasoning.push('Moderate proposal quality, awaiting additional context');
        return { action: 'WAIT', reasoning, riskLevel: 'medium', riskFactors };
    }
    calculateProposalConfidence(qualityScore, sentimentMagnitude, keyPhrasesCount, actionsCount) {
        let confidence = 50; // Base confidence
        confidence += qualityScore * 30; // Quality contributes up to 30 points
        confidence += sentimentMagnitude * 20; // Sentiment clarity contributes up to 20 points
        confidence += Math.min(keyPhrasesCount, 5) * 2; // Key phrases contribute up to 10 points
        confidence += Math.min(actionsCount, 3) * 3; // Actions contribute up to 9 points
        return Math.min(95, Math.max(10, confidence));
    }
    extractEntities(doc) {
        return [
            ...doc.people().out('array'),
            ...doc.places().out('array'),
            ...doc.organizations().out('array'),
            ...doc.money().out('array')
        ].map(entity => ({ text: entity, type: 'entity' }));
    }
    extractTopics(text) {
        // Simple topic extraction using TF-IDF
        this.tfidf.addDocument(text);
        const topics = [];
        this.tfidf.listTerms(0).slice(0, 5).forEach(item => {
            if (item.term.length > 3) {
                topics.push(item.term);
            }
        });
        return topics;
    }
    calculateComplexity(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = this.tokenizer.tokenize(text) || [];
        if (sentences.length === 0 || words.length === 0)
            return 0;
        // Average sentence length
        const avgSentenceLength = words.length / sentences.length;
        // Lexical diversity (unique words / total words)
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const lexicalDiversity = uniqueWords / words.length;
        // Syllable complexity (approximated by word length)
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        // Combine factors
        const sentenceComplexity = Math.min(1, avgSentenceLength / 20); // Normalize to 0-1
        const wordComplexity = Math.min(1, avgWordLength / 7); // Normalize to 0-1
        return (sentenceComplexity + wordComplexity + lexicalDiversity) / 3;
    }
    calculateReadability(text) {
        // Simplified Flesch Reading Ease approximation
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = this.tokenizer.tokenize(text) || [];
        if (sentences.length === 0 || words.length === 0)
            return 0;
        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
        // Simplified Flesch formula (normalized to 0-1)
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        return Math.max(0, Math.min(1, fleschScore / 100));
    }
    countSyllables(word) {
        // Simple syllable counting heuristic
        return Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
    }
    classifyText(text, topics, entities) {
        const categories = {
            technical: ['code', 'deploy', 'implement', 'upgrade', 'protocol', 'contract'],
            financial: ['fund', 'budget', 'treasury', 'payment', 'cost', 'price'],
            governance: ['vote', 'proposal', 'govern', 'rule', 'policy', 'decision'],
            social: ['community', 'user', 'member', 'social', 'engagement', 'outreach']
        };
        const scores = {};
        const textLower = text.toLowerCase();
        Object.entries(categories).forEach(([category, keywords]) => {
            scores[category] = keywords.reduce((score, keyword) => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = textLower.match(regex) || [];
                return score + matches.length;
            }, 0);
        });
        // Find category with highest score
        const maxCategory = Object.entries(scores).reduce((max, [category, score]) => score > max.score ? { category, score } : max, { category: 'general', score: 0 });
        return maxCategory.category;
    }
    calculateTextConfidence(complexity, readability, entityCount) {
        let confidence = 60; // Base confidence
        // Higher readability increases confidence
        confidence += (1 - Math.abs(readability - 0.5)) * 20;
        // Moderate complexity is good
        confidence += (1 - Math.abs(complexity - 0.5)) * 15;
        // More entities generally indicate more structured content
        confidence += Math.min(entityCount * 2, 10);
        return Math.min(95, Math.max(20, confidence));
    }
    validate(request) {
        return !!(request.input.text &&
            typeof request.input.text === 'string' &&
            request.input.text.length > 0);
    }
}
export default NLPAnalyzer;
//# sourceMappingURL=nlp-analyzer.js.map
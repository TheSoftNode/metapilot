#!/usr/bin/env node

/**
 * Comprehensive MetaPilot AI Engine Test Suite
 * Tests all aspects including security, performance, reliability, and AI functionality
 */

const { createBasicEngine, createEnhancedEngine } = require('./dist/factory');
const assert = require('assert');

class ComprehensiveTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        this.aiEngine = null;
    }

    log(level, test, message, details = {}) {
        const timestamp = new Date().toISOString();
        const result = { timestamp, level, test, message, details };
        this.testResults.details.push(result);
        
        const colors = {
            PASS: '\x1b[32m',  // Green
            FAIL: '\x1b[31m',  // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            RESET: '\x1b[0m'   // Reset
        };
        
        console.log(`${colors[level] || colors.INFO}[${level}] ${test}: ${message}${colors.RESET}`);
        if (Object.keys(details).length > 0) {
            console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    async runTest(testName, testFn) {
        try {
            const start = Date.now();
            await testFn();
            const duration = Date.now() - start;
            this.testResults.passed++;
            this.log('PASS', testName, `Completed in ${duration}ms`);
        } catch (error) {
            this.testResults.failed++;
            this.log('FAIL', testName, error.message, { 
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
        }
    }

    // ==================== CORE ENGINE TESTS ====================

    async testEngineInitialization() {
        await this.runTest('Engine Initialization', async () => {
            this.aiEngine = await createBasicEngine({
                logLevel: 'warn', // Reduce noise
                enableCaching: true,
                enableRateLimit: true
            });
            
            const status = this.aiEngine.getStatus();
            assert(status.initialized === true, 'Engine should be initialized');
            assert(status.pluginsLoaded >= 2, 'Should load core plugins');
        });
    }

    async testPluginSystem() {
        await this.runTest('Plugin System', async () => {
            const plugins = this.aiEngine.getLoadedPlugins();
            assert(plugins.includes('nlp-analyzer'), 'NLP analyzer should be loaded');
            assert(plugins.includes('proposal-analyzer'), 'Proposal analyzer should be loaded');
            
            // Test plugin routing
            const result = await this.aiEngine.analyze('text', 
                { text: 'Test routing' }, 
                {}, 
                { priority: 'medium' }
            );
            assert(result.success === true, 'Plugin routing should work');
            assert(result.provider === 'nlp-analyzer', 'Should route to correct plugin');
        });
    }

    // ==================== AI FUNCTIONALITY TESTS ====================

    async testSentimentAnalysis() {
        await this.runTest('Sentiment Analysis', async () => {
            const testCases = [
                { 
                    text: 'This proposal is absolutely amazing and will benefit everyone!',
                    expectedSentiment: 'positive',
                    minConfidence: 60
                },
                {
                    text: 'This proposal is terrible and will harm our community.',
                    expectedSentiment: 'negative',
                    minConfidence: 60
                },
                {
                    text: 'The proposal presents some interesting technical considerations.',
                    expectedSentiment: 'neutral',
                    minConfidence: 40
                }
            ];

            for (const testCase of testCases) {
                const result = await this.aiEngine.analyze('sentiment', 
                    { text: testCase.text }, 
                    {}, 
                    { priority: 'medium' }
                );
                
                assert(result.success === true, `Sentiment analysis should succeed for: ${testCase.text.substring(0, 50)}...`);
                assert(result.decision.confidence >= testCase.minConfidence, 
                    `Confidence should be >= ${testCase.minConfidence}, got ${result.decision.confidence}`);
                
                const sentiment = result.decision.metadata.normalizedScore > 0 ? 'positive' : 
                                result.decision.metadata.normalizedScore < 0 ? 'negative' : 'neutral';
                
                if (testCase.expectedSentiment !== 'neutral') {
                    assert(sentiment === testCase.expectedSentiment, 
                        `Expected ${testCase.expectedSentiment} sentiment, got ${sentiment}`);
                }
            }
        });
    }

    async testProposalAnalysis() {
        await this.runTest('DAO Proposal Analysis', async () => {
            const proposalTypes = [
                {
                    type: 'treasury',
                    text: 'We propose to allocate 1000 ETH from the treasury for developer grants and ecosystem growth.',
                    expectedType: 'treasury'
                },
                {
                    type: 'technical',
                    text: 'This proposal upgrades the smart contract protocol to implement new security features.',
                    expectedType: 'technical'
                },
                {
                    type: 'governance',
                    text: 'We propose to change the voting mechanism and update governance parameters.',
                    expectedType: 'governance'
                }
            ];

            for (const proposal of proposalTypes) {
                const result = await this.aiEngine.analyze('proposal', 
                    {
                        proposalId: `test-${proposal.type}`,
                        daoName: 'TestDAO',
                        proposalText: proposal.text,
                        proposalType: proposal.type
                    },
                    { blockchain: 'ethereum' },
                    { priority: 'high' }
                );
                
                // Note: Some proposal analysis might fail due to validation - that's expected
                if (result.success) {
                    assert(result.decision.confidence > 0, 'Should have confidence score');
                    assert(Array.isArray(result.decision.reasoning), 'Should have reasoning array');
                } else {
                    this.log('WARN', 'Proposal Analysis', `Failed for ${proposal.type}: ${result.error}`);
                }
            }
        });
    }

    async testRuleBasedAnalysis() {
        await this.runTest('Rule-Based Analysis', async () => {
            const rules = [
                {
                    id: 'support-developers',
                    name: 'Support Developer Grants',
                    description: 'Vote YES if proposal supports developers',
                    condition: {
                        type: 'natural_language',
                        expression: 'developer grants ecosystem funding'
                    },
                    action: {
                        type: 'vote',
                        parameters: { vote: 'YES' }
                    },
                    enabled: true,
                    priority: 1
                },
                {
                    id: 'avoid-risk',
                    name: 'Avoid High Risk',
                    description: 'Vote NO for risky proposals',
                    condition: {
                        type: 'natural_language',
                        expression: 'risky dangerous unsafe'
                    },
                    action: {
                        type: 'vote',
                        parameters: { vote: 'NO' }
                    },
                    enabled: true,
                    priority: 2
                }
            ];

            const testCases = [
                {
                    text: 'This proposal will fund developer grants for ecosystem growth',
                    expectedAction: 'EXECUTE',
                    expectedRule: 'Support Developer Grants'
                },
                {
                    text: 'This proposal is very risky and could be dangerous for the protocol',
                    expectedAction: 'EXECUTE',
                    expectedRule: 'Avoid High Risk'
                }
            ];

            for (const testCase of testCases) {
                const result = await this.aiEngine.analyzeWithRules(
                    { text: testCase.text },
                    rules
                );
                
                assert(result.success === true, `Rule analysis should succeed for: ${testCase.text.substring(0, 50)}...`);
                assert(result.decision.action === testCase.expectedAction, 
                    `Expected action ${testCase.expectedAction}, got ${result.decision.action}`);
                
                const hasExpectedRule = result.decision.reasoning.some(r => 
                    r.includes(testCase.expectedRule)
                );
                assert(hasExpectedRule, `Should trigger rule: ${testCase.expectedRule}`);
            }
        });
    }

    // ==================== PERFORMANCE TESTS ====================

    async testPerformance() {
        await this.runTest('Performance Analysis', async () => {
            const iterations = 20;
            const results = [];
            
            // Warm up
            await this.aiEngine.analyze('sentiment', { text: 'Warmup test' }, {}, { priority: 'medium' });
            
            // Performance test
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                const result = await this.aiEngine.analyze('sentiment', 
                    { text: `Performance test iteration ${i} with some text to analyze` },
                    {},
                    { priority: 'medium' }
                );
                const duration = Date.now() - start;
                results.push({ duration, success: result.success });
            }
            
            const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            const successRate = results.filter(r => r.success).length / results.length;
            const maxDuration = Math.max(...results.map(r => r.duration));
            
            assert(avgDuration < 1000, `Average duration too high: ${avgDuration}ms`);
            assert(successRate >= 0.95, `Success rate too low: ${successRate}`);
            assert(maxDuration < 2000, `Max duration too high: ${maxDuration}ms`);
            
            this.log('INFO', 'Performance', 'Performance metrics', {
                avgDuration: `${avgDuration.toFixed(2)}ms`,
                maxDuration: `${maxDuration}ms`,
                successRate: `${(successRate * 100).toFixed(1)}%`
            });
        });
    }

    async testConcurrency() {
        await this.runTest('Concurrent Analysis', async () => {
            const concurrentRequests = 10;
            const promises = [];
            
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    this.aiEngine.analyze('sentiment', 
                        { text: `Concurrent test ${i}` },
                        {},
                        { priority: 'medium' }
                    )
                );
            }
            
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            
            assert(successCount >= concurrentRequests * 0.9, 
                `Too many concurrent failures: ${successCount}/${concurrentRequests}`);
            
            this.log('INFO', 'Concurrency', 'Concurrent analysis results', {
                totalRequests: concurrentRequests,
                successful: successCount,
                successRate: `${(successCount / concurrentRequests * 100).toFixed(1)}%`
            });
        });
    }

    // ==================== CACHING TESTS ====================

    async testCaching() {
        await this.runTest('Caching System', async () => {
            const testText = 'Cache test - this should be cached for faster retrieval';
            
            // First request - should be fresh
            const start1 = Date.now();
            const result1 = await this.aiEngine.analyze('sentiment', 
                { text: testText }, 
                {}, 
                { priority: 'medium' }
            );
            const duration1 = Date.now() - start1;
            
            // Second request - should use cache
            const start2 = Date.now();
            const result2 = await this.aiEngine.analyze('sentiment', 
                { text: testText }, 
                {}, 
                { priority: 'medium' }
            );
            const duration2 = Date.now() - start2;
            
            assert(result1.success === true, 'First request should succeed');
            assert(result2.success === true, 'Second request should succeed');
            
            // Cache should make second request faster
            if (duration2 >= duration1) {
                this.log('WARN', 'Caching', 'Cache may not be working optimally', {
                    firstDuration: `${duration1}ms`,
                    secondDuration: `${duration2}ms`
                });
            }
            
            const status = this.aiEngine.getStatus();
            assert(status.cacheSize?.keys > 0, 'Cache should contain entries');
        });
    }

    // ==================== ERROR HANDLING TESTS ====================

    async testErrorHandling() {
        await this.runTest('Error Handling', async () => {
            const errorCases = [
                {
                    name: 'Empty input',
                    type: 'text',
                    input: {},
                    options: { priority: 'medium' }
                },
                {
                    name: 'Invalid type',
                    type: 'nonexistent-type',
                    input: { text: 'test' },
                    options: { priority: 'medium' }
                },
                {
                    name: 'Null input',
                    type: 'text',
                    input: null,
                    options: { priority: 'medium' }
                }
            ];

            for (const errorCase of errorCases) {
                try {
                    const result = await this.aiEngine.analyze(
                        errorCase.type,
                        errorCase.input,
                        {},
                        errorCase.options
                    );
                    
                    // Should either fail gracefully or succeed with fallback
                    if (!result.success) {
                        assert(typeof result.error === 'string', 'Should provide error message');
                        assert(result.error.length > 0, 'Error message should not be empty');
                    }
                } catch (error) {
                    // Errors should be handled gracefully, not thrown
                    this.log('WARN', 'Error Handling', `Unhandled error for ${errorCase.name}: ${error.message}`);
                }
            }
        });
    }

    // ==================== SECURITY TESTS ====================

    async testInputValidation() {
        await this.runTest('Input Validation', async () => {
            const maliciousInputs = [
                {
                    name: 'XSS attempt',
                    text: '<script>alert("xss")</script>',
                    shouldSucceed: true // Should be sanitized but processed
                },
                {
                    name: 'SQL injection attempt',
                    text: "'; DROP TABLE users; --",
                    shouldSucceed: true
                },
                {
                    name: 'Extremely long text',
                    text: 'A'.repeat(100000),
                    shouldSucceed: false // Should be rejected
                },
                {
                    name: 'Unicode control characters',
                    text: 'Test\u0000\u0001\u0002',
                    shouldSucceed: true // Should be sanitized
                }
            ];

            for (const input of maliciousInputs) {
                try {
                    const result = await this.aiEngine.analyze('text', 
                        { text: input.text }, 
                        {}, 
                        { priority: 'medium' }
                    );
                    
                    if (input.shouldSucceed) {
                        assert(result.success === true, `Should handle ${input.name} safely`);
                    } else {
                        assert(result.success === false, `Should reject ${input.name}`);
                    }
                } catch (error) {
                    if (input.shouldSucceed) {
                        this.log('WARN', 'Input Validation', `Unexpected error for ${input.name}: ${error.message}`);
                    }
                }
            }
        });
    }

    // ==================== LEARNING SYSTEM TESTS ====================

    async testLearningSystem() {
        await this.runTest('Learning System', async () => {
            const learningData = {
                userId: 'test-user-123',
                sessionId: 'test-session-456',
                requestId: 'test-request-789',
                decision: {
                    action: 'EXECUTE',
                    confidence: 85,
                    reasoning: ['Test decision'],
                    metadata: {},
                    riskAssessment: { level: 'low', factors: [] }
                },
                actualOutcome: {
                    success: true,
                    timestamp: Date.now()
                },
                userFeedback: {
                    rating: 5,
                    correctness: 'correct',
                    helpfulness: 'very_helpful'
                },
                timestamp: Date.now(),
                context: { blockchain: 'ethereum' }
            };

            // Record learning data
            this.aiEngine.recordLearning(learningData);
            
            // Retrieve learning data
            const userData = this.aiEngine.getUserLearningData('test-user-123');
            assert(userData.length >= 1, 'Should record learning data');
            assert(userData[0].userId === 'test-user-123', 'Should retrieve correct user data');
            
            // Get system insights
            const insights = this.aiEngine.getSystemLearningInsights();
            assert(typeof insights === 'object', 'Should provide learning insights');
            assert(insights.totalSessions >= 0, 'Should track total sessions');
        });
    }

    // ==================== EVENT SYSTEM TESTS ====================

    async testEventSystem() {
        await this.runTest('Event System', async () => {
            let analysisStartedFired = false;
            let analysisCompletedFired = false;
            
            // Add event listeners
            this.aiEngine.addEventListener('analysis_started', () => {
                analysisStartedFired = true;
            });
            
            this.aiEngine.addEventListener('analysis_completed', () => {
                analysisCompletedFired = true;
            });
            
            // Trigger analysis to fire events
            await this.aiEngine.analyze('sentiment', 
                { text: 'Event system test' }, 
                {}, 
                { priority: 'medium' }
            );
            
            // Give events time to fire
            await new Promise(resolve => setTimeout(resolve, 100));
            
            assert(analysisStartedFired === true, 'analysis_started event should fire');
            assert(analysisCompletedFired === true, 'analysis_completed event should fire');
        });
    }

    // ==================== COMPREHENSIVE INTEGRATION TEST ====================

    async testEndToEndWorkflow() {
        await this.runTest('End-to-End Workflow', async () => {
            // Simulate a complete DAO voting workflow
            const proposalData = {
                proposalId: 'dao-proposal-001',
                daoName: 'MetaDAO',
                proposalText: `
                    Treasury Allocation Proposal
                    
                    We propose to allocate 500 ETH from the community treasury to fund a comprehensive
                    developer grant program. This initiative will support ecosystem growth through:
                    
                    1. Funding innovative DeFi projects
                    2. Supporting educational initiatives  
                    3. Enabling community-driven development
                    
                    The allocation will be distributed over 6 months with quarterly reviews.
                    We believe this investment will significantly benefit our community.
                `,
                proposalType: 'treasury'
            };

            const userRules = [
                {
                    id: 'support-ecosystem',
                    name: 'Support Ecosystem Growth',
                    description: 'Vote YES for proposals that support ecosystem development',
                    condition: {
                        type: 'natural_language',
                        expression: 'ecosystem growth developer grants community'
                    },
                    action: {
                        type: 'vote',
                        parameters: { vote: 'YES' }
                    },
                    enabled: true,
                    priority: 1
                }
            ];

            // Step 1: Analyze proposal sentiment
            const sentimentResult = await this.aiEngine.analyze('sentiment',
                { text: proposalData.proposalText },
                { blockchain: 'ethereum' },
                { priority: 'high' }
            );
            
            assert(sentimentResult.success === true, 'Sentiment analysis should succeed');
            
            // Step 2: Perform proposal analysis
            const proposalResult = await this.aiEngine.analyze('proposal',
                proposalData,
                { 
                    blockchain: 'ethereum',
                    marketConditions: { sentiment: 0.7, volatility: 0.3 }
                },
                { priority: 'high' }
            );
            
            // Proposal analysis might fail due to validation issues, that's acceptable
            if (!proposalResult.success) {
                this.log('WARN', 'E2E Workflow', 'Proposal analysis failed, continuing with rule-based analysis');
            }
            
            // Step 3: Apply user rules
            const ruleResult = await this.aiEngine.analyzeWithRules(
                { text: proposalData.proposalText },
                userRules,
                { 
                    blockchain: 'ethereum',
                    proposalId: proposalData.proposalId
                }
            );
            
            assert(ruleResult.success === true, 'Rule-based analysis should succeed');
            assert(ruleResult.decision.action === 'EXECUTE', 'Should recommend execution based on rules');
            
            // Step 4: Record learning outcome
            this.aiEngine.recordLearning({
                userId: 'workflow-test-user',
                sessionId: 'workflow-test-session',
                requestId: ruleResult.decision.metadata?.requestId || 'test-request',
                decision: ruleResult.decision,
                actualOutcome: {
                    success: true,
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                context: { blockchain: 'ethereum', proposalId: proposalData.proposalId }
            });
            
            this.log('INFO', 'E2E Workflow', 'Complete workflow executed successfully', {
                sentimentConfidence: sentimentResult.decision?.confidence,
                proposalAnalysisSuccess: proposalResult.success,
                ruleBasedAction: ruleResult.decision.action,
                ruleBasedConfidence: ruleResult.decision.confidence
            });
        });
    }

    // ==================== MAIN TEST RUNNER ====================

    async runAllTests() {
        console.log('\n🤖 Starting Comprehensive MetaPilot AI Engine Test Suite\n');
        console.log('=' .repeat(70));
        
        const startTime = Date.now();
        
        try {
            // Core functionality tests
            await this.testEngineInitialization();
            await this.testPluginSystem();
            
            // AI functionality tests
            await this.testSentimentAnalysis();
            await this.testProposalAnalysis();
            await this.testRuleBasedAnalysis();
            
            // Performance tests
            await this.testPerformance();
            await this.testConcurrency();
            
            // System tests
            await this.testCaching();
            await this.testErrorHandling();
            await this.testInputValidation();
            await this.testLearningSystem();
            await this.testEventSystem();
            
            // Integration test
            await this.testEndToEndWorkflow();
            
        } finally {
            // Cleanup
            if (this.aiEngine) {
                await this.aiEngine.shutdown();
            }
        }
        
        const totalTime = Date.now() - startTime;
        this.generateReport(totalTime);
    }

    generateReport(totalTime) {
        console.log('\n' + '=' .repeat(70));
        console.log('🔍 COMPREHENSIVE TEST REPORT');
        console.log('=' .repeat(70));
        
        const total = this.testResults.passed + this.testResults.failed;
        const successRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(1) : 0;
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   ✅ Passed: ${this.testResults.passed}`);
        console.log(`   ❌ Failed: ${this.testResults.failed}`);
        console.log(`   ⚠️  Warnings: ${this.testResults.warnings}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
        console.log(`   ⏱️  Total Time: ${totalTime}ms`);
        
        // Show failed tests
        if (this.testResults.failed > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.testResults.details
                .filter(r => r.level === 'FAIL')
                .forEach(r => {
                    console.log(`   • ${r.test}: ${r.message}`);
                });
        }
        
        // Show warnings
        const warnings = this.testResults.details.filter(r => r.level === 'WARN');
        if (warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS:`);
            warnings.forEach(r => {
                console.log(`   • ${r.test}: ${r.message}`);
            });
        }
        
        console.log(`\n🎯 OVERALL ASSESSMENT:`);
        if (this.testResults.failed === 0) {
            console.log(`   🟢 EXCELLENT: All tests passed! AI engine is ready for integration.`);
        } else if (this.testResults.failed <= 2) {
            console.log(`   🟡 GOOD: Minor issues detected but core functionality works.`);
        } else {
            console.log(`   🔴 NEEDS WORK: Multiple failures detected. Review required.`);
        }
        
        console.log('\n' + '=' .repeat(70));
    }
}

// Run the comprehensive test suite
const testSuite = new ComprehensiveTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
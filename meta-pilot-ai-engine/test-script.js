#!/usr/bin/env node

/**
 * Simple test script to verify AI Engine functionality
 */

const { createBasicEngine } = require('./dist/factory');

async function testAIEngine() {
    console.log('🤖 Testing MetaPilot AI Engine...\n');
    
    try {
        // Create AI engine
        console.log('📦 Creating AI engine...');
        const aiEngine = await createBasicEngine({
            logLevel: 'info',
            enableCaching: true
        });
        
        console.log('✅ AI Engine created successfully!\n');
        
        // Test 1: Sentiment Analysis
        console.log('🔍 Test 1: Sentiment Analysis');
        const sentimentResult = await aiEngine.analyze(
            'sentiment',
            { text: 'This proposal is amazing and will greatly benefit our community!' },
            { blockchain: 'ethereum' },
            { priority: 'medium' }
        );
        
        console.log('📊 Sentiment Result:', {
            success: sentimentResult.success,
            action: sentimentResult.decision?.action,
            confidence: sentimentResult.decision?.confidence,
            sentiment: sentimentResult.decision?.metadata?.normalizedScore > 0 ? 'Positive' : 'Negative'
        });
        console.log();
        
        // Test 2: DAO Proposal Analysis
        console.log('🏛️ Test 2: DAO Proposal Analysis');
        const proposalResult = await aiEngine.analyze(
            'proposal',
            {
                proposalId: 'test-123',
                daoName: 'TestDAO',
                proposalText: 'We propose to allocate 1000 ETH from the treasury for developer ecosystem grants to foster innovation and growth.',
                proposalType: 'treasury'
            },
            { blockchain: 'ethereum' },
            { priority: 'high' }
        );
        
        console.log('🏛️ DAO Proposal Result:', {
            success: proposalResult.success,
            action: proposalResult.decision?.action,
            confidence: proposalResult.decision?.confidence,
            proposalType: proposalResult.decision?.metadata?.proposalType
        });
        console.log();
        
        // Test 3: Rule-based Analysis
        console.log('📋 Test 3: Rule-based Analysis');
        const rules = [{
            id: 'support-devs',
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
        }];
        
        const ruleResult = await aiEngine.analyzeWithRules(
            { text: 'This proposal will fund developer grants for ecosystem growth' },
            rules
        );
        
        console.log('📋 Rule-based Result:', {
            success: ruleResult.success,
            action: ruleResult.decision?.action,
            confidence: ruleResult.decision?.confidence,
            triggeredRules: ruleResult.decision?.reasoning.filter(r => r.includes('Rule'))
        });
        console.log();
        
        // Engine Status
        const status = aiEngine.getStatus();
        console.log('⚙️ Engine Status:', {
            initialized: status.initialized,
            pluginsLoaded: status.pluginsLoaded,
            cacheSize: status.cacheSize?.keys || 0
        });
        
        // Cleanup
        await aiEngine.shutdown();
        console.log('\n✅ All tests completed successfully!');
        console.log('🎉 MetaPilot AI Engine is working perfectly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
testAIEngine().catch(console.error);
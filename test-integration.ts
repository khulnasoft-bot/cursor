/**
 * Integration Tests for Cursor Packages
 * Tests integration between packages to ensure they work together correctly
 */

import { createAIService } from './packages/ai-service/src/index'
import { createComposerService } from './packages/composer/src/index'
import { createAgentExecService, createToolRegistry } from './packages/agent-exec/src/index'
import { createSemanticIndexer } from './packages/semantic-indexer/src/index'
import { createAutomationsService } from './packages/automations/src/index'
import { createRuleService } from './packages/rules-service/src/index'

console.log('Running Integration Tests...\n')

// Test 1: AI Service Basic Functionality
async function testAIService() {
    console.log('Test 1: AI Service Basic Functionality')
    try {
        const aiService = createAIService()
        console.log('✅ AI Service created successfully')
        
        // Test provider setting
        aiService.setProvider('openai', 'test-key')
        console.log('✅ Provider set successfully')
        
        return true
    } catch (error) {
        console.error('❌ AI Service test failed:', error)
        return false
    }
}

// Test 2: Composer Service
async function testComposerService() {
    console.log('\nTest 2: Composer Service')
    try {
        const composer = createComposerService()
        console.log('✅ Composer Service created successfully')
        
        // Test AI service integration
        const aiService = createAIService()
        composer.setAIService(aiService)
        console.log('✅ AI Service integrated with Composer')
        
        return true
    } catch (error) {
        console.error('❌ Composer Service test failed:', error)
        return false
    }
}

// Test 3: Agent Execution Service
async function testAgentExecService() {
    console.log('\nTest 3: Agent Execution Service')
    try {
        const agentExec = createAgentExecService()
        console.log('✅ Agent Exec Service created successfully')
        
        // Test tool registry integration
        const toolRegistry = createToolRegistry()
        agentExec.setToolRegistry(toolRegistry)
        console.log('✅ Tool Registry integrated with Agent Exec')
        
        // Test tool availability
        const tools = agentExec.getAvailableTools()
        console.log(`✅ Available tools: ${tools.length}`)
        
        return true
    } catch (error) {
        console.error('❌ Agent Exec Service test failed:', error)
        return false
    }
}

// Test 4: Semantic Indexer
async function testSemanticIndexer() {
    console.log('\nTest 4: Semantic Indexer')
    try {
        const indexer = createSemanticIndexer()
        console.log('✅ Semantic Indexer created successfully')
        
        // Test file indexing
        await indexer.indexFile('./test.ts', 'function test() { return true; }', 'typescript')
        console.log('✅ File indexed successfully')
        
        // Test search
        const results = await indexer.search({ query: 'test function', limit: 5 })
        console.log(`✅ Search returned ${results.length} results`)
        
        return true
    } catch (error) {
        console.error('❌ Semantic Indexer test failed:', error)
        return false
    }
}

// Test 5: Automations Service
async function testAutomationsService() {
    console.log('\nTest 5: Automations Service')
    try {
        const automationService = createAutomationsService()
        console.log('✅ Automations Service created successfully')
        
        // Test workflow creation
        const workflow = automationService.createWorkflow('Test Workflow', 'Description', [], [])
        console.log('✅ Workflow created successfully')
        
        return true
    } catch (error) {
        console.error('❌ Automations Service test failed:', error)
        return false
    }
}

// Test 6: Rules Service
async function testRuleService() {
    console.log('\nTest 6: Rules Service')
    try {
        const ruleService = createRuleService()
        console.log('✅ Rules Service created successfully')
        
        // Test rule loading
        await ruleService.loadRules('./')
        console.log('✅ Rules loaded successfully')
        
        return true
    } catch (error) {
        console.error('❌ Rules Service test failed:', error)
        return false
    }
}

// Test 7: Package Integration
async function testPackageIntegration() {
    console.log('\nTest 7: Package Integration')
    try {
        // Create all services
        const aiService = createAIService()
        const composer = createComposerService()
        const agentExec = createAgentExecService()
        const toolRegistry = createToolRegistry()
        const indexer = createSemanticIndexer()
        const automationService = createAutomationsService()
        const ruleService = createRuleService()
        
        // Wire up integrations
        composer.setAIService(aiService)
        agentExec.setToolRegistry(toolRegistry)
        
        console.log('✅ All services created and integrated')
        
        return true
    } catch (error) {
        console.error('❌ Package integration test failed:', error)
        return false
    }
}

// Run all tests
async function runAllTests() {
    const results = []
    
    results.push(await testAIService())
    results.push(await testComposerService())
    results.push(await testAgentExecService())
    results.push(await testSemanticIndexer())
    results.push(await testAutomationsService())
    results.push(await testRuleService())
    results.push(await testPackageIntegration())
    
    const passed = results.filter(r => r).length
    const total = results.length
    
    console.log('\n==========================================')
    console.log('Integration Test Summary')
    console.log('==========================================')
    console.log(`Total tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${total - passed}`)
    
    if (passed === total) {
        console.log('\n✅ All integration tests passed!')
    } else {
        console.log(`\n❌ ${total - passed} test(s) failed`)
    }
}

// Run tests
runAllTests().catch(console.error)
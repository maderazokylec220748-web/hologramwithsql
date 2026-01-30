#!/usr/bin/env node

/**
 * Test Ollama connectivity and basic chat functionality
 * Usage: npm run test:ollama
 */

import fetch from 'node-fetch';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:3b';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: `${colors.cyan}ℹ️ ${colors.reset}`,
    success: `${colors.green}✅ ${colors.reset}`,
    warning: `${colors.yellow}⚠️ ${colors.reset}`,
    error: `${colors.red}❌ ${colors.reset}`,
  }[type] || '';
  console.log(`[${timestamp}] ${prefix}${message}`);
}

async function testOllamaHealth() {
  log('info', 'Testing Ollama health...');
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, { timeout: 5000 });
    if (response.ok) {
      log('success', `Ollama is running at ${OLLAMA_API_URL}`);
      return true;
    } else {
      log('error', `Ollama returned HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    log('error', `Could not connect to Ollama: ${error instanceof Error ? error.message : String(error)}`);
    log('info', 'Make sure Ollama is running:');
    log('info', '  Windows/macOS: Open the Ollama application');
    log('info', '  Linux: Run "ollama serve" in another terminal');
    return false;
  }
}

async function listModels() {
  log('info', 'Checking available models...');
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
    const data = await response.json();
    
    if (data.models && data.models.length > 0) {
      log('success', `Found ${data.models.length} model(s):`);
      data.models.forEach(model => {
        console.log(`  • ${model.name}`);
      });
      return true;
    } else {
      log('warning', 'No models found');
      log('info', `To download ${OLLAMA_MODEL}, run: ollama pull ${OLLAMA_MODEL}`);
      return false;
    }
  } catch (error) {
    log('error', `Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function testChat() {
  log('info', `Testing chat with model "${OLLAMA_MODEL}"...`);
  
  const payload = {
    model: OLLAMA_MODEL,
    messages: [
      { role: 'user', content: 'Hello! What is your name?' }
    ],
    stream: false,
  };

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 120000, // 2 minutes
    });

    if (response.status === 404) {
      log('error', `Model "${OLLAMA_MODEL}" not found`);
      log('info', `Download it with: ollama pull ${OLLAMA_MODEL}`);
      return false;
    }

    if (!response.ok) {
      log('error', `HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const answer = data.message?.content || 'No response';
    
    log('success', 'Chat test successful!');
    console.log(`${colors.cyan}Response: ${answer}${colors.reset}`);
    return true;
  } catch (error) {
    log('error', `Chat test failed: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.message.includes('timeout')) {
      log('info', 'Model might still be loading. Try again in a moment.');
    }
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}Ollama Configuration Test${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}\n`);
  console.log(`API URL: ${OLLAMA_API_URL}`);
  console.log(`Model: ${OLLAMA_MODEL}\n`);

  const results = {
    health: await testOllamaHealth(),
  };

  if (!results.health) {
    log('error', 'Cannot proceed: Ollama is not running');
    process.exit(1);
  }

  results.models = await listModels();
  
  if (results.models) {
    results.chat = await testChat();
  }

  console.log(`\n${colors.bright}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}Test Summary:${colors.reset}`);
  console.log(`  ${results.health ? colors.green + '✅' : colors.red + '❌'} Ollama Health`);
  console.log(`  ${results.models ? colors.green + '✅' : colors.red + '❌'} Model Available`);
  console.log(`  ${results.chat ? colors.green + '✅' : colors.red + '❌'} Chat Functionality`);
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}\n`);

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    log('success', 'All tests passed! Ollama is ready.');
    process.exit(0);
  } else {
    log('warning', 'Some tests failed. See above for details.');
    process.exit(1);
  }
}

runTests().catch(error => {
  log('error', `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Venice AI API Test Script
 * Tests the Venice API configuration and identifies issues
 */

import OpenAI from 'openai';
import { readFileSync } from 'fs';

// Load environment variables manually
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

const VENICE_API_KEY = envVars.VENICE_API_KEY || process.env.VENICE_API_KEY;

console.log('🔍 Venice AI API Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: API Key Validation
console.log('Test 1: API Key Validation');
console.log('─────────────────────────────────────────');
if (!VENICE_API_KEY) {
  console.error('❌ VENICE_API_KEY not found in environment');
  process.exit(1);
}

console.log(`✓ API Key found: ${VENICE_API_KEY.substring(0, 10)}...${VENICE_API_KEY.substring(VENICE_API_KEY.length - 4)}`);
console.log(`✓ Length: ${VENICE_API_KEY.length} characters`);

// Validate key format (should be alphanumeric with underscores/hyphens)
const keyPattern = /^[A-Za-z0-9_-]+$/;
if (!keyPattern.test(VENICE_API_KEY)) {
  console.error('❌ API Key contains invalid characters');
  process.exit(1);
}
console.log('✓ Format: Valid\n');

// Test 2: Client Initialization
console.log('Test 2: Client Initialization');
console.log('─────────────────────────────────────────');
const client = new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});
console.log('✓ OpenAI client initialized with Venice baseURL\n');

// Test 3: Simple Chat Completion (No JSON, No Web Search)
console.log('Test 3: Basic Chat Completion');
console.log('─────────────────────────────────────────');
try {
  const basicResponse = await client.chat.completions.create({
    model: 'llama-3.3-70b', // Use a simpler model first
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello, Venice API is working!" and nothing else.' }
    ],
    temperature: 0.3,
    max_tokens: 50
  });

  console.log('✓ Basic request successful');
  console.log(`Response: ${basicResponse.choices[0].message.content}\n`);
} catch (error) {
  console.error('❌ Basic request failed');
  console.error(`Status: ${error.status}`);
  console.error(`Message: ${error.message}`);
  console.error(`Headers:`, error.headers);
  if (error.response) {
    console.error(`Response body:`, await error.response.text());
  }
  process.exit(1);
}

// Test 4: JSON Response Format
console.log('Test 4: JSON Response Format');
console.log('─────────────────────────────────────────');
try {
  const jsonResponse = await client.chat.completions.create({
    model: 'llama-3.3-70b',
    messages: [
      { role: 'system', content: 'You are a JSON generator. Always respond with valid JSON.' },
      { role: 'user', content: 'Return a JSON object with keys "status" and "message". Status should be "ok" and message should be "JSON test passed".' }
    ],
    temperature: 0.3,
    max_tokens: 100,
    response_format: { type: 'json_object' }
  });

  const content = jsonResponse.choices[0].message.content;
  console.log('✓ JSON request successful');
  console.log(`Raw response: ${content}`);
  
  const parsed = JSON.parse(content);
  console.log(`Parsed:`, parsed);
  console.log('✓ JSON parsing successful\n');
} catch (error) {
  console.error('❌ JSON request failed');
  console.error(`Status: ${error.status}`);
  console.error(`Message: ${error.message}`);
  if (error.response) {
    console.error(`Response body:`, await error.response.text());
  }
  process.exit(1);
}

// Test 5: Venice Parameters (Web Search)
console.log('Test 5: Venice Parameters with Web Search');
console.log('─────────────────────────────────────────');
try {
  const webSearchResponse = await client.chat.completions.create({
    model: 'llama-3.3-70b',
    messages: [
      { role: 'user', content: 'What is the current weather in London? Just give me a brief answer.' }
    ],
    temperature: 0.3,
    max_tokens: 200,
    venice_parameters: {
      enable_web_search: true,
      include_venice_system_prompt: true
    }
  });

  console.log('✓ Web search request successful');
  console.log(`Response: ${webSearchResponse.choices[0].message.content}\n`);
} catch (error) {
  console.error('❌ Web search request failed');
  console.error(`Status: ${error.status}`);
  console.error(`Message: ${error.message}`);
  if (error.response) {
    console.error(`Response body:`, await error.response.text());
  }
  process.exit(1);
}

// Test 6: Complex Request (Similar to Production)
console.log('Test 6: Production-Like Request');
console.log('─────────────────────────────────────────');
try {
  const productionLikeResponse = await client.chat.completions.create({
    model: 'qwen3-235b',
    messages: [
      {
        role: 'system',
        content: 'You are a sports betting analyst. Respond with JSON only.'
      },
      {
        role: 'user',
        content: `Analyze this soccer match: Barcelona vs Real Madrid at Camp Nou.
        
Weather: 72°F, Clear, 0% rain, 5 mph wind
Market Odds: YES 55%, NO 45%

Return JSON with keys: weather_impact (LOW/MEDIUM/HIGH), confidence (LOW/MEDIUM/HIGH), analysis (string), key_factors (array), recommended_action (string)`
      }
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
    venice_parameters: {
      enable_web_search: true,
      include_venice_system_prompt: true,
      strip_thinking_response: true
    }
  });

  const content = productionLikeResponse.choices[0].message.content;
  console.log('✓ Production-like request successful');
  console.log(`Raw response length: ${content.length} chars`);
  
  const parsed = JSON.parse(content);
  console.log('✓ JSON parsing successful');
  console.log('Parsed keys:', Object.keys(parsed));
  console.log('\nFull response:');
  console.log(JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error('❌ Production-like request failed');
  console.error(`Status: ${error.status}`);
  console.error(`Message: ${error.message}`);
  if (error.response) {
    console.error(`Response body:`, await error.response.text());
  }
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ All tests passed! Venice API is working correctly.');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

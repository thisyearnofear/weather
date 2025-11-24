#!/usr/bin/env node
/**
 * Test different Venice parameter configurations
 */

import OpenAI from 'openai';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

const VENICE_API_KEY = envVars.VENICE_API_KEY || process.env.VENICE_API_KEY;

const client = new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});

const testConfigs = [
  {
    name: 'No venice_parameters',
    config: {}
  },
  {
    name: 'Only enable_web_search: true',
    config: { venice_parameters: { enable_web_search: true } }
  },
  {
    name: 'enable_web_search: "auto"',
    config: { venice_parameters: { enable_web_search: 'auto' } }
  },
  {
    name: 'All venice_parameters',
    config: { 
      venice_parameters: { 
        enable_web_search: true,
        include_venice_system_prompt: true,
        strip_thinking_response: true
      } 
    }
  },
  {
    name: 'Only include_venice_system_prompt: false',
    config: { venice_parameters: { include_venice_system_prompt: false } }
  }
];

for (const test of testConfigs) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log('─────────────────────────────────────────');
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with JSON only.'
        },
        {
          role: 'user',
          content: 'Return a JSON object with "status": "ok" and "test": "passed"'
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
      ...test.config
    });

    console.log('✅ SUCCESS');
    console.log(`Response: ${response.choices[0].message.content.substring(0, 100)}...`);
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log(`Status: ${error.status}, Message: ${error.message}`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test complete');

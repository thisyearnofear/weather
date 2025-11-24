#!/usr/bin/env node
/**
 * Test different Venice models to find one that works well for JSON
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

const models = [
  'llama-3.3-70b',
  'llama-3.1-405b',
  'mistral-31-24b',
  'qwen3-235b'
];

const testPrompt = {
  system: 'You are a sports analyst. Respond with ONLY valid JSON, no thinking tags, no markdown.',
  user: 'Analyze: Barcelona vs Real Madrid. Weather: 72°F, Clear. Return JSON with keys: weather_impact, confidence, analysis, key_factors (array), recommended_action'
};

for (const model of models) {
  console.log(`\n🧪 Testing model: ${model}`);
  console.log('─────────────────────────────────────────');
  
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: testPrompt.system },
        { role: 'user', content: testPrompt.user }
      ],
      temperature: 0.3,
      max_tokens: 500,
      venice_parameters: {
        enable_web_search: 'auto'
      }
    });

    const content = response.choices[0].message.content;
    console.log(`Response length: ${content.length} chars`);
    console.log(`First 200 chars: ${content.substring(0, 200)}...`);
    
    // Check for thinking tags
    if (content.includes('<think>')) {
      console.log('❌ Contains thinking tags');
      continue;
    }
    
    // Try to parse JSON
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json\n?|\n?```/g, '').trim();
    }
    
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    try {
      const parsed = JSON.parse(jsonContent);
      console.log('✅ Valid JSON!');
      console.log('Keys:', Object.keys(parsed).join(', '));
    } catch (e) {
      console.log('❌ JSON parsing failed:', e.message);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Model testing complete');

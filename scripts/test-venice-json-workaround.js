#!/usr/bin/env node
/**
 * Test Venice API JSON workaround
 * Venice doesn't support response_format, so we need to use prompt engineering
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

const client = new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});

console.log('🧪 Testing JSON workaround (prompt engineering instead of response_format)\n');

try {
  const response = await client.chat.completions.create({
    model: 'qwen3-235b',
    messages: [
      {
        role: 'system',
        content: `You are a sports betting analyst. You MUST respond with ONLY valid JSON, no other text.

Your response must be a single JSON object with these exact keys:
- weather_impact: string (LOW, MEDIUM, or HIGH)
- odds_efficiency: string (FAIR, OVERPRICED, UNDERPRICED, or UNKNOWN)
- confidence: string (LOW, MEDIUM, or HIGH)
- analysis: string (detailed reasoning)
- key_factors: array of strings
- recommended_action: string

Do not include any text before or after the JSON object.`
      },
      {
        role: 'user',
        content: `Analyze this soccer match:

EVENT: Barcelona vs Real Madrid
VENUE: Camp Nou, Barcelona, Spain
DATE: 2025-11-29
TYPE: Soccer

WEATHER:
- Temperature: 72°F
- Condition: Clear
- Precipitation: 0%
- Wind: 5 mph

MARKET ODDS: YES 55%, NO 45%

Respond with ONLY the JSON object, no other text.`
      }
    ],
    temperature: 0.3,
    max_tokens: 1000,
    // REMOVED: response_format: { type: 'json_object' }
    venice_parameters: {
      enable_web_search: true,
      include_venice_system_prompt: false, // Don't add extra system prompt
      strip_thinking_response: true
    }
  });

  const content = response.choices[0].message.content;
  console.log('✓ Request successful\n');
  console.log('Raw response:');
  console.log('─────────────────────────────────────────');
  console.log(content);
  console.log('─────────────────────────────────────────\n');

  // Try to parse JSON (handle markdown code blocks)
  let jsonContent = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/```json\n?|\n?```/g, '').trim();
  }
  
  const parsed = JSON.parse(jsonContent);
  console.log('✓ JSON parsing successful\n');
  console.log('Parsed object:');
  console.log(JSON.stringify(parsed, null, 2));
  
  console.log('\n✅ Workaround successful! Use prompt engineering instead of response_format.');
  
} catch (error) {
  console.error('❌ Request failed');
  console.error(`Status: ${error.status}`);
  console.error(`Message: ${error.message}`);
  process.exit(1);
}

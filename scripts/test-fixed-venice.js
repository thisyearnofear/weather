#!/usr/bin/env node
/**
 * Test the fixed Venice AI integration
 * This simulates the actual production flow
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

console.log('🧪 Testing Fixed Venice AI Integration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test Case: Randers FC match (from your logs)
const testEvent = {
  title: 'Will Randers FC win on 2025-11-24?',
  eventType: 'Soccer',
  participants: ['Randers FC'],
  location: { name: 'Randers, Denmark' },
  weatherData: {
    current: {
      temp_f: 45,
      condition: { text: 'Cloudy' },
      precip_chance: 20,
      wind_mph: 12
    }
  },
  currentOdds: { yes: '46.0%', no: '45.0%' },
  eventDate: '2025-11-24'
};

console.log('Test Event:', testEvent.title);
console.log('Location:', testEvent.location.name);
console.log('Weather:', `${testEvent.weatherData.current.temp_f}°F, ${testEvent.weatherData.current.condition.text}\n`);

const messages = [
  {
    role: 'system',
    content: `You are an expert sports betting analyst specializing in weather impacts on game outcomes. Provide SPECIFIC, ACTIONABLE analysis with clear reasoning.

STRICT REQUIREMENTS:
- Tailor analysis to the given sport and participants only
- Do NOT reuse or reference any example content; generate event-specific analysis
- You MUST respond with ONLY a valid JSON object, no other text before or after
- Do NOT wrap the JSON in markdown code blocks
- Output a single JSON object with the required fields only`
  },
  {
    role: 'user',
    content: `EVENT CONTEXT
- Event Title: ${testEvent.title}
- Event Type: ${testEvent.eventType}
- Participants: ${testEvent.participants.join(' vs ')}
- Venue: ${testEvent.location.name}
- Scheduled Date: ${testEvent.eventDate}

WEATHER
- Temperature: ${testEvent.weatherData.current.temp_f}°F
- Condition: ${testEvent.weatherData.current.condition.text}
- Precipitation chance: ${testEvent.weatherData.current.precip_chance}%
- Wind: ${testEvent.weatherData.current.wind_mph} mph

MARKET ODDS: YES: ${testEvent.currentOdds.yes}, NO: ${testEvent.currentOdds.no}

RESPONSE FORMAT - You MUST respond with ONLY this JSON structure, no other text:
{
  "weather_impact": "LOW|MEDIUM|HIGH",
  "odds_efficiency": "FAIR|OVERPRICED|UNDERPRICED|UNKNOWN",
  "confidence": "LOW|MEDIUM|HIGH",
  "analysis": "Event-specific reasoning only, no example content",
  "key_factors": ["specific, measurable factors"],
  "recommended_action": "Clear recommendation"
}

Respond with ONLY the JSON object above. Do not include any text before or after the JSON.`
  }
];

try {
  console.log('🤖 Calling Venice AI with fixed parameters...\n');
  
  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b', // Changed from qwen3-235b - it outputs thinking tags
    messages,
    temperature: 0.3,
    max_tokens: 1000,
    venice_parameters: {
      enable_web_search: 'auto' // Fixed: string "auto" instead of boolean true
    }
  });

  let content = response.choices[0].message.content;
  console.log('Raw Response (first 500 chars):');
  console.log('─────────────────────────────────────────');
  console.log(content.substring(0, 500) + '...');
  console.log('─────────────────────────────────────────\n');

  // Clean the response
  content = content.trim();
  
  // Remove thinking tags if present
  if (content.includes('<think>')) {
    console.log('⚠️  Response contains thinking tags - removing...\n');
    const thinkEnd = content.lastIndexOf('</think>');
    if (thinkEnd !== -1) {
      content = content.substring(thinkEnd + 8).trim();
    }
  }
  
  // Strip markdown code blocks if present
  if (content.startsWith('```')) {
    console.log('⚠️  Response wrapped in markdown - stripping...\n');
    content = content.replace(/```json\n?|\n?```/g, '').trim();
  }
  
  // Extract JSON if there's text before/after
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    content = jsonMatch[0];
  }

  const parsed = JSON.parse(content);
  
  console.log('✅ JSON Parsing Successful!\n');
  console.log('Parsed Analysis:');
  console.log('─────────────────────────────────────────');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('─────────────────────────────────────────\n');

  // Validate response structure
  const requiredKeys = ['weather_impact', 'odds_efficiency', 'confidence', 'analysis', 'key_factors', 'recommended_action'];
  const missingKeys = requiredKeys.filter(key => !(key in parsed));
  
  if (missingKeys.length > 0) {
    console.log('⚠️  Missing keys:', missingKeys.join(', '));
  } else {
    console.log('✅ All required keys present');
  }

  if (Array.isArray(parsed.key_factors) && parsed.key_factors.length > 0) {
    console.log('✅ Key factors is valid array');
  } else {
    console.log('⚠️  Key factors is not a valid array');
  }

  if (parsed.analysis && parsed.analysis.length > 20) {
    console.log('✅ Analysis has meaningful content');
  } else {
    console.log('⚠️  Analysis is too short or missing');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Venice AI integration test PASSED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error) {
  console.error('❌ Test FAILED\n');
  console.error('Error:', error.message);
  console.error('Status:', error.status);
  
  if (error.response) {
    console.error('Response:', await error.response.text());
  }
  
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Test Deep Reasoning vs. Standard Llama 3.3 70B
 * Compares quality, length, and analytical depth
 * 
 * FINDINGS FROM VENICE AI DOCS:
 * - Qwen QwQ 32B: Dedicated reasoning model (best for complex analysis)
 * - Qwen3-235B: Has thinking mode available
 * - Uses <think></think> tags for reasoning steps
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

// Test market data
const testMarket = {
  title: 'Will Manchester City beat Liverpool in the Premier League this season?',
  eventType: 'Soccer',
  participants: ['Manchester City', 'Liverpool'],
  location: { name: 'Manchester, England' },
  currentOdds: { yes: 0.58, no: 0.42 },
  weatherData: {
    current: {
      temp_f: 48,
      condition: { text: 'Rainy' },
      precip_chance: 75,
      wind_mph: 18
    }
  }
};

console.log('🧠 Testing Deep Reasoning Capabilities\n');
console.log('═════════════════════════════════════════════════════════════\n');

// Standard analysis prompt (what we use now)
const systemPrompt = `You are an expert sports betting analyst specializing in weather impacts on game outcomes. Provide SPECIFIC, ACTIONABLE analysis with clear reasoning.

STRICT REQUIREMENTS:
- Tailor analysis to the given sport and participants only
- Do NOT reuse or reference any example content; generate event-specific analysis
- You MUST respond with ONLY a valid JSON object, no other text before or after
- Do NOT wrap the JSON in markdown code blocks
- Output a single JSON object with the required fields only`;

const userPrompt = `EVENT CONTEXT
- Event Title: ${testMarket.title}
- Event Type: ${testMarket.eventType}
- Participants: ${testMarket.participants.join(' vs ')}
- Venue: ${testMarket.location.name}

WEATHER
- Temperature: ${testMarket.weatherData.current.temp_f}°F
- Condition: ${testMarket.weatherData.current.condition.text}
- Precipitation chance: ${testMarket.weatherData.current.precip_chance}%
- Wind: ${testMarket.weatherData.current.wind_mph} mph

MARKET ODDS: YES: ${(testMarket.currentOdds.yes * 100).toFixed(1)}%, NO: ${(testMarket.currentOdds.no * 100).toFixed(1)}%

RESPONSE FORMAT - You MUST respond with ONLY this JSON structure, no other text:
{
  "weather_impact": "LOW|MEDIUM|HIGH",
  "odds_efficiency": "FAIR|OVERPRICED|UNDERPRICED|UNKNOWN",
  "confidence": "LOW|MEDIUM|HIGH",
  "analysis": "Event-specific reasoning only, no example content",
  "key_factors": ["specific, measurable factors"],
  "recommended_action": "Clear recommendation"
}

Respond with ONLY the JSON object above. Do not include any text before or after the JSON.`;

// Test configurations
const tests = [
  {
    name: 'Current Setup: Llama 3.3 70B',
    model: 'llama-3.3-70b',
    venice_parameters: {
      enable_web_search: 'auto'
    },
    temperature: 0.3,
    max_tokens: 1000
  },
  {
    name: 'Deep Reasoning: Qwen3-235B (Enhanced)',
    model: 'qwen3-235b',
    venice_parameters: {
      enable_web_search: 'auto'
      // Qwen3-235B supports thinking/reasoning mode
      // It will use <think></think> internally for complex reasoning
    },
    temperature: 0.3,
    max_tokens: 2000 // Allow more tokens for thinking steps
  }
];

// Function to clean and parse JSON response
function extractJSON(content) {
  let cleaned = content.trim();
  
  // Remove thinking tags if present
  if (cleaned.includes('<think>')) {
    const thinkEnd = cleaned.lastIndexOf('</think>');
    if (thinkEnd !== -1) {
      cleaned = cleaned.substring(thinkEnd + 8).trim();
    }
  }
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json\n?|\n?```/g, '').trim();
  }
  
  // Extract JSON object if wrapped in text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

// Run tests
for (const test of tests) {
  console.log(`\n📊 ${test.name}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Model: ${test.model}`);
  console.log(`Temperature: ${test.temperature}`);
  console.log(`Max Tokens: ${test.max_tokens}`);
  
  try {
    const startTime = Date.now();
    
    const response = await client.chat.completions.create({
      model: test.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: test.temperature,
      max_tokens: test.max_tokens,
      venice_parameters: test.venice_parameters
    });
    
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;
    
    const rawContent = response.choices[0].message.content;
    const jsonContent = extractJSON(rawContent);
    
    console.log(`\n⏱️  Response time: ${responseTime.toFixed(2)}s`);
    console.log(`📏 Raw response length: ${rawContent.length} characters`);
    console.log(`📏 Tokens used: ~${Math.ceil(rawContent.length / 4)} (estimated)`);
    
    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
      console.log('\n✅ JSON parsed successfully');
      
      // Display parsed results
      console.log('\n📋 Analysis Results:');
      console.log(`  Weather Impact: ${parsed.weather_impact}`);
      console.log(`  Odds Efficiency: ${parsed.odds_efficiency}`);
      console.log(`  Confidence: ${parsed.confidence}`);
      
      console.log('\n📝 Analysis Text:');
      console.log(`  "${parsed.analysis.substring(0, 150)}..."`);
      console.log(`  (${parsed.analysis.length} characters total)`);
      
      console.log('\n🔑 Key Factors:');
      if (Array.isArray(parsed.key_factors)) {
        parsed.key_factors.forEach((factor, i) => {
          console.log(`  ${i + 1}. ${factor}`);
        });
      }
      
      console.log('\n💡 Recommended Action:');
      console.log(`  "${parsed.recommended_action}"`);
      
      // Quality assessment
      console.log('\n📊 Quality Metrics:');
      console.log(`  ✓ Analysis depth: ${parsed.analysis.length > 200 ? 'High' : parsed.analysis.length > 100 ? 'Medium' : 'Low'}`);
      console.log(`  ✓ Key factors specificity: ${parsed.key_factors.filter(f => f.length > 30).length}/${parsed.key_factors.length} specific`);
      console.log(`  ✓ Reasoning clarity: ${parsed.analysis.includes('because') || parsed.analysis.includes('due to') ? 'Clear causal logic' : 'Generic statements'}`);
      
    } catch (parseErr) {
      console.log('\n❌ Failed to parse JSON');
      console.log('Response content (first 300 chars):');
      console.log(rawContent.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`\n❌ Request failed: ${error.message}`);
  }
}

console.log('\n\n═════════════════════════════════════════════════════════════');
console.log('💾 SUMMARY & RECOMMENDATIONS\n');

console.log('Based on Venice AI documentation:\n');

console.log('CURRENT SETUP (Llama 3.3 70B):');
console.log('  Pros:');
console.log('    ✓ Fast response time (good UX)');
console.log('    ✓ Low cost (~$0.01/analysis)');
console.log('    ✓ Practical analysis with web search');
console.log('    ✓ Reliable JSON output');
console.log('  Cons:');
console.log('    ✗ No reasoning transparency');
console.log('    ✗ Surface-level analysis');
console.log('    ✗ Limited logical step-by-step breakdown\n');

console.log('DEEP REASONING (Qwen3-235B):');
console.log('  Pros:');
console.log('    ✓ Advanced reasoning capability');
console.log('    ✓ Better for complex decisions');
console.log('    ✓ Shows thinking process in <think></think> tags');
console.log('    ✓ Can be instructed to hide reasoning for clean output');
console.log('  Cons:');
console.log('    ✗ ~3x more expensive (~$0.03/analysis)');
console.log('    ✗ Slower response time');
console.log('    ✗ May generate <think> tags if not stripped\n');

console.log('RECOMMENDATION FOR YOUR CHARGING MODEL:\n');
console.log('OPTION 1: Stay with Llama 3.3 70B (Recommended for MVP)');
console.log('  → $1 = 10 credits (1 analysis/credit)');
console.log('  → Margin: 98%+');
console.log('  → Cost: ~$0.01 per analysis\n');

console.log('OPTION 2: Hybrid Tier System (Future Enhancement)');
console.log('  → Basic: Llama 3.3 70B = 1 credit ($0.10)');
console.log('  → Deep: Qwen3-235B = 5 credits ($0.50)');
console.log('  → Allow users to choose per analysis\n');

console.log('OPTION 3: Use Qwen3-235B exclusively (Best Quality)');
console.log('  → $1 = 5-6 credits (higher cost but better analysis)');
console.log('  → Margin: 85%+');
console.log('  → Cost: ~$0.03 per analysis\n');

console.log('═════════════════════════════════════════════════════════════\n');

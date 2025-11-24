#!/usr/bin/env node
/**
 * Test the complete production analysis flow
 * Simulates what happens when a user clicks "Analyze" on a market
 */

import { readFileSync } from 'fs';

// Load environment variables manually
const envContent = readFileSync('.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    process.env[match[1]] = match[2].trim();
  }
});

import { analyzeWeatherImpactServer } from '../services/aiService.server.js';

console.log('🧪 Testing Production Analysis Flow\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test Case 1: Soccer match with location
const testCase1 = {
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
    },
    forecast: {
      forecastday: [{
        date: '2025-11-24',
        day: {
          avgtemp_f: 45,
          condition: { text: 'Cloudy' },
          daily_chance_of_rain: 20,
          maxwind_mph: 12
        }
      }]
    }
  },
  currentOdds: { yes: '46.0%', no: '45.0%' },
  marketId: 'test-randers-fc-123',
  eventDate: '2025-11-24',
  isFuturesBet: false,
  mode: 'basic'
};

console.log('Test Case 1: Soccer Match Analysis');
console.log('─────────────────────────────────────────');
console.log(`Event: ${testCase1.title}`);
console.log(`Location: ${testCase1.location.name}`);
console.log(`Weather: ${testCase1.weatherData.current.temp_f}°F, ${testCase1.weatherData.current.condition.text}`);
console.log(`Odds: YES ${testCase1.currentOdds.yes}, NO ${testCase1.currentOdds.no}\n`);

try {
  console.log('🔄 Running analysis...\n');
  
  const result = await analyzeWeatherImpactServer(testCase1);
  
  console.log('✅ Analysis Complete!\n');
  console.log('Results:');
  console.log('─────────────────────────────────────────');
  console.log('Assessment:');
  console.log(`  Weather Impact: ${result.assessment.weather_impact}`);
  console.log(`  Odds Efficiency: ${result.assessment.odds_efficiency}`);
  console.log(`  Confidence: ${result.assessment.confidence}`);
  console.log('\nAnalysis:');
  console.log(`  ${result.analysis.substring(0, 200)}...`);
  console.log('\nKey Factors:');
  result.key_factors.forEach((factor, i) => {
    console.log(`  ${i + 1}. ${factor}`);
  });
  console.log('\nRecommended Action:');
  console.log(`  ${result.recommended_action}`);
  console.log('\nWeather Conditions:');
  if (result.weather_conditions) {
    console.log(`  Location: ${result.weather_conditions.location}`);
    console.log(`  Temperature: ${result.weather_conditions.temperature}`);
    console.log(`  Condition: ${result.weather_conditions.condition}`);
    console.log(`  Precipitation: ${result.weather_conditions.precipitation}`);
    console.log(`  Wind: ${result.weather_conditions.wind}`);
  } else {
    console.log('  ⚠️  Weather conditions not included in response');
  }
  console.log('\nMetadata:');
  console.log(`  Cached: ${result.cached}`);
  console.log(`  Source: ${result.source}`);
  
  // Validate response structure
  console.log('\n📋 Validation:');
  const checks = [
    { name: 'Has assessment', pass: !!result.assessment },
    { name: 'Has weather_impact', pass: !!result.assessment?.weather_impact },
    { name: 'Has odds_efficiency', pass: !!result.assessment?.odds_efficiency },
    { name: 'Has confidence', pass: !!result.assessment?.confidence },
    { name: 'Has analysis text', pass: result.analysis?.length > 20 },
    { name: 'Has key_factors array', pass: Array.isArray(result.key_factors) && result.key_factors.length > 0 },
    { name: 'Has recommended_action', pass: !!result.recommended_action },
    { name: 'Has weather_conditions', pass: !!result.weather_conditions },
  ];
  
  checks.forEach(check => {
    console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.pass);
  
  if (allPassed) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Production flow test PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Some validation checks failed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Analysis Failed\n');
  console.error('Error:', error.message);
  console.error('\nStack:', error.stack);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ Production flow test FAILED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  process.exit(1);
}

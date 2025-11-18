import { describe, it, expect } from 'vitest';
import { polymarketService } from '../services/polymarketService.js';

describe('API /markets endpoint simulation', () => {
  it('should process the exact request from /sports page', async () => {
    console.log('\n🔄 Simulating exact POST /api/markets request from /sports page...\n');
    
    // This is the exact request body sent by the page (line 200-212 of page.js)
    const filters = {
      weatherData: null,
      location: null,
      eventType: 'all',  // Default from page
      confidence: 'MEDIUM',  // Default from page
      limitCount: 12,
      excludeFutures: true,  // Default: !includeFutures
      searchText: null,
      maxDaysToResolution: 14,
      minVolume: 50000,
      analysisType: 'event-weather'
    };
    
    console.log('📤 Request filters:', filters);
    
    // Call the service method exactly like the API route does
    const result = await polymarketService.getTopWeatherSensitiveMarkets(12, filters);
    
    console.log(`\n📥 Service response:`, {
      marketsCount: result.markets?.length || 0,
      totalFound: result.totalFound,
      message: result.message,
      hasError: !!result.error
    });
    
    if (result.markets && result.markets.length > 0) {
      console.log(`\n✅ SUCCESS: Got ${result.markets.length} markets`);
      console.log('\n📋 First 3 markets:');
      result.markets.slice(0, 3).forEach((m, i) => {
        console.log(`\n  [${i+1}] "${m.title}"`);
        console.log(`      Event Type: ${m.eventType || 'UNKNOWN'}`);
        console.log(`      Edge Score: ${m.edgeScore?.toFixed(1) || 0}`);
        console.log(`      Confidence: ${m.confidence || 'UNKNOWN'}`);
        console.log(`      Location: ${m.eventLocation || 'UNKNOWN'}`);
      });
    } else {
      console.log(`\n❌ FAILURE: Got 0 markets`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Reason: ${result.noEdgesReason}`);
    }
    
    expect(result).toBeDefined();
  });

  it('should work with NFL filter specifically', async () => {
    console.log('\n🔄 Testing with NFL filter explicitly...\n');
    
    const filters = {
      weatherData: null,
      location: null,
      eventType: 'NFL',  // Explicit NFL filter
      confidence: 'MEDIUM',
      limitCount: 12,
      excludeFutures: true,
      searchText: null,
      maxDaysToResolution: 14,
      minVolume: 50000,
      analysisType: 'event-weather'
    };
    
    console.log('📤 Request filters:', filters);
    
    const result = await polymarketService.getTopWeatherSensitiveMarkets(12, filters);
    
    console.log(`\n📥 Result: ${result.markets?.length || 0} markets`);
    if (result.markets?.length > 0) {
      console.log(`\n✅ Got NFL markets`);
      result.markets.slice(0, 2).forEach((m, i) => {
        console.log(`   [${i+1}] ${m.title} (${m.eventType})`);
      });
    } else {
      console.log(`\n❌ No NFL markets returned`);
    }
    
    expect(result).toBeDefined();
  });

  it('should show the confidence filtering issue', async () => {
    console.log('\n🔍 Testing confidence level filtering...\n');
    
    // Get markets with different confidence levels
    const allFilters = {
      weatherData: null,
      location: null,
      eventType: 'NFL',
      limitCount: 20,
      excludeFutures: true,
      analysisType: 'event-weather'
    };
    
    const confidenceLevels = ['HIGH', 'MEDIUM', 'LOW', 'all'];
    
    for (const confidence of confidenceLevels) {
      const filters = { ...allFilters, confidence };
      const result = await polymarketService.getTopWeatherSensitiveMarkets(20, filters);
      
      console.log(`Confidence: ${confidence.padEnd(8)} → ${(result.markets?.length || 0).toString().padEnd(3)} markets`);
      
      if (result.markets?.length > 0) {
        const scores = result.markets.map(m => m.edgeScore);
        const confs = result.markets.map(m => m.confidence);
        console.log(`   Scores: min=${Math.min(...scores).toFixed(1)}, max=${Math.max(...scores).toFixed(1)}`);
        console.log(`   Confidences: ${[...new Set(confs)].join(', ')}`);
      }
    }
  });
});

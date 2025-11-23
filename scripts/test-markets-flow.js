#!/usr/bin/env node

/**
 * Test the full markets flow end-to-end
 * Simulates clicking "Today" on Soccer in the markets page
 */

import { polymarketService } from '../services/polymarketService.js';

async function testFlow() {
  console.log('🧪 Testing full markets flow (Today + Soccer)...\n');

  try {
    // Simulate the exact API call from the markets page when user clicks "Today" on Soccer
    const filters = {
      eventType: 'Soccer',
      confidence: 'MEDIUM',
      minVolume: 10000,
      maxDaysToResolution: 1, // Today
      analysisType: 'event-weather',
      excludeFutures: true
    };

    console.log('📤 Calling getTopWeatherSensitiveMarkets with filters:', filters);
    console.log('');
    
    const result = await polymarketService.getTopWeatherSensitiveMarkets(50, filters);

    console.log('\n✅ Final result:');
    console.log(`   Markets returned: ${result.markets?.length || 0}`);
    console.log(`   Total found: ${result.totalFound}`);
    console.log(`   Error: ${result.error || 'None'}`);

    if (result.markets && result.markets.length > 0) {
      console.log(`\n📊 Sample markets:`);
      result.markets.slice(0, 3).forEach((m, i) => {
        console.log(`\n   Market ${i + 1}:`);
        console.log(`     Title: ${m.title}`);
        console.log(`     Event Type: ${m.eventType}`);
        console.log(`     Volume 24h: ${m.volume24h}`);
        console.log(`     Resolution Date: ${m.resolutionDate}`);
        console.log(`     Edge Score: ${m.edgeScore}`);
      });
    } else {
      console.log('\n❌ No markets returned - investigating why...');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFlow();

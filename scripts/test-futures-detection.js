#!/usr/bin/env node

/**
 * Test futures detection without weather API calls
 */

import { polymarketService } from '../services/polymarketService.js';
import { MarketTypeDetector } from '../services/marketTypeDetector.js';

async function testFuturesDetection() {
  console.log('🧪 Testing Futures Detection\n');
  
  try {
    // Build catalog
    console.log('📊 Fetching Sports markets...');
    const catalog = await polymarketService.buildMarketCatalog(10000, 'Sports');
    
    console.log(`✅ Catalog: ${catalog.markets?.length || 0} markets\n`);
    
    if (!catalog.markets || catalog.markets.length === 0) {
      console.log('⚠️  No markets found');
      return;
    }
    
    // Test futures detection on each market
    console.log('🔍 Testing Futures Detection:\n');
    
    const results = catalog.markets.slice(0, 20).map(m => {
      const detection = MarketTypeDetector.detectMarketType(m);
      const resDate = m.resolutionDate ? new Date(m.resolutionDate) : null;
      const daysAway = resDate ? Math.round((resDate - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';
      
      return {
        title: m.title?.substring(0, 70),
        daysAway,
        isFutures: detection.isFutures,
        confidence: detection.confidence,
        totalScore: detection.totalScore,
        signals: detection.signals.map(s => `${s.signal}:${s.score}`).join(', ')
      };
    });
    
    // Group by futures vs single events
    const futures = results.filter(r => r.isFutures);
    const singleEvents = results.filter(r => !r.isFutures);
    
    console.log(`📈 FUTURES MARKETS (${futures.length}):`);
    futures.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title}`);
      console.log(`      Days: ${r.daysAway} | Score: ${r.totalScore} | ${r.signals}`);
    });
    
    console.log(`\n🎯 SINGLE EVENT MARKETS (${singleEvents.length}):`);
    singleEvents.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title}`);
      console.log(`      Days: ${r.daysAway} | Score: ${r.totalScore} | ${r.signals}`);
    });
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total markets: ${results.length}`);
    console.log(`   Futures: ${futures.length} (${((futures.length/results.length)*100).toFixed(0)}%)`);
    console.log(`   Single events: ${singleEvents.length} (${((singleEvents.length/results.length)*100).toFixed(0)}%)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testFuturesDetection();

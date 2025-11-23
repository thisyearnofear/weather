#!/usr/bin/env node

/**
 * Direct Polymarket API Testing Script
 * Run with: node scripts/test-polymarket-api.js
 * 
 * This tests the Polymarket API responses directly to diagnose
 * why the markets page is returning no results
 */

import axios from 'axios';

const baseURL = 'https://gamma-api.polymarket.com';

async function testAPI() {
  console.log('🧪 Testing Polymarket API...\n');

  try {
    // Test 1: Get sports metadata
    console.log('📋 TEST 1: Fetching sports metadata...');
    const sportsResponse = await axios.get(`${baseURL}/sports`, { timeout: 10000 });
    console.log(`✅ Sports metadata: ${sportsResponse.data.length} sports found`);
    
    // Find soccer
    const soccer = sportsResponse.data.find(s => s.sport === 'epl' || s.sport?.includes('soccer'));
    console.log(`   Sample sport:`, {
      sport: soccer?.sport,
      label: soccer?.label,
      tags: soccer?.tags
    });

    // Test 2: Fetch Soccer markets using tag
    console.log('\n📋 TEST 2: Fetching Soccer events...');
    const soccerTags = sportsResponse.data
      .filter(s => ['epl', 'lal', 'ucl', 'sea'].includes(s.sport))
      .map(s => {
        const tagArray = s.tags?.split(',') || [];
        const specificTag = tagArray.find(t => t !== '1' && t !== '100639');
        return specificTag;
      })
      .filter(Boolean);

    console.log(`   Found ${soccerTags.length} soccer league tags: ${soccerTags.slice(0, 3).join(', ')}`);

    if (soccerTags.length > 0) {
      const firstTag = soccerTags[0];
      console.log(`   Testing with tag ${firstTag}...`);
      
      const eventsResponse = await axios.get(`${baseURL}/events`, {
        params: {
          tag_id: firstTag,
          closed: false,
          limit: 10
        },
        timeout: 10000
      });

      console.log(`   ✅ Events response:`, {
        isArray: Array.isArray(eventsResponse.data),
        length: Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 'N/A',
        firstEventStructure: eventsResponse.data[0] ? {
          id: eventsResponse.data[0].id,
          title: eventsResponse.data[0].title,
          hasMarkets: !!eventsResponse.data[0].markets,
          marketCount: eventsResponse.data[0].markets?.length
        } : 'No events'
      });

      // Test 3: Check market structure
      if (eventsResponse.data[0]?.markets?.length > 0) {
        const market = eventsResponse.data[0].markets[0];
        console.log(`\n📋 TEST 3: Market structure...`);
        console.log(`   Full market fields:`, Object.keys(market).sort());
        console.log(`   Sample market values:`, {
          id: market.id || market.tokenID,
          question: market.question,
          title: market.title,
          description: market.description,
          volume24h: market.volume24h || market.volume24hr,
          liquidity: market.liquidity,
          endDate: market.endDate || market.end_date,
          hasOutcomePrices: !!market.outcomePrices,
          clobTokenIds: market.clobTokenIds
        });
      }
    }

    // Test 4: NFL
    console.log('\n📋 TEST 4: Fetching NFL events...');
    const nflResponse = await axios.get(`${baseURL}/events`, {
      params: {
        tag_id: '450', // NFL tag
        closed: false,
        limit: 5
      },
      timeout: 10000
    });
    console.log(`   ✅ NFL events:`, {
      total: Array.isArray(nflResponse.data) ? nflResponse.data.length : 'N/A',
      firstEventHasMarkets: nflResponse.data[0]?.markets?.length > 0
    });

    // Test 5: Generic events fetch
    console.log('\n📋 TEST 5: Fetching generic active events...');
    const genericResponse = await axios.get(`${baseURL}/events`, {
      params: {
        limit: 100,
        closed: false
      },
      timeout: 10000
    });
    
    const allEvents = Array.isArray(genericResponse.data) ? genericResponse.data : [];
    const eventsWithMarkets = allEvents.filter(e => e.markets?.length > 0);
    
    console.log(`   ✅ Generic events:`, {
      totalEvents: allEvents.length,
      eventsWithMarkets: eventsWithMarkets.length,
      totalMarkets: eventsWithMarkets.reduce((sum, e) => sum + e.markets.length, 0)
    });

    // Sample market analysis
    const allMarkets = eventsWithMarkets.flatMap(e => e.markets || []);
    const highVolumeMarkets = allMarkets.filter(m => (m.volume24h || m.volume24hr || 0) >= 10000);
    
    console.log(`   Markets volume analysis:`, {
      total: allMarkets.length,
      volume10k: highVolumeMarkets.length,
      volume50k: allMarkets.filter(m => (m.volume24h || m.volume24hr || 0) >= 50000).length,
      topVolumeMarket: highVolumeMarkets[0] ? {
        title: highVolumeMarkets[0].title,
        volume: highVolumeMarkets[0].volume24h || highVolumeMarkets[0].volume24hr
      } : 'None'
    });

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    process.exit(1);
  }
}

testAPI();

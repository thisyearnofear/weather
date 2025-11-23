#!/usr/bin/env node

/**
 * Test the exact request that the frontend makes
 */

async function testFrontendRequest() {
  console.log('🧪 Testing exact frontend request...\n');

  try {
    const requestBody = {
      weatherData: null,
      location: null,
      eventType: 'Soccer',
      confidence: 'MEDIUM',
      limitCount: 50,
      maxDaysToResolution: 1, // Today
      minVolume: 10000,
      analysisType: 'event-weather',
      theme: undefined,
      dateRange: 'today'
    };

    console.log('📤 Sending request to http://localhost:3000/api/markets');
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await fetch('http://localhost:3000/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('');

    const result = await response.json();

    console.log('Response body:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.success && result.markets && result.markets.length > 0) {
      console.log(`✅ SUCCESS! Got ${result.markets.length} markets`);
      console.log('\nSample markets:');
      result.markets.slice(0, 3).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.title}`);
        console.log(`     Volume: ${m.volume24h}, ResDate: ${m.resolutionDate}`);
      });
    } else {
      console.log('❌ FAILED');
      console.log('Error:', result.error || result.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFrontendRequest();

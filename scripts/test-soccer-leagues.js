#!/usr/bin/env node
/**
 * Test fetching soccer markets using the correct league tags
 */

import axios from 'axios';

const BASE_URL = 'https://gamma-api.polymarket.com';

async function testSoccerLeagues() {
    console.log('⚽ Testing Soccer League Markets\n');
    console.log('='.repeat(60));

    // Soccer leagues from /sports endpoint
    const soccerLeagues = [
        { code: 'epl', name: 'English Premier League', tags: '1,82,306,100639,100350' },
        { code: 'lal', name: 'La Liga', tags: '1,780,100639,100350' },
        { code: 'ucl', name: 'UEFA Champions League', tags: '1,100977,100639,1234,100350' },
        { code: 'sea', name: 'Serie A', tags: '1,100639,101962,100350' },
        { code: 'bun', name: 'Bundesliga', tags: '1,1494,100639,100350' },
        { code: 'mls', name: 'MLS', tags: '1,100639,100350,100100' }
    ];

    let totalSoccerMarkets = 0;
    const allSoccerEvents = [];

    for (const league of soccerLeagues) {
        try {
            console.log(`\n📡 Fetching ${league.name} (${league.code})...`);

            // Get the first tag ID (usually the sport-specific one)
            const tagIds = league.tags.split(',');
            const primaryTag = tagIds.find(t => t !== '1' && t !== '100639') || tagIds[0];

            const response = await axios.get(`${BASE_URL}/events`, {
                params: {
                    tag_id: primaryTag,
                    closed: false,
                    limit: 50
                },
                timeout: 10000
            });

            const events = response.data;
            console.log(`   ✅ Found ${events.length} events`);

            // Count markets
            let marketCount = 0;
            for (const event of events) {
                if (event.markets && Array.isArray(event.markets)) {
                    marketCount += event.markets.length;
                }
            }

            console.log(`   📦 Total markets: ${marketCount}`);
            totalSoccerMarkets += marketCount;
            allSoccerEvents.push(...events);

            // Show sample events
            if (events.length > 0) {
                console.log(`   📋 Sample events:`);
                events.slice(0, 3).forEach((e, idx) => {
                    console.log(`      ${idx + 1}. ${e.title?.substring(0, 60)}`);
                });
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');
    console.log(`Total soccer events: ${allSoccerEvents.length}`);
    console.log(`Total soccer markets: ${totalSoccerMarkets}`);

    if (totalSoccerMarkets > 0) {
        console.log('\n🎉 SUCCESS! Polymarket DOES have soccer markets!');
        console.log('   The issue is that we need to query by league-specific tags,');
        console.log('   not a generic "Soccer" tag.');

        console.log('\n📋 Sample Soccer Markets:\n');
        let shown = 0;
        for (const event of allSoccerEvents.slice(0, 5)) {
            if (event.markets && event.markets.length > 0) {
                console.log(`${shown + 1}. Event: ${event.title}`);
                event.markets.slice(0, 2).forEach(m => {
                    console.log(`   - ${m.question || m.title || 'Untitled'}`);
                    console.log(`     Volume: $${(parseFloat(m.volume || 0) / 1000).toFixed(1)}k`);
                });
                console.log('');
                shown++;
                if (shown >= 3) break;
            }
        }
    } else {
        console.log('\n⚠️  No soccer markets found even with league-specific tags');
    }
}

testSoccerLeagues();

#!/usr/bin/env node
/**
 * Test the /sports endpoint to see what tag IDs are available
 */

import axios from 'axios';

const BASE_URL = 'https://gamma-api.polymarket.com';

async function testSportsEndpoint() {
    console.log('🔍 Testing /sports endpoint\n');
    console.log('='.repeat(60));

    try {
        // Get sports metadata
        console.log('\n📡 Fetching from /sports endpoint...\n');
        const response = await axios.get(`${BASE_URL}/sports`, { timeout: 10000 });

        console.log(`✅ Got ${response.data.length} sports\n`);

        // Display all sports with their tags
        console.log('📋 Available Sports:\n');
        response.data.forEach((sport, idx) => {
            console.log(`${idx + 1}. ${sport.sport || sport.name || 'Unknown'}`);
            console.log(`   Tags: ${sport.tags || 'N/A'}`);
            console.log(`   ID: ${sport.id || 'N/A'}`);
            console.log('');
        });

        // Find soccer
        const soccer = response.data.find(s =>
            (s.sport || '').toLowerCase() === 'soccer' ||
            (s.name || '').toLowerCase() === 'soccer'
        );

        if (soccer) {
            console.log('\n⚽ SOCCER FOUND!');
            console.log('='.repeat(60));
            console.log(JSON.stringify(soccer, null, 2));

            // Extract tag IDs
            const tags = soccer.tags ? soccer.tags.split(',') : [];
            console.log(`\n📌 Soccer Tag IDs: ${tags.join(', ')}`);

            // Now try fetching events with soccer tag
            if (tags.length > 0) {
                console.log(`\n📡 Fetching events with tag_id=${tags[0]}...\n`);

                const eventsResponse = await axios.get(`${BASE_URL}/events`, {
                    params: {
                        tag_id: tags[0],
                        closed: false,
                        limit: 100
                    },
                    timeout: 10000
                });

                console.log(`✅ Got ${eventsResponse.data.length} events with soccer tag`);

                if (eventsResponse.data.length > 0) {
                    console.log('\n📋 Sample Soccer Events:\n');
                    eventsResponse.data.slice(0, 5).forEach((event, idx) => {
                        console.log(`${idx + 1}. ${event.title}`);
                        console.log(`   Markets: ${event.markets?.length || 0}`);
                        console.log(`   End Date: ${event.endDate}`);
                        console.log('');
                    });
                }
            }
        } else {
            console.log('\n⚠️  Soccer not found in /sports endpoint');
            console.log('Available sports:', response.data.map(s => s.sport || s.name).join(', '));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testSportsEndpoint();

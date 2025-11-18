/**
 * Analyze what sports markets are actually available on Polymarket
 */

import axios from 'axios';

async function analyzeAvailableSports() {
  console.log('🔍 Analyzing Available Sports Markets on Polymarket\n');
  
  try {
    const response = await axios.get('https://gamma-api.polymarket.com/events', {
      params: { limit: 200, offset: 0, closed: false },
      timeout: 10000
    });
    
    const events = response.data;
    console.log(`✅ Fetched ${events.length} events\n`);
    
    // Collect all markets
    const allMarkets = [];
    events.forEach(event => {
      if (event.markets && Array.isArray(event.markets)) {
        event.markets.forEach(market => {
          allMarkets.push({
            ...market,
            eventTags: event.tags || []
          });
        });
      }
    });
    
    console.log(`📦 Total markets: ${allMarkets.length}\n`);
    
    // Categorize by sport
    const sportCategories = {
      'NFL': [],
      'Soccer': [],
      'NBA': [],
      'MLB': [],
      'NHL': [],
      'Tennis': [],
      'Golf': [],
      'Cricket': [],
      'F1': [],
      'Other Sports': []
    };
    
    allMarkets.forEach(market => {
      const title = (market.title || '').toLowerCase();
      const desc = (market.description || '').toLowerCase();
      const text = `${title} ${desc}`;
      
      let categorized = false;
      
      // Check for each sport
      if (text.includes('nfl') || text.includes('super bowl') || 
          text.includes('chiefs') || text.includes('patriots') || 
          text.includes('cowboys') || text.includes('browns') || 
          text.includes('bengals') || text.includes('cardinals')) {
        sportCategories['NFL'].push(market);
        categorized = true;
      }
      
      if (text.includes('premier league') || text.includes('champions league') || 
          text.includes('liverpool') || text.includes('arsenal') || 
          text.includes('chelsea') || text.includes('manchester') || 
          text.includes('soccer') || text.includes('football club')) {
        sportCategories['Soccer'].push(market);
        categorized = true;
      }
      
      if (text.includes('nba') || text.includes('basketball') || 
          text.includes('lakers') || text.includes('celtics')) {
        sportCategories['NBA'].push(market);
        categorized = true;
      }
      
      if (text.includes('mlb') || text.includes('baseball') || 
          text.includes('yankees') || text.includes('dodgers')) {
        sportCategories['MLB'].push(market);
        categorized = true;
      }
      
      if (text.includes('nhl') || text.includes('hockey')) {
        sportCategories['NHL'].push(market);
        categorized = true;
      }
      
      if (text.includes('tennis') || text.includes('wimbledon') || 
          text.includes('us open')) {
        sportCategories['Tennis'].push(market);
        categorized = true;
      }
      
      if (text.includes('golf') || text.includes('pga') || text.includes('masters')) {
        sportCategories['Golf'].push(market);
        categorized = true;
      }
      
      if (text.includes('cricket')) {
        sportCategories['Cricket'].push(market);
        categorized = true;
      }
      
      if (text.includes('f1') || text.includes('formula 1') || 
          text.includes('formula one') || text.includes('grand prix')) {
        sportCategories['F1'].push(market);
        categorized = true;
      }
      
      // Check for other sports keywords
      if (!categorized && (text.includes('game') || text.includes('match') || 
          text.includes('championship') || text.includes('playoff'))) {
        sportCategories['Other Sports'].push(market);
      }
    });
    
    // Print summary
    console.log('📊 Sports Market Breakdown:\n');
    Object.entries(sportCategories).forEach(([sport, markets]) => {
      if (markets.length > 0) {
        console.log(`${sport}: ${markets.length} markets`);
      }
    });
    
    // Show details for each sport
    console.log('\n\n📋 Detailed Market Analysis:\n');
    
    Object.entries(sportCategories).forEach(([sport, markets]) => {
      if (markets.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${sport} (${markets.length} markets)`);
        console.log('='.repeat(60));
        
        markets.slice(0, 10).forEach((market, idx) => {
          const title = market.title || 'Untitled';
          const volume = market.volume24h || market.volume || 0;
          const endDate = market.endDate || market.expiresAt;
          const daysUntil = endDate ? 
            ((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)).toFixed(1) : 'Unknown';
          
          console.log(`\n${idx + 1}. ${title.substring(0, 70)}`);
          console.log(`   Volume: $${(volume/1000).toFixed(1)}k | Days until: ${daysUntil}`);
          console.log(`   End Date: ${endDate || 'None'}`);
          
          // Check if it's a futures bet
          const isFutures = title.toLowerCase().includes('win') && 
                           (title.toLowerCase().includes('super bowl') || 
                            title.toLowerCase().includes('championship') ||
                            title.toLowerCase().includes('season'));
          console.log(`   Type: ${isFutures ? '🔮 FUTURES' : '🎯 GAME/EVENT'}`);
        });
        
        if (markets.length > 10) {
          console.log(`\n   ... and ${markets.length - 10} more`);
        }
      }
    });
    
    // Summary
    console.log('\n\n🎯 Key Findings:\n');
    const totalSports = Object.values(sportCategories).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Total sports markets: ${totalSports}`);
    console.log(`Percentage of all markets: ${((totalSports / allMarkets.length) * 100).toFixed(1)}%`);
    
    // Check for futures vs games
    const nflMarkets = sportCategories['NFL'];
    if (nflMarkets.length > 0) {
      const futuresCount = nflMarkets.filter(m => {
        const title = (m.title || '').toLowerCase();
        return title.includes('win') && 
               (title.includes('super bowl') || title.includes('championship'));
      }).length;
      console.log(`\nNFL: ${futuresCount} futures, ${nflMarkets.length - futuresCount} games/events`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeAvailableSports();

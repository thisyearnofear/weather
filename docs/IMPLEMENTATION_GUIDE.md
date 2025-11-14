# Implementation Guide: Using the New Weather-Edge Discovery System

## For Frontend Developers

### Basic Market Discovery (AI Page)

```javascript
// Old way (deprecated)
const result = await aiService.fetchMarkets(location, weatherData);

// New way ✓
const response = await fetch('/api/markets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weatherData: {
      current: {
        temp_f: 72,
        condition: { text: 'Rainy' },
        wind_mph: 15,
        humidity: 80,
        precip_chance: 75
      }
    },
    location: 'Denver',           // Optional
    eventType: 'all',             // Optional filter
    confidence: 'all',            // Optional filter
    limitCount: 8
  })
});

const result = await response.json();
if (result.success) {
  const markets = result.markets;  // Already sorted by edge score
  // ...
}
```

### Discovery Page with Filters

```javascript
// GET with query parameters (for bookmark-able/shareable URLs)
const response = await fetch('/api/markets?' + new URLSearchParams({
  location: 'Chicago',
  eventType: 'NFL',
  confidence: 'HIGH',
  minVolume: '50000',
  limit: '20'
}));

const result = await response.json();
```

### Displaying Edge Scores

```javascript
// New fields available on each market
market.edgeScore        // 0-10 (raw score)
market.confidence       // 'HIGH' | 'MEDIUM' | 'LOW'
market.edgeFactors      // { weatherDirect, weatherSensitiveEvent, ... }
market.isWeatherSensitive // boolean
market.weatherContext   // { temp, condition, precipChance, windSpeed, humidity }

// Example: Show edge quality badge
<span className={
  market.confidence === 'HIGH' ? 'bg-green-500' :
  market.confidence === 'MEDIUM' ? 'bg-yellow-500' :
  'bg-red-500'
}>
  {market.confidence} Edge
</span>

// Example: Show edge components
<div>
  <p>Weather Direct: {market.edgeFactors.weatherDirect}/3</p>
  <p>Outdoor Event: {market.edgeFactors.weatherSensitiveEvent}/2</p>
  <p>Current Conditions: {market.edgeFactors.contextualWeatherImpact}/5</p>
  <p>Inefficiency Signal: {market.edgeFactors.asymmetrySignal}/1</p>
</div>
```

## For Backend Developers

### Adding New Weather Sensitivity Factors

Location: `services/polymarketService.js` → `assessMarketWeatherEdge()`

```javascript
// Example: Add humidity factor
if ((humidity && humidity > 80) && (title.includes('humid') || title.includes('moisture'))) {
  contextualWeatherImpact += 1.5;
}

// The scoring is flexible - can add factors for:
// - Sea level pressure changes
// - UV index (golf markets)
// - Visibility (racing markets)
// - Storm warnings (infrastructure markets)
```

### Extending Market Metadata

Location: `services/polymarketService.js` → `extractMarketMetadata()`

Add new event types or team patterns:

```javascript
const advancedPatterns = [
  // Example: Cricket teams
  { pattern: /mumbai indians|rcb|delhi capitals/i, team: 'Cricket Team', sport: 'Cricket' },
  
  // Example: Weather events
  { pattern: /hurricane|tornado|blizzard/i, event: 'Extreme Weather', type: 'MeteorologicalEvent' }
];
```

### Cache Invalidation

```javascript
// Clear market catalog cache (when Polymarket updates frequently)
polymarketService.marketCatalogCache = null;

// Or set shorter TTL for high-volatility periods
polymarketService.MARKET_CATALOG_CACHE_DURATION = 10 * 60 * 1000; // 10 min
```

### Testing the Discovery Engine

```javascript
// Unit test example
const testMarket = {
  title: 'Denver Broncos vs Kansas City Chiefs - will it rain?',
  tags: ['NFL', 'Weather'],
  volume24h: 125000,
  liquidity: 50000
};

const testWeather = {
  current: {
    temp_f: 32,
    condition: { text: 'Snow' },
    wind_mph: 25,
    precip_chance: 95,
    humidity: 88
  }
};

const edge = polymarketService.assessMarketWeatherEdge(testMarket, testWeather);
console.log('Edge Score:', edge.totalScore);  // Should be HIGH
console.log('Confidence:', edge.confidence);  // Should be 'HIGH'
```

## For Data Scientists / Quantitative Analysts

### Understanding Edge Scores

The 4-factor model captures different dimensions of weather sensitivity:

| Factor | Range | When Active | Use Case |
|--------|-------|------------|----------|
| Weather Direct | 0-3 | Market explicitly about weather phenomena | Pure weather markets |
| Outdoor Event | 0-2 | Sports/marathons/outdoor events | Physical activity markets |
| Contextual Impact | 0-5 | Current conditions match event keywords | Real-time weather correlation |
| Asymmetry Signal | 0-1 | High volume/liquidity ratio indicates inefficiency | Potential mispricing |

### Improving the Model

**Current Limitations:**
- Linear scoring (could use weighted factors)
- No temporal component (market time-to-resolution)
- Simple keywords (could use NLP)
- No historical odds tracking

**Suggested Enhancements:**
```javascript
// 1. Time-decay factor (markets resolving soon vs far future)
const daysToResolution = (new Date(market.resolutionDate) - new Date()) / (1000 * 60 * 60 * 24);
const timeDecay = daysToResolution < 7 ? 1.2 : daysToResolution > 60 ? 0.8 : 1.0;

// 2. Volatility signal (recent odds movement)
const oddsVolatility = Math.abs(currentOdds.yes - historicalOdds.yes) > 0.15 ? 0.8 : 1.0;

// 3. Liquidity efficiency (bid-ask spread)
const bidAskSpread = (currentOdds.no - currentOdds.yes);
const spreadSignal = bidAskSpread > 0.1 ? 0.5 : 1.0;

const refinedScore = marketAssessment.totalScore * timeDecay * oddsVolatility * spreadSignal;
```

### Integration with Venice AI

```javascript
// Pseudo-code for Venice API integration
async function analyzeWithAI(market, weatherData, edgeScore) {
  if (edgeScore < 4) return null; // Skip low-confidence edges
  
  const prompt = `
    Market: ${market.title}
    Current Weather: ${JSON.stringify(weatherData.current)}
    Current Odds: YES=${market.currentOdds.yes}, NO=${market.currentOdds.no}
    
    Based on the weather data and market title, what is the true probability this market should be priced at?
    If it differs from current odds by >10%, flag as potential edge.
  `;
  
  const analysis = await veniceAI.analyze(prompt);
  
  return {
    edge: edgeScore,
    estimatedProbability: analysis.probability,
    mispricing: Math.abs(analysis.probability - market.currentOdds.yes),
    confidence: analysis.confidence,
    reasoning: analysis.explanation
  };
}
```

## API Response Examples

### High-Confidence Edge

```json
{
  "marketID": "0x456...",
  "title": "Will precipitation fall on SuperBowl Sunday in Las Vegas?",
  "eventType": "Weather",
  "edgeScore": 8.5,
  "confidence": "HIGH",
  "edgeFactors": {
    "weatherDirect": 3,
    "weatherSensitiveEvent": 0,
    "contextualWeatherImpact": 4.5,
    "asymmetrySignal": 1
  },
  "currentOdds": { "yes": 0.35, "no": 0.65 },
  "volume24h": 450000,
  "liquidity": 200000,
  "weatherContext": {
    "temp": 65,
    "condition": "Mostly Sunny",
    "precipChance": 5,
    "windSpeed": 8,
    "humidity": 40,
    "hasData": true
  }
}
```

### Medium-Confidence Sports Edge

```json
{
  "marketID": "0x789...",
  "title": "Denver Broncos Win vs Chiefs",
  "location": "Denver",
  "eventType": "NFL",
  "edgeScore": 4.2,
  "confidence": "MEDIUM",
  "edgeFactors": {
    "weatherDirect": 0,
    "weatherSensitiveEvent": 2,
    "contextualWeatherImpact": 1.5,
    "asymmetrySignal": 0.7
  },
  "currentOdds": { "yes": 0.48, "no": 0.52 },
  "volume24h": 850000,
  "liquidity": 400000,
  "weatherContext": {
    "temp": 28,
    "condition": "Light Snow",
    "precipChance": 40,
    "windSpeed": 12,
    "humidity": 75,
    "hasData": true
  }
}
```

## Debugging

### Check if Market Catalog is Building Correctly

```javascript
const catalog = await polymarketService.buildMarketCatalog(50000);
console.log('Markets found:', catalog.totalMarkets);
console.log('Cached:', catalog.cached);
console.log('First market:', catalog.markets[0]);
```

### Verify Edge Scoring

```javascript
const market = catalog.markets[0];
const weather = { current: { temp_f: 72, precip_chance: 85, ... } };

const edge = polymarketService.assessMarketWeatherEdge(market, weather);
console.log('Score breakdown:', edge.factors);
console.log('Total:', edge.totalScore);
console.log('Confidence:', edge.confidence);
```

### Monitor API Performance

```javascript
// Add timing to POST handler
const start = Date.now();
const result = await polymarketService.getTopWeatherSensitiveMarkets(limit, filters);
const duration = Date.now() - start;

console.log(`Market discovery took ${duration}ms`);
console.log(`Cache hit: ${result.cached}`);
console.log(`Markets returned: ${result.markets.length}`);
```

## Migration Checklist

- [ ] Removed all `aiService.fetchMarkets()` calls
- [ ] Replaced with direct `/api/markets` POST calls
- [ ] Updated UI to display `edgeScore`, `confidence`, `edgeFactors`
- [ ] Tested with various weather conditions
- [ ] Verified filters (eventType, confidence, location) work
- [ ] Performance acceptable (<1s for cold start, <500ms cached)
- [ ] Error handling for failed Polymarket API calls
- [ ] Cache invalidation strategy documented
- [ ] Team trained on new API signature

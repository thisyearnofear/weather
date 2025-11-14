# System Architecture: Weather-Edge Market Discovery

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                             │
│                                                                       │
│  /app/ai/page.js ──────────────────────── /app/discovery/page.js   │
│  (Weather + Edge Analysis)                (Edge Discovery)           │
│          │                                        │                  │
│          └────────────────┬─────────────────────┘                   │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                      [Optional: Weather Data]
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API LAYER (EDGE-RANKED)                         │
│                                                                       │
│  POST /api/markets                                                   │
│  {                                                                    │
│    location?: string (optional personalization)                     │
│    weatherData?: { current: { temp_f, condition, wind_mph, ... } } │
│    eventType?: 'all' | 'NFL' | 'NBA' | ...                        │
│    confidence?: 'all' | 'HIGH' | 'MEDIUM' | 'LOW'                  │
│    limitCount?: number                                               │
│  }                                                                    │
│                           │                                          │
│                           ▼                                          │
│  getTopWeatherSensitiveMarkets(limit, filters)                      │
│  (Main Discovery Engine)                                             │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  MARKET DISCOVERY ENGINE                             │
│                                                                       │
│  1. buildMarketCatalog() ◄─── [Cached 30 min]                      │
│     └─ Fetch all $50k+ volume markets                              │
│     └─ Extract: location, teams, eventType, odds, volume, liquidity │
│                                                                       │
│  2. Score Each Market: assessMarketWeatherEdge()                    │
│     ├─ Factor 1: weatherDirect (0-3)                                │
│     │   "weather", "temperature", "rain", "snow", "wind"           │
│     │                                                                │
│     ├─ Factor 2: weatherSensitiveEvent (0-2)                       │
│     │   NFL, NBA, MLB, Golf, Tennis, Marathon, Race               │
│     │                                                                │
│     ├─ Factor 3: contextualWeatherImpact (0-5)                     │
│     │   Actual weather conditions match market keywords             │
│     │   Wind > 15 mph + "wind" keyword: +1.5                       │
│     │   Precip > 30% + "rain" keyword: +1.5                        │
│     │   Temp < 45°F or > 85°F + "heat/cold": +1                   │
│     │   Humidity > 70% + "humidity" keyword: +0.5                  │
│     │                                                                │
│     └─ Factor 4: asymmetrySignal (0-1)                              │
│         Volume / Liquidity Ratio > 2: +1                            │
│         (High activity = inefficiency signal)                       │
│                                                                       │
│  3. Filter Markets                                                   │
│     ├─ By eventType (if specified)                                  │
│     ├─ By confidence level (HIGH/MEDIUM/LOW)                        │
│     └─ By location (if specified, for personalization)              │
│                                                                       │
│  4. Sort & Return                                                    │
│     Sort by: edgeScore DESC, then volume DESC                       │
│     Return: Top N markets with edge metadata                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DATA SOURCE: POLYMARKET GAMMA API                       │
│                                                                       │
│  GET https://gamma-api.polymarket.com/markets                       │
│  (All active markets with liquidity data)                           │
│                                                                       │
│  GET https://gamma-api.polymarket.com/markets/{id}                  │
│  (Detailed market data for analysis)                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Service Architecture

```
services/polymarketService.js
├── Cache Management
│   ├── marketCatalogCache (30 min TTL)
│   ├── marketDetailsCache (10 min TTL)
│   └── locationBasedCache (5 min TTL) [deprecated]
│
├── Phase 1: Market Indexing
│   └── buildMarketCatalog(minVolume)
│       ├── Fetch all active markets
│       ├── Filter by volume threshold
│       ├── Extract metadata (location, teams, eventType)
│       └── Cache for 30 minutes
│
├── Phase 2: Edge Scoring
│   └── assessMarketWeatherEdge(market, weatherData)
│       ├── Calculate weatherDirect score (0-3)
│       ├── Calculate weatherSensitiveEvent score (0-2)
│       ├── Calculate contextualWeatherImpact score (0-5)
│       ├── Calculate asymmetrySignal score (0-1)
│       └── Return { totalScore, factors, confidence, weatherContext }
│
├── Phase 3: Market Discovery (Core Algorithm)
│   └── getTopWeatherSensitiveMarkets(limit, filters)
│       ├── Get catalog (from cache or rebuild)
│       ├── Score all markets
│       ├── Apply filters (eventType, confidence, location)
│       ├── Sort by edgeScore DESC, volume DESC
│       └── Return top N
│
├── Analysis & Trading (Unchanged)
│   ├── getMarketDetails(marketID)
│   ├── getWeatherAdjustedOpportunities() [legacy]
│   ├── buildOrderObject()
│   ├── validateOrder()
│   └── calculateOrderCost()
│
└── Metadata Extraction (Unchanged)
    ├── extractLocation(title)
    ├── extractMarketMetadata(title)
    └── assessWeatherRelevance() [legacy, deprecated]
```

## Request/Response Cycle

### Example: AI Page Market Discovery

**Request:**
```javascript
POST /api/markets
{
  weatherData: {
    current: {
      temp_f: 72,
      condition: { text: "Rainy" },
      precip_chance: 85,
      wind_mph: 18,
      humidity: 75
    }
  },
  location: "Denver",        // Optional
  eventType: "NFL",          // Optional
  confidence: "HIGH",        // Optional
  limitCount: 8
}
```

**Processing:**
1. `getTopWeatherSensitiveMarkets()` called with filters
2. `buildMarketCatalog(50000)` executes (checks cache first)
3. Returns ~500-1000 markets with $50k+ volume
4. Score each with `assessMarketWeatherEdge()`
   - Example: NFL game in Denver, rainy forecast
   - weatherDirect: 0 (not directly about weather)
   - weatherSensitiveEvent: 2 (NFL game)
   - contextualWeatherImpact: 1.5 (rain condition + precip > 30%)
   - asymmetrySignal: 0 (normal liquidity)
   - **Total: 3.5 → Confidence: MEDIUM**
5. Filter by eventType=NFL: Narrows to ~80 NFL markets
6. Filter by confidence=HIGH: Further narrows
7. Sort by edgeScore DESC (3.5 comes before 3.0, etc.)
8. Return top 8 markets

**Response:**
```javascript
{
  success: true,
  markets: [
    {
      marketID: "0x123...",
      title: "Will Denver Broncos beat Kansas City Chiefs?",
      location: "Denver",
      eventType: "NFL",
      edgeScore: 3.5,
      confidence: "MEDIUM",
      edgeFactors: {
        weatherDirect: 0,
        weatherSensitiveEvent: 2,
        contextualWeatherImpact: 1.5,
        asymmetrySignal: 0
      },
      currentOdds: { yes: 0.45, no: 0.55 },
      volume24h: 125000,
      liquidity: 50000,
      weatherContext: {
        temp: 72,
        condition: "Rainy",
        precipChance: 85,
        windSpeed: 18,
        humidity: 75,
        hasData: true
      },
      isWeatherSensitive: true
    },
    // ... 7 more markets
  ],
  totalFound: 45,
  cached: true,
  timestamp: "2025-11-14T..."
}
```

## Edge Score Calculation Example

**Market:** "Will it rain on Super Bowl Sunday in Las Vegas?"

```
weatherDirect = 3 ("rain" keyword, explicit weather)
weatherSensitiveEvent = 0 (indoor event, Vegas)
contextualWeatherImpact = 0 (indoor, weather data irrelevant)
asymmetrySignal = 0 (high liquidity, efficient)
─────────────────────────────
Total Score = 3
Confidence = MEDIUM
```

**Market:** "Denver Broncos vs Kansas City Chiefs, AFC West Playoff"

```
weatherDirect = 0 (not about weather directly)
weatherSensitiveEvent = 2 (NFL game, outdoor)
contextualWeatherImpact:
  - Wind 18 mph, keyword "wind" in...? No: 0
  - Precip 85%, raining heavily, outdoor game: +1.5
  - Temp 72°F (normal), no "cold" keyword: 0
  - Humidity 75%: not mentioned: 0
  = 1.5
asymmetrySignal = 0 (high volume, $250k liquidity)
─────────────────────────────
Total Score = 3.5
Confidence = MEDIUM
```

**Market:** "Will Jacksonville Jaguars score in 1st quarter vs Texans?"

```
weatherDirect = 0
weatherSensitiveEvent = 2 (NFL)
contextualWeatherImpact = 0 (Jacksonville April weather normal)
asymmetrySignal = 1 (High volume $80k, low liquidity $30k, ratio = 2.67)
─────────────────────────────
Total Score = 3
Confidence = MEDIUM
```

## Caching Strategy

| Layer | Duration | Key | Size | Usage |
|-------|----------|-----|------|-------|
| Market Catalog | 30 min | `null` | ~500-1000 markets | Used by every discovery request |
| Market Details | 10 min | `marketID` | 1 per market | Deep analysis, pre-cached for top 5 |
| Location-Based | 5 min | `location` | 20 per city | Deprecated, will remove |

## Error Handling Flow

```
POST /api/markets
     │
     ▼
Get Top Weather-Sensitive Markets
     │
     ├─ Catalog fetch fails?
     │  └─ Retry with fallback
     │     └─ Return any $10k+ markets
     │
     ├─ No weather-sensitive markets found?
     │  └─ Fallback to high-volume markets
     │     └─ Edge scores: 0, confidence: LOW
     │
     ├─ Scoring complete, filters applied?
     │  └─ Success: Return ranked markets
     │
     └─ API error (500)?
        └─ Return error, keep results cached
```

## Performance Metrics

- **Catalog Build:** ~2-5 seconds (first call), <500ms (cached)
- **Scoring:** ~50ms for 500 markets (in-memory)
- **Filtering:** <10ms (single pass)
- **Total Request:** ~3 seconds (cold), ~800ms (warm cache)

## Future Enhancements (Roadmap)

### Phase 4: AI Edge Analysis
- Venice API integration for odds efficiency assessment
- Historical odds tracking
- Real-time market movement correlation with weather

### Phase 5: Portfolio Optimization
- Multi-market correlated positions
- Risk-adjusted edge ranking
- Capital allocation suggestions

### Phase 6: Automated Trading
- Threshold-based order placement
- Risk management automation
- Performance tracking & improvement

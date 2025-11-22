# Architecture Guide - Fourcast System Design

## System Overview

Fourcast is a Next.js-based weather edge analysis platform that combines real-time weather data with prediction market analysis to identify profitable betting opportunities.

## Architecture Principles

### 1. **Separation of Concerns**
- Frontend: React/Next.js with Tailwind CSS
- Backend: Next.js API routes
- Services: Dedicated business logic modules
- Data: Weather APIs, Market APIs, AI services

### 2. **Performance-First Design**
- Server-side rendering for fast initial loads
- API response caching with Redis
- Optimistic UI updates
- Debounced API calls

### 3. **Scalability**
- Stateless API design
- Horizontal scaling capability
- Database connection pooling
- CDN for static assets

### 4. **Reliability**
- Comprehensive error handling
- Fallback mechanisms
- Circuit breaker patterns
- Health check endpoints

## Core Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   API Routes    │    │   Services      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ AI Analysis │ │◄──►│ │ /api/       │ │◄──►│ │ Weather     │ │
│ │ Page        │ │    │ │ analyze     │ │    │ │ Service     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Market      │ │    │ │ /api/       │ │    │ │ Market      │ │
│ │ Browser     │ │    │ │ markets     │ │    │ │ Service     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                      ┌─────────────────┐
                      │ External APIs   │
                      │                 │
                      │ ┌─────────────┐ │
                      │ │ WeatherAPI  │ │
                      │ │ Venice AI   │ │
                      │ │ Polymarket  │ │
                      │ └─────────────┘ │
                      └─────────────────┘
```

## Frontend Architecture

### Component Structure

```
app/
├── ai/                    # Main AI analysis page
│   ├── page.js           # Enhanced page with validation
│   └── components/       # AI-specific components
│       ├── ValidationAwareMarketSelector.js
│       ├── EnhancedAnalysisDisplay.js
│       ├── EnhancedOrderForm.js
│       ├── ValidationStatusBar.js
│       └── usePerformantValidation.js
├── api/                  # API routes
└── components/          # Shared components
```

### State Management

**Client-Side State:**
```javascript
// React useState hooks for component state
const [weatherData, setWeatherData] = useState(null);
const [selectedMarket, setSelectedMarket] = useState(null);
const [analysis, setAnalysis] = useState(null);

// Validation state with performance hooks
const locationValidation = useLocationValidation(eventType, location);
const weatherValidation = useWeatherValidation(weatherData);
```

**Server-Side State:**
- Redis caching for API responses
- Session-based user data
- Static generation where applicable

### Performance Optimizations

1. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting
   - Lazy loading of non-critical features

2. **Caching Strategy**
   ```javascript
   // Service worker caching
   // Redis server-side caching
   // Next.js built-in caching
   ```

3. **Optimistic Updates**
   - Immediate UI feedback
   - Rollback on errors
   - Progressive enhancement

## Backend Architecture

### API Design

**RESTful Endpoints:**
```
GET  /api/weather          # Weather data
GET  /api/markets          # Market listings
POST /api/analyze          # AI analysis
POST /api/orders           # Trading orders
GET  /api/predictions      # User predictions
POST /api/signals          # Publish signal
GET  /api/signals          # List latest signals
```

**Validation Endpoints:**
```
POST /api/validate/location       # Location validation
POST /api/validate/weather        # Weather data validation
POST /api/validate/order          # Order validation
POST /api/validate/market-compatibility # Market compatibility
```

### Service Layer

**Service Abstraction:**
```javascript
// Weather Service
export class WeatherService {
  static async getCurrentWeather(location) {
    // Redis cache check
    // API call if cache miss
    // Response transformation
    // Error handling
  }
}

// Market Service
export class MarketService {
  static async getWeatherSensitiveMarkets(location, filters) {
    // Market discovery
    // Weather correlation
    // Performance ranking
  }
}
```

## Data Architecture

### Data Flow

```
Weather API → WeatherService → Redis Cache → Frontend
                      ↓
Polymarket API → MarketService → AI Analysis → Frontend
                      ↓
Venice AI → AnalysisService → Cache → Frontend
```

### Data Models

**Weather Data:**
```javascript
{
  location: {
    name: "New York, NY",
    coordinates: { lat: 40.7, lon: -74.0 }
  },
  current: {
    temp_f: 72,
    condition: "Sunny",
    wind_mph: 8,
    humidity: 65
  },
  forecast: { /* 3-7 day forecast */ }
}
```

**Market Data:**
```javascript
{
  marketID: "token123",
  title: "Will it rain tomorrow?",
  currentOdds: { yes: 0.3, no: 0.7 },
  volume24h: 10000,
  liquidity: "HIGH",
  weatherRelevance: {
    impact: "HIGH",
    factors: ["precipitation", "wind"]
  }
}
```

**Analysis Result:**
```javascript
{
  assessment: {
    weather_impact: "HIGH",
    odds_efficiency: "UNDERPRICED",
    confidence: "MEDIUM"
  },
  analysis: "Detailed AI analysis...",
  key_factors: ["Factor 1", "Factor 2"],
  recommended_action: "BET YES - Weather edge identified"
}
```

**Signal Object (Off-chain demo model):**
```javascript
{
  id: "eventId-timestamp",
  event_id: "market.tokenID",
  market_title: "Title",
  venue: "City, Region",
  event_time: 1732300000,
  market_snapshot_hash: "sha256(...)",
  weather_json: { /* compact weather metrics */ },
  ai_digest: "Concise reasoning",
  confidence: "HIGH|MEDIUM|LOW",
  odds_efficiency: "INEFFICIENT|EFFICIENT",
  author_address: "0x...",
  tx_hash: null,
  timestamp: 1732300100
}
```

## Integration Patterns

### External API Integration

**Retry Pattern:**
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
};
```

**Circuit Breaker:**
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

### Error Handling

**Structured Error Responses:**
```javascript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid location provided",
    details: {
      field: "location",
      value: "invalid_location",
      expected: "Valid city name or coordinates"
    }
  },
  timestamp: "2024-11-18T06:16:08.063Z"
}
```

## Security Architecture

### Input Validation

**Multi-Layer Validation:**
1. Client-side validation (immediate feedback)
2. API route validation (security)
3. Service-level validation (business rules)

**Validation Framework:**
```javascript
// Location Validator
export class LocationValidator {
  static validateLocation(eventType, location, context) {
    return {
      valid: true/false,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }
}
```

### Authentication & Authorization

**Current Implementation:**
- Wallet-based authentication (ConnectKit)
- API key management for external services
- Environment variable protection

**Future Enhancements:**
- JWT token-based auth
- Role-based access control
- API rate limiting per user

## Deployment Architecture

### Environment Strategy

```
Development → Staging → Production
     ↓           ↓          ↓
Local DB     Test DB     Production DB
Local Redis  Test Redis  Production Redis
Mock APIs    Sandbox APIs Live APIs
```

### Infrastructure Requirements

**Minimum Viable Setup:**
- Next.js hosting (Vercel/Netlify)
- Redis instance (Upstash/Redis Cloud)
- Database (PostgreSQL/MongoDB)

**Production Setup:**
- Load balancer for scaling
- CDN for static assets
- Monitoring and alerting
- Backup and disaster recovery

## Monitoring & Observability

### Health Checks

**System Health Endpoint:**
```javascript
// /api/predictions/health
{
  status: "healthy",
  services: {
    weather: "operational",
    market: "operational", 
    ai: "operational",
    database: "operational"
  },
  timestamp: "2024-11-18T06:16:08.063Z"
}
```

### Performance Metrics

**Key Metrics:**
- API response times
- Error rates by endpoint
- Cache hit ratios
- User engagement metrics

**Logging Strategy:**
- Structured JSON logging
- Contextual error information
- Performance tracking
- Security event logging

## Scaling Considerations

### Horizontal Scaling

**Stateless API Design:**
- All API routes are stateless
- Session data in Redis/database
- Independent service instances

**Database Scaling:**
- Read replicas for heavy queries
- Connection pooling
- Query optimization

### Vertical Scaling

**Resource Optimization:**
- Efficient algorithms
- Memory management
- CPU utilization optimization

## Development Best Practices

### Code Organization

**Service Layer Pattern:**
```javascript
// services/weatherService.js
export class WeatherService {
  static async getCurrentWeather(location) {
    // Implementation
  }
}

// In API routes
import { WeatherService } from '@/services/weatherService';
```

**Component Composition:**
```javascript
// Reusable validation components
<ValidationDisplay validation={validation} />
<RiskIndicator riskLevel={risk} />
<ValidationStatusBar {...validationStates} />
```

### Testing Strategy

**Unit Tests:** Individual functions and components
**Integration Tests:** API endpoint and service integration
**E2E Tests:** Complete user workflows

## Future Architecture Enhancements

### Microservices Migration
- Weather service separation
- Market analysis service
- AI processing service
- User management service

### Event-Driven Architecture
- Real-time market updates
- Weather alert system
- User notification system

### Advanced Caching
- Multi-layer caching strategy
- Predictive caching
- Cache warming

## Validation Framework

### Core Principles
- **User-Centric Validation**: Actionable feedback with real-time guidance
- **Performance-First Design**: Smart caching and debounced validation
- **Extensible Architecture**: Modular validators and reusable components

### Validation Hierarchy
```
┌─────────────────────────────────────┐
│       Validation Orchestrator       │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  │
│  │  Location   │  │   Weather   │  │
│  │ Validator   │  │  Validator  │  │
│  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  │
│  │   Market    │  │   Trading   │  │
│  │ Validator   │  │  Validator  │  │
│  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────┘
```

### Performance Optimizations
- **Smart Caching**: 5-minute cache for location, 3-minute for weather, 30-second for orders
- **Debounced Validation**: 200ms for orders, 300ms for analysis, 500ms for location
- **Request Cancellation**: Automatic cleanup of outdated validation requests

## Venue Extraction System

### Purpose
Extract event venue locations from sports markets to enable `/ai` page event-weather analysis.

### Venue Extraction Methods
1. **Team-to-City Mapping**: ~65% success rate for major sports teams
2. **Title Pattern Matching**: ~40% success for "@ City" or "in City" patterns
3. **Stadium Name Mapping**: Dedicated stadium-to-city mapping for common venues
4. **Description Parsing**: ~10% success rate for venue info in descriptions

### Current Status
- **✅ SUCCESS:** 22% - Clear venue extraction (e.g., "Kansas City, MO")
- **⚠️ PARTIAL:** 53.5% - Extracted but uncertain (e.g., "At Arrowhead", "Tampa, FL")
- **❌ FAILED:** 24.2% - No venue found (non-location-specific markets)

### Integration with Market Analysis
```javascript
// In polymarketService.js - Event Weather Mode
if (analysisType === 'event-weather') {
  const eventLocation = VenueExtractor.extractFromMarket(market);
  const eventWeather = await weatherService.getCurrentWeather(eventLocation);
  edgeScore = assessMarketWeatherEdge(market, eventWeather);
  return { eventLocation, eventWeather, edgeScore };
}
```

### Stadium Mapping Coverage
- **NFL Stadiums**: Arrowhead, Lambeau Field, Sofi, Nissan, AT&T, etc.
- **NBA/NHL Stadiums**: Chase Center, Staples Center, Madison Square Garden, etc.
- **International**: Anfield, Emirates Stadium, Old Trafford, etc.

## Integration Architecture

### /ai vs /discovery Differentiation
The `/ai` and `/discovery` pages use different analysis modes:

**/ai Page (Event Weather Analysis):**
- `analysisType: 'event-weather'`
- Extracts event venues from markets
- Fetches weather at **event locations**
- Scores by weather impact at venue
- Focuses on sports events only

**/discovery Page (Global Market Discovery):**
- `analysisType: 'discovery'`
- No venue extraction needed
- Scores by market efficiency (volume, liquidity, volatility)
- Browses all market categories globally

### Data Flow Comparison

**Event Weather Analysis Flow:**
```
Markets → Extract Event Venue → Get Venue Weather → Score by Weather + Odds
(Always shows event-relevant results)
```

**Global Discovery Flow:**
```
All Markets → Score by Volume/Liquidity/Volatility → Rank & Return
(Always shows high-volume results, location-agnostic)
```

### Venue Extraction Improvements Needed
- Expand team-to-city mapping (international leagues)
- Stadium name normalization
- Confidence scoring for extracted venues
- Pre-extraction during catalog build

### Venue Extraction Improvements Needed
- Expand team-to-city mapping (international leagues)
- Stadium name normalization
- Confidence scoring for extracted venues
- Pre-extraction during catalog build

## Production Integration Status

### /ai Page Integration (Event Weather Analysis) ✅
- **Frontend:** Removed geolocation, passes `analysisType: 'event-weather'`
- **Backend:** Venue extraction, event weather fetching, weather-based scoring
- **Venue Extraction:** NFL + EPL teams mapped, 80+ stadiums covered
- **Success Rate:** 22% clear extraction, 53.5% partial, 24.2% failed

### /discovery Page Integration (Global Discovery) ✅
- **Frontend:** Positioned as market browser, passes `analysisType: 'discovery'`
- **Backend:** Market efficiency scoring, no venue extraction needed
- **Performance:** Fast loading, no weather API dependency
- **Coverage:** All market categories, location-agnostic

### Key Files Integration Status
```
✅ app/ai/page.js - Event weather mode
✅ app/discovery/page.js - Discovery mode
✅ app/api/markets/route.js - analysisType parameter
✅ services/polymarketService.js - Mode differentiation
✅ services/venueExtractor.js - Venue extraction service
```

### Production Readiness ✅
- Build tests passing
- Venue extraction tested on 99 real markets
- API endpoints functional
- Error handling implemented
- Documentation updated

---

## Signals Registry Architecture

**Purpose**
- Publish compact, composable “Signal” records combining event odds, venue weather, and AI inference.

**API**
- `POST /api/signals` – publish a signal from analysis context
- `GET /api/signals?limit=20` – list latest signals for demo and UI

**Storage (Demo)**
- SQLite table `signals` with indices on `event_id` and `timestamp`

**Data Contracts**
- See “Signal Object” in Data Architecture for field definitions

**Pipeline**
- Discovery/Sports → Analyze → Publish Signal → List Signals → Compose downstream tools

---

## Aptos Integration Architecture

### Overview

User wallet-based Aptos integration for publishing weather × odds × AI signals on-chain. Prioritizes security, simplicity, and user ownership for first Aptos deployment.

### Architecture Pattern: User Wallet Connection

**Decision Rationale:**
- ✅ **Security**: No private keys in backend
- ✅ **Accountability**: Signals tied to user addresses (reputation building)
- ✅ **Simplicity**: Wallet handles all cryptographic operations
- ✅ **Cost Distribution**: Users pay gas fees (~$0.0001 per signal)
- ✅ **Decentralization**: True ownership of published signals
- ✅ **Risk Mitigation**: Minimize backend complexity for first deployment

### Component Architecture

```
Frontend (Next.js)
├── AptosProvider (wallet context)
├── AptosConnectButton (UI component)
├── useAptosSignalPublisher (React hook)
└── Markets page (integration point)

Services
├── aptosPublisher.js (transaction preparation)
└── db.js (SQLite persistence)

Blockchain (Aptos Devnet)
├── signal_registry.move (Move module)
├── User accounts (signal storage)
└── Events (indexing layer)
```

### Progressive Enhancement Pattern

**Flow:**
1. Signal saves to SQLite → Immediate success ✅
2. Aptos publish (async) → On-chain proof 🔗
3. If Aptos fails → Signal still exists, can retry 🔄
4. Update SQLite with tx_hash → Link local + blockchain 🎯

**Benefits:**
- Fast user feedback (SQLite)
- Graceful degradation (works offline)
- Retry mechanism (recover from failures)
- Best UX (fast + reliable)

### Move Module Design

**Signal Storage Model:**
```move
struct Signal has store, drop, copy {
    event_id: String,
    market_title: String,
    venue: String,
    event_time: u64,
    market_snapshot_hash: String,
    weather_json: String,
    ai_digest: String,
    confidence: String,
    odds_efficiency: String,
    author_address: address,
    timestamp: u64,
}

struct SignalRegistry has key {
    signals: Table<String, Signal>,
    signal_count: u64,
}
```

**Event Emissions:**
```move
#[event]
struct SignalPublished has drop, store {
    signal_id: String,
    event_id: String,
    author: address,
    timestamp: u64,
    confidence: String,
    odds_efficiency: String,
}
```

### Frontend Integration

**Wallet Provider:**
```javascript
<AptosWalletAdapterProvider
  plugins={[PetraWallet, MartianWallet, PontemWallet]}
  autoConnect={true}
>
  {children}
</AptosWalletAdapterProvider>
```

**Publishing Hook:**
```javascript
const { publishToAptos, isPublishing, connected } = useAptosSignalPublisher();

// Prepare transaction
const payload = aptosPublisher.preparePublishSignalPayload(signalData);

// User wallet signs
const response = await signAndSubmitTransaction({ data: payload });

// Wait for confirmation
const result = await aptosPublisher.waitForTransaction(response.hash);
```

### Security Model

**What's Secure:**
- ✅ No private keys in backend
- ✅ User signs all transactions
- ✅ Signals tied to verified addresses
- ✅ Immutable on-chain record
- ✅ Event emissions for transparency

**What to Monitor:**
- ⚠️ Wallet connection errors
- ⚠️ Transaction failures (gas, network)
- ⚠️ SQLite/Aptos sync issues
- ⚠️ Malformed signal data

### Cost Analysis

**Devnet** (Current):
- Gas fees: **FREE** (faucet)
- Storage: **FREE** (test environment)
- Transactions: **UNLIMITED**

**Mainnet** (Future):
- Gas per signal: **~$0.0001**
- Storage: **~$0.001** per signal
- Monthly (100 signals): **~$0.01**

### User Experience Flow

**First-Time User:**
1. Visit Markets page
2. Click "Connect Aptos Wallet"
3. Install Petra wallet
4. Create wallet → Switch to Devnet
5. Fund with faucet
6. Analyze market → Publish signal
7. Approve transaction in Petra
8. See success with tx_hash

**Returning User:**
1. Markets page (auto-connect)
2. Analyze market
3. Click "Publish Signal"
4. Approve in Petra
5. Done!

### Migration Path

**Devnet → Mainnet:**
1. Test thoroughly (2-4 weeks)
2. Audit Move module
3. Update env vars to mainnet
4. Redeploy module
5. Communicate to users
6. Monitor closely

**Checklist:**
- [ ] 100+ signals on devnet
- [ ] Zero critical bugs
- [ ] User feedback incorporated
- [ ] Gas costs acceptable
- [ ] Documentation complete

*Architecture Guide - Last updated: November 2024*


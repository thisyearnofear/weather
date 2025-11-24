# API Reference & Product Roadmap

## Overview

The Fourcast API provides comprehensive access to weather edge analysis, market data, and AI-powered insights for prediction markets. This document covers all available endpoints, their usage, and the product roadmap.

## Base URL

```
Production: https://your-domain.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for read operations. Trading operations require wallet connection through ConnectKit.

**Future:** JWT token authentication for enhanced security and rate limiting.

## Core Endpoints

### Weather Data

#### Get Current Weather
```http
GET /api/weather
```

**Query Parameters:**
- `location` (optional): City name or coordinates
- `units` (optional): 'metric' or 'imperial' (default: 'imperial')

### Market Data

#### Get Weather-Sensitive Markets
```http
POST /api/markets
```

**Request Body:**
```json
{
  "weatherData": { /* weather object */ },
  "location": "New York, NY",
  "eventType": "all",
  "confidence": "MEDIUM",
  "limitCount": 12,
  "analysisType": "discovery", // or "event-weather"
  "platform": "all" // or "polymarket", "kalshi"
}
```

#### Get Market Details
```http
GET /api/markets/{marketID}
```

### AI Analysis

#### Analyze Market
```http
POST /api/analyze
```

**Request Body:**
```json
{
  "eventType": "Weather Prediction",
  "location": "New York, NY",
  "currentOdds": {
    "yes": 0.25,
    "no": 0.75
  },
  "participants": "New York City residents",
  "weatherData": { /* weather object */ },
  "marketID": "token_123",
  "eventDate": "2024-11-19T12:00:00Z",
  "mode": "basic",
  "analysisType": "event-weather" // or "discovery"
}
```

### Signal Publishing

#### Publish Signal to SQLite (Immediate)
```http
POST /api/signals
```

**Request Body:**
```json
{
  "event_id": "market.tokenID",
  "market_title": "Will it rain in NYC tomorrow?",
  "venue": "New York, NY",
  "event_time": 1732300000,
  "market_snapshot_hash": "sha256(...)",
  "weather_json": { /* compact weather metrics */ },
  "ai_digest": "Concise reasoning",
  "confidence": "HIGH",
  "odds_efficiency": "INEFFICIENT",
  "author_address": "0x..."
}
```

#### Update Signal with Aptos Transaction Hash
```http
PATCH /api/signals
```

**Request Body:**
```json
{
  "signalId": "signal_123",
  "txHash": "0x123456789..."
}
```

#### List Latest Signals
```http
GET /api/signals
```

**Query Parameters:**
- `limit` (optional): Number of signals to return (default: 20)

### Reputation System

#### Get Leaderboard
```http
GET /api/leaderboard
```

#### Get User Profile
```http
GET /api/profile/{address}
```

### Trading Operations

#### Place Order
```http
POST /api/orders
```

**Request Body:**
```json
{
  "marketID": "token_123",
  "side": "YES",
  "price": 0.25,
  "quantity": 100,
  "walletAddress": "0x...",
  "chainId": 56
}
```

### Validation Endpoints

#### Location Validation
```http
POST /api/validate/location
```

**Request Body:**
```json
{
  "eventType": "NFL",
  "location": "New York, NY",
  "additionalContext": {
    "title": "Team A vs Team B"
  }
}
```

#### Weather Validation
```http
POST /api/validate/weather
```

#### Order Validation
```http
POST /api/validate/order
```

#### Market Compatibility
```http
POST /api/validate/market-compatibility
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid location provided",
    "details": {
      "field": "location",
      "value": "invalid_location",
      "expected": "Valid city name or coordinates"
    }
  },
  "timestamp": "2024-11-18T06:17:51.772Z"
}
```

### Common Error Codes

| Code                     | HTTP Status | Description                     |
| ------------------------ | ----------- | ------------------------------- |
| `VALIDATION_ERROR`       | 400         | Invalid input parameters        |
| `WEATHER_API_ERROR`      | 502         | External weather API failure    |
| `AI_SERVICE_ERROR`       | 503         | AI analysis service unavailable |
| `MARKET_API_ERROR`       | 502         | External market API failure     |
| `INSUFFICIENT_LIQUIDITY` | 400         | Order exceeds market liquidity  |
| `RATE_LIMIT_EXCEEDED`    | 429         | Too many requests               |

## Rate Limiting

### Current Limits

- **General API**: 100 requests per minute per IP
- **Analysis API**: 10 requests per minute per IP
- **Trading API**: 5 requests per minute per wallet

## Product Roadmap

### Phase 1: Core Platform (Completed ✅)

**Q4 2024:**
- ✅ Weather data integration
- ✅ Market discovery and analysis
- ✅ Basic AI-powered insights
- ✅ User-friendly interface
- ✅ Trading integration
- ✅ Polymarket aggregation
- ✅ Venue extraction for sports events

### Phase 2: Enhanced Analytics & Platform Integration (In Progress 🚧)

**Q1 2025:**
- 🚧 Kalshi integration with platform badges and filters
- 🚧 Advanced risk assessment tools
- 🚧 Historical performance tracking
- 🚧 Portfolio management features
- 🚧 Enhanced mobile experience
- 🚧 Multi-language support
- 🚧 Cross-platform arbitrage detection

### Phase 3: Professional Tools (Planned 📋)

**Q2 2025:**
- 📋 Professional trading interface
- 📋 Advanced order types (limit, stop-loss, conditional)
- 📋 API rate limit increases for professional users
- 📋 White-label solutions
- 📋 Institutional features
- 📋 In-app trading execution

### Phase 4: Ecosystem Expansion (Future 🔮)

**Q3-Q4 2025:**
- 🔮 Cross-chain support (Ethereum, Solana, Polygon)
- 🔮 Derivative markets (options, futures)
- 🔮 Social trading features
- 🔮 Prediction market creation tools
- 🔮 Integration with DeFi protocols
- 🔮 Universal trading across multiple chains

### Phase 5: AI & Automation (Future 🤖)

**2026:**
- 🤖 Advanced AI models for market prediction
- 🤖 Automated trading strategies
- 🤖 Natural language market analysis
- 🤖 Personalized recommendations
- 🤖 Sentiment analysis integration

## API Versioning

### Current Version: v1

### Version Strategy

- **Minor Updates**: Backward compatible additions
- **Major Updates**: Breaking changes with deprecation period
- **Deprecation Notice**: 90-day notice before breaking changes

## Monitoring & Analytics

### Health Check

```http
GET /api/predictions/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "weather": {
      "status": "operational",
      "response_time_ms": 150
    },
    "market": {
      "status": "operational",
      "response_time_ms": 200
    },
    "ai": {
      "status": "operational",
      "response_time_ms": 2500
    },
    "database": {
      "status": "operational",
      "response_time_ms": 50
    }
  },
  "timestamp": "2024-11-18T06:17:51.772Z"
}
```

## Support & Community

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **Discord Community**: Real-time support and discussion
- **Email Support**: support@fourcast.com
- **Status Page**: status.fourcast.com

---

_API Reference & Product Roadmap - Last updated: November 2024_
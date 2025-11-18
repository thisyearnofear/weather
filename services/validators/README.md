# Unified Validation Framework

## 🎯 Overview

This validation framework extends the LocationValidator pattern to create a comprehensive, scalable validation system for all aspects of the prediction market platform.

## 🏗️ Architecture

```
services/validators/
├── index.js                    # Main entry point & orchestrator
├── locationValidator.js        # Location validation (existing)
├── tradingValidator.js         # Trading & order validation
├── marketDataValidator.js      # Market data integrity validation
├── weatherDataValidator.js     # Weather data quality validation
├── apiInputValidator.js        # API input & parameter validation
├── futuresBetValidator.js      # Market type & futures classification
└── README.md                   # This documentation
```

## 🚀 Usage Examples

### Basic Validation

```javascript
import { ValidationOrchestrator } from './services/validators/index.js';

// Validate a trading order
const result = ValidationOrchestrator.validate('trading', {
  price: 0.65,
  size: 100,
  side: 'buy',
  marketID: 'market123',
  walletAddress: '0x1234...'
}, {
  operation: 'order',
  walletStatus: { balance: { formatted: '1000' } }
});

if (!result.valid) {
  console.log('Order validation failed:', result.errors);
}
```

### Multiple Validations

```javascript
// Validate multiple aspects at once
const validations = [
  { type: 'location', input: { eventType: 'NFL Game', location: 'Dallas, TX' } },
  { type: 'weather-data', input: { current: { temp_f: 75, humidity: 60 } } },
  { type: 'api-input', input: { marketId: 'abc123', location: 'Dallas' } }
];

const result = ValidationOrchestrator.validateMultiple(validations);
console.log('All validations passed:', result.valid);
```

### Service Integration

```javascript
// In tradingService.js
import { TradingValidator } from './validators/tradingValidator.js';

export const tradingService = {
  async submitOrder(order, walletStatus) {
    // Replace existing validateOrder with comprehensive validation
    const validation = TradingValidator.validateTradingOperation('order', order, {
      walletStatus,
      marketData: await getMarketData(order.marketID)
    });
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }
    
    // ... proceed with order submission
  }
};
```

## 📋 Validator Capabilities

### 🏃‍♂️ TradingValidator
- **Order Validation**: Price, size, market constraints
- **Wallet Validation**: Address format, balance, approval
- **Market Access**: Geographic restrictions, age verification  
- **Risk Assessment**: Position sizing, price impact estimation

### 📊 MarketDataValidator  
- **Market Structure**: Required fields, date consistency
- **Pricing Integrity**: Odds validation, bid/ask spreads
- **Metadata Quality**: Location data, team information
- **Order Book**: Structure, ordering, depth analysis
- **Volume Validation**: Trend analysis, data freshness

### 🌤️ WeatherDataValidator
- **Current Weather**: Temperature, humidity, wind validation
- **Forecast Data**: Multi-day consistency, timeline validation
- **Data Quality**: Completeness scoring, freshness checks
- **Location Consistency**: Coordinate validation, geographic logic

### 🔌 APIInputValidator
- **Endpoint-Specific**: Custom validation per API route
- **Parameter Types**: Numeric ranges, string formats
- **Request Structure**: Required fields, data types
- **Security**: Input sanitization, size limits

### 📈 FuturesBetValidator
- **Market Classification**: Futures vs single-event detection
- **Temporal Consistency**: Timeline vs content analysis
- **Risk Profiling**: Liquidity, volatility, uncertainty factors
- **Weather Compatibility**: Event type vs weather relevance

## 🔧 Integration Guide

### 1. Replace Existing Validations

```javascript
// BEFORE: Scattered validation in services
if (!price || price < 0 || price > 1) {
  return { error: 'Invalid price' };
}

// AFTER: Comprehensive validation
const validation = TradingValidator.validateTradingOperation('order', orderData, context);
```

### 2. API Route Enhancement

```javascript
// In app/api/orders/route.js
import { APIInputValidator } from '../../../services/validators/apiInputValidator.js';

export async function POST(request) {
  const input = await request.json();
  
  const validation = APIInputValidator.validateAPIInput('orders', input);
  if (!validation.valid) {
    return Response.json({ 
      success: false, 
      errors: validation.errors,
      warnings: validation.warnings 
    }, { status: 400 });
  }
  
  // ... proceed with validated input
}
```

### 3. Service Enhancement

```javascript
// In services/polymarketService.js
import { MarketDataValidator } from './validators/marketDataValidator.js';

async getMarketDetails(marketID) {
  const marketData = await this.fetchMarketData(marketID);
  
  // Validate data quality before returning
  const validation = MarketDataValidator.validateMarketData('market', marketData);
  
  return {
    ...marketData,
    validation: {
      valid: validation.valid,
      warnings: validation.warnings,
      dataQuality: validation.dataQuality
    }
  };
}
```

## 🎯 Core Principles Applied

### ✅ ENHANCEMENT FIRST
- Built upon successful LocationValidator pattern
- Extends existing logic rather than replacing it
- Maintains backward compatibility

### ✅ AGGRESSIVE CONSOLIDATION  
- Eliminates duplicated validation logic across services
- Single source of truth per validation domain
- Removes inconsistent validation approaches

### ✅ DRY (Don't Repeat Yourself)
- Shared validation logic across all consumers
- Reusable validation functions and patterns
- Common error response formats

### ✅ CLEAN (Clear Separation)
- Each validator handles one domain
- Clear interfaces between validators
- Explicit dependencies and contexts

### ✅ MODULAR (Composable Design)
- Mix and match validators as needed
- Independent validator modules
- Orchestrator for complex validations

### ✅ PERFORMANT (Optimized)
- Early validation returns on critical errors
- Efficient validation algorithms
- Minimal overhead on request processing

## 📈 Benefits

1. **Consistency**: All validation follows same patterns and returns same formats
2. **Maintainability**: Single place to update validation logic per domain  
3. **Extensibility**: Easy to add new validators or enhance existing ones
4. **Debugging**: Clear error messages with validation category and context
5. **Testing**: Each validator can be thoroughly unit tested
6. **Documentation**: Self-documenting validation rules and requirements

## 🔮 Future Extensions

- **Real-time Validation**: WebSocket-based live validation
- **Machine Learning**: Anomaly detection for market data
- **Compliance**: Regulatory requirement validation
- **Performance**: Async validation for heavy operations
- **Analytics**: Validation failure pattern analysis
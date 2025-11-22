# Setup Guide - Fourcast Weather Edge Analysis

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fourcast

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

### Environment Configuration

Required environment variables:

```env
# Weather API
WEATHER_API_KEY=your_weather_api_key

# Venice AI (for market analysis)
VENICE_API_KEY=your_venice_api_key

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Database (optional)
DATABASE_URL=your_database_url
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
fourcast/
├── app/                 # Next.js app directory
│   ├── ai/             # AI analysis page
│   ├── api/            # API routes
│   └── components/     # Shared components
├── services/           # Business logic services
│   ├── weatherService.js
│   ├── polymarketService.js
│   └── aiService.js
├── components/         # Reusable components
└── docs/              # Documentation
```

## Core Services

### Weather Service
- Fetches current weather data
- Provides location-based weather context
- Caches weather data for performance

### Market Service (Polymarket)
- Retrieves prediction markets
- Analyzes weather-sensitive markets
- Provides market data for AI analysis

### AI Service
- Analyzes weather impact on markets
- Provides actionable betting insights
- Integrates with Venice AI API

## Configuration

### API Keys Setup

1. **Weather API**: Get your API key from WeatherAPI.com
2. **Venice AI**: Obtain API key from Venice AI platform
3. **Redis**: Set up Redis instance for caching

### Feature Flags

```javascript
// Enable/disable features in next.config.js
module.exports = {
  experimental: {
    enhancedValidation: true,
    realTimeAnalysis: true
  }
}
```

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables for Production

Ensure all required environment variables are set in your deployment platform:
- WEATHER_API_KEY
- VENICE_API_KEY  
- REDIS_URL (if using Redis)
- Any other service-specific keys

## Troubleshooting

### Common Issues

1. **Weather API Errors**
   - Check API key validity
   - Verify rate limits
   - Ensure proper error handling

2. **AI Analysis Failures**
   - Verify Venice API key
   - Check API quotas
   - Review error logs

3. **Performance Issues**
   - Enable Redis caching
   - Monitor API response times
   - Optimize database queries

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Development Workflow

1. **Branch Strategy**: Feature branches from main
2. **Code Review**: Required for all changes
3. **Testing**: Must pass all tests before merge
4. **Documentation**: Update docs with changes

## Performance Optimization

### Caching Strategy
- Redis for API response caching
- Static generation for non-dynamic pages
- CDN for static assets

### API Rate Limiting
- Implement proper rate limiting
- Use exponential backoff for retries
- Monitor API usage and costs

### Database Optimization
- Index frequently queried fields
- Use connection pooling
- Implement proper pagination

## Security

### API Security
- Validate all input parameters
- Implement proper authentication
- Use HTTPS for all communications

### Environment Security
- Never commit API keys
- Use environment variables
- Implement proper access controls

## Monitoring

### Health Checks
- `/api/predictions/health` - System health endpoint
- Monitor API response times
- Track error rates

### Logging
- Structured logging with context
- Error tracking and alerting
- Performance monitoring

## Support

For setup issues:
1. Check the troubleshooting section
2. Review error logs
3. Contact development team
4. Check documentation for updates

---

*Last updated: November 2024*
---

## Aptos Blockchain Integration

### Prerequisites

1. **Install Aptos CLI**
   ```bash
   brew install aptos
   ```

2. **Create Aptos Account**
   ```bash
   aptos init --network devnet
   ```

### Deploy Move Module

```bash
cd move
aptos move compile --named-addresses fourcast_addr=default
aptos move publish --named-addresses fourcast_addr=default
```

Save your module address from the output!

### Configure Frontend

Add to `.env.local`:
```bash
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
NEXT_PUBLIC_APTOS_MODULE_ADDRESS=0xYOUR_ADDRESS_HERE
```

### Install Petra Wallet

1. Install extension: https://petra.app
2. Create wallet
3. Switch to Devnet network
4. Fund with faucet: `aptos account fund-with-faucet --account YOUR_ADDRESS`

### Test

1. Start dev server: `npm run dev -- --turbopack`
2. Visit `/markets`
3. Connect Aptos wallet
4. Publish a signal
5. Verify on Aptos Explorer

### Resources

- Aptos Docs: https://aptos.dev
- Petra Wallet: https://petra.app
- Aptos Explorer: https://explorer.aptoslabs.com


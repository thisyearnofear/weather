/**
 * AI Service - Handles market data fetching and weather analysis
 * Single source of truth for AI-related API calls
 */

import OpenAI from 'openai';

// Simple Redis client for caching
const redis = {
  async get() { return null; },
  async setex() { return null; },
  async exists() { return false; }
};

const getRedisClient = async () => redis;

const callVeniceAI = async (params) => {
  const { eventType, location, weatherData, currentOdds, participants } = params;

  // Configure Venice AI client
  const client = new OpenAI({
    apiKey: process.env.VENICE_API_KEY,
    baseURL: 'https://api.venice.ai/api/v1'
  });

    const messages = [
    {
      role: 'system',
      content: 'You are a concise prediction market analyst. Analyze weather impacts on odds. Be direct and actionable - no unnecessary detail.'
    },
    {
      role: 'user',
      content: `Quick weather edge analysis:

**Event:** ${eventType}
**Weather:** ${weatherData?.current?.temp_f || 'unknown'}°F, ${weatherData?.current?.condition?.text || 'unknown'}, ${weatherData?.current?.precip_chance || '0'}% rain, ${weatherData?.current?.wind_mph || '0'}mph wind
**Current Odds:** ${currentOdds}

Return JSON:
{
  "weather_impact": "HIGH/MEDIUM/LOW",
  "odds_efficiency": "INEFFICIENT/EFFICIENT",
  "confidence": "HIGH/MEDIUM/LOW",
  "analysis": "1-2 sentences explaining key weather impact",
  "key_factors": ["2-3 most important weather factors"],
  "recommended_action": "Brief action: Buy/Sell/Hold specs"
}`
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model: 'qwen3-235b',
      messages,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      assessment: {
        weather_impact: parsed.weather_impact || 'MEDIUM',
        odds_efficiency: parsed.odds_efficiency || 'UNKNOWN',
        confidence: parsed.confidence || 'LOW'
      },
      analysis: parsed.analysis || 'Analysis completed via Venice AI',
      key_factors: Array.isArray(parsed.key_factors) ? parsed.key_factors : [parsed.key_factors || 'Weather factors analyzed'],
      recommended_action: parsed.recommended_action || 'Monitor the market closely'
    };

  } catch (error) {
    console.error('Venice AI error:', error);
    throw new Error(`Venice AI analysis failed: ${error.message}`);
  }
};

export const aiService = {
  /**
   * Analyze weather impact on prediction market odds
   * ENHANCED: Redis caching with roadmap-aligned keys
   */
   async analyzeWeatherImpact(params) {
    const { eventType, location, weatherData, currentOdds, participants, marketId, eventDate } = params;

    try {
      // Log the API key availability (debug)
      const apiKey = process.env.VENICE_API_KEY;
      console.log('Venice API Key available:', !!apiKey, 'length:', apiKey?.length);

      // Check Redis cache first (roadmap: analysis:{marketID})
      const redis = await getRedisClient();
      const cacheKey = `analysis:${marketId}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        return {
          ...parsed,
          cached: true,
          source: 'redis'
        };
      }

      // Call Venice AI API if key is available
      if (!apiKey) {
        return {
          assessment: { weather_impact: 'UNKNOWN', odds_efficiency: 'UNKNOWN', confidence: 'LOW' },
          analysis: 'AI service unavailable - no API key configured',
          key_factors: ['API service not configured'],
          recommended_action: 'Configure VENICE_API_KEY in environment',
          cached: false,
          source: 'unavailable'
        };
      }

      const analysis = await callVeniceAI({ eventType, location, weatherData, currentOdds, participants });

      // Cache result with roadmap-aligned TTL (6 hours for distant events, 1 hour for near events)
      const ttl = eventDate && new Date(eventDate) - new Date() < 24 * 60 * 60 * 1000 ? 3600 : 21600; // 1h or 6h
      await redis.setex(cacheKey, ttl, JSON.stringify(analysis));

      return {
        ...analysis,
        cached: false,
        source: 'venice_ai'
      };

    } catch (error) {
      console.error('AI Analysis failed:', error);

      // Fallback to simple heuristic analysis
      return {
        assessment: {
          weather_impact: 'MEDIUM',
          odds_efficiency: 'UNKNOWN',
          confidence: 'LOW'
        },
        analysis: `Error in AI analysis: ${error.message}. Fallback assessment provided.`,
        key_factors: ['Analysis service error'],
        recommended_action: 'Proceed with manual evaluation',
        cached: false,
        source: 'fallback'
      };
    }
  },

  /**
   * Fetch weather-sensitive markets for a given location
   */
  async fetchMarkets(location, weatherData) {
    try {
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, weatherData })
      });

      const data = await response.json();
      if (data.success && data.markets) {
        // Transform markets to match MarketSelector format
        const markets = data.markets.map(market => ({
           marketID: market.marketID,
           title: market.title,
           description: market.description,
           volume24h: market.volume24h || 0,
           currentOdds: {
             yes: market.currentOdds?.yes || 0.5,
             no: market.currentOdds?.no || 0.5
           },
           liquidity: market.liquidity || 0,
           tags: market.tags || [],
           resolution: market.endDate
         }));
        return { success: true, markets };
      }
      return { success: false, error: data.error || 'No markets available' };
    } catch (err) {
      console.error('Market fetch failed:', err);
      return { success: false, error: 'Failed to fetch market data' };
    }
  },

  /**
   * Analyze a market based on weather data
   */
  async analyzeMarket(market, weatherData) {
    try {
      const eventData = {
        eventType: market.title || 'Prediction Market',
        location: weatherData?.location?.name || 'Unknown Location',
        currentOdds: `Yes: ${(market.currentOdds?.yes * 100 || 0).toFixed(1)}% / No: ${(market.currentOdds?.no * 100 || 0).toFixed(1)}%`,
        participants: market.description || 'Market participants'
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          weatherData,
          marketID: market.marketID
        })
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, analysis: data.analysis };
      }
      return { success: false, error: data.error || 'Analysis failed' };
    } catch (err) {
      console.error('Analysis request failed:', err);
      return { success: false, error: 'Failed to connect to analysis service' };
    }
  },

  /**
   * Get AI service status (for GET /api/analyze)
   */
  getStatus() {
    return {
      available: true,
      model: 'qwen3-235b',
      cacheSize: 0,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      cache: {
        memory: { size: 0, duration: '10 minutes' },
        redis: { connected: false, ttl: '6 hours' }
      }
    };
  }
};

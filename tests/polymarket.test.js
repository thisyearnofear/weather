import { describe, it, expect } from 'vitest';
import { polymarketService } from '../services/polymarketService';

describe('Polymarket Service', () => {
  it('should have edge assessment method', () => {
    expect(polymarketService.assessMarketWeatherEdge).toBeDefined();
  });

  it('should calculate weather edge scores correctly', () => {
    const testMarket = {
      title: 'Will it rain at the Chicago Cubs game on Sunday?',
      description: 'Market resolves YES if precipitation occurs',
      tags: ['Sports', 'Weather'],
      volume24h: 125000,
      liquidity: 50000
    };

    const testWeather = {
      current: {
        temp_f: 45,
        condition: { text: 'Rainy' },
        wind_mph: 12,
        precip_chance: 85,
        humidity: 88
      }
    };

    const edge = polymarketService.assessMarketWeatherEdge(testMarket, testWeather);
    
    expect(edge).toBeDefined();
    expect(edge.totalScore).toBeGreaterThan(0);
    expect(edge.confidence).toBeDefined();
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(edge.confidence);
    expect(edge.factors).toBeDefined();
    expect(edge.factors.weatherDirect).toBeDefined();
  });

  it('should score weather-direct markets highly', () => {
    const weatherMarket = {
      title: 'Will it rain in Miami on November 20?',
      description: 'Resolves YES if >0.1 inches of rain',
      tags: ['Weather'],
      volume24h: 80000,
      liquidity: 30000
    };

    const weather = {
      current: {
        temp_f: 78,
        condition: { text: 'Heavy Rain' },
        wind_mph: 15,
        precip_chance: 95,
        humidity: 92
      }
    };

    const edge = polymarketService.assessMarketWeatherEdge(weatherMarket, weather);
    
    // Weather-direct markets should score high
    expect(edge.factors.weatherDirect).toBeGreaterThanOrEqual(2);
    expect(edge.totalScore).toBeGreaterThan(3);
  });

  it('should score non-weather markets low', () => {
    const cryptoMarket = {
      title: 'Will Bitcoin hit $100k in 2025?',
      description: 'Price target market',
      tags: ['Crypto'],
      volume24h: 500000,
      liquidity: 200000
    };

    const weather = {
      current: {
        temp_f: 72,
        condition: { text: 'Clear' },
        wind_mph: 5,
        precip_chance: 0,
        humidity: 50
      }
    };

    const edge = polymarketService.assessMarketWeatherEdge(cryptoMarket, weather);
    
    // Non-weather markets should score very low
    expect(edge.totalScore).toBeLessThan(2);
    expect(edge.confidence).toBe('LOW');
  });

  it('should detect weather-sensitive sports correctly', () => {
    const nflMarket = {
      title: 'Denver Broncos to beat Kansas City Chiefs in snow',
      description: 'NFL game winner',
      tags: ['NFL', 'Sports'],
      volume24h: 250000,
      liquidity: 80000
    };

    const coldWeather = {
      current: {
        temp_f: 28,
        condition: { text: 'Light Snow' },
        wind_mph: 18,
        precip_chance: 40,
        humidity: 75
      }
    };

    const edge = polymarketService.assessMarketWeatherEdge(nflMarket, coldWeather);
    
    // NFL should be weather-sensitive event type
    expect(edge.factors.weatherSensitiveEvent).toBeGreaterThan(0);
    // Snow keyword in title + snow conditions should add contextual impact
    expect(edge.totalScore).toBeGreaterThan(1);
    expect(edge.confidence).toBeDefined();
  });

  it('should handle markets without weather data', () => {
    const market = {
      title: 'Will Lakers win tonight?',
      tags: ['NBA'],
      volume24h: 100000,
      liquidity: 40000
    };

    const edge = polymarketService.assessMarketWeatherEdge(market, null);
    
    expect(edge).toBeDefined();
    expect(edge.totalScore).toBeDefined();
    // Without weather data, should still calculate basic score
    expect(edge.weatherContext.hasData).toBe(false);
  });
});

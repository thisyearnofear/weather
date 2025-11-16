import { describe, it, expect } from 'vitest'
import { polymarketService } from '../services/polymarketService'

describe('polymarketService.assessMarketWeatherEdge', () => {
  it('scores weather-direct markets higher', () => {
    const market = { title: 'Rain forecast impacts NFL game', description: '', tags: ['NFL'], volume24h: 100000 }
    const weather = { current: { precip_prob: 60, wind_mph: 10, temp_f: 50, humidity: 80 } }
    const res = polymarketService.assessMarketWeatherEdge(market, weather)
    expect(res.totalScore).toBeGreaterThan(0)
    expect(res.factors.weatherSensitiveEvent).toBeGreaterThan(0)
  })
})
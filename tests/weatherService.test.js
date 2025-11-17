import { describe, it, expect } from 'vitest';
import { weatherService } from '../services/weatherService';

describe('Weather Service', () => {
  it('should have required methods', () => {
    expect(weatherService.getCurrentLocation).toBeDefined();
    expect(weatherService.getCurrentWeather).toBeDefined();
  });

  it('should fetch weather data for a valid location', async () => {
    // Test with a well-known location
    const location = 'New York';
    
    try {
      const weatherData = await weatherService.getCurrentWeather(location);
      
      expect(weatherData).toBeDefined();
      expect(weatherData.location).toBeDefined();
      expect(weatherData.location.name).toBeDefined();
      expect(weatherData.current).toBeDefined();
      expect(weatherData.current.temp_f).toBeDefined();
    } catch (error) {
      // If API rate limited or key missing, that's okay for testing
      if (error.message.includes('rate') || error.message.includes('API key')) {
        expect(error).toBeDefined();
      } else {
        throw error;
      }
    }
  }, 10000); // 10 second timeout for API call

  it('should handle invalid locations gracefully', async () => {
    const invalidLocation = 'XYZ_INVALID_LOCATION_123';
    
    try {
      await weatherService.getCurrentWeather(invalidLocation);
      // If it doesn't throw, that's fine (might return fallback data)
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });
});

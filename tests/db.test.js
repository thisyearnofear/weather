import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  savePrediction, 
  getUserPredictions, 
  getMarketPredictions,
  getUserStats,
  getLeaderboard,
  closeDatabase 
} from '../services/db';

describe('Database Service', () => {
  const testAddress = '0x1234567890123456789012345678901234567890';
  const testMarketId = 'market_test_123';

  beforeAll(() => {
    // Database is auto-initialized on import
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should save a prediction', () => {
    const prediction = {
      id: `test_pred_${Date.now()}_1`,
      userAddress: testAddress,
      marketId: testMarketId,
      marketTitle: 'Test Market: Will it rain?',
      side: 'YES',
      stakeWei: '1000000000000000000', // 1 ETH in wei
      oddsBps: 5500, // 55%
      chainId: 56,
      txHash: `0x${Date.now()}abc`,
      metadataUri: 'ipfs://test',
      timestamp: Math.floor(Date.now() / 1000)
    };

    const result = savePrediction(prediction);
    expect(result.success).toBe(true);
  });

  it('should retrieve user predictions', () => {
    const result = getUserPredictions(testAddress, 10);
    expect(result.success).toBe(true);
    expect(result.predictions).toBeDefined();
    expect(result.predictions.length).toBeGreaterThan(0);
  });

  it('should retrieve market predictions', () => {
    const result = getMarketPredictions(testMarketId);
    expect(result.success).toBe(true);
    expect(result.predictions).toBeDefined();
  });

  it('should get user stats', () => {
    const result = getUserStats(testAddress);
    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats.total_predictions).toBeGreaterThan(0);
  });

  it('should handle case-insensitive addresses', () => {
    const upperCase = testAddress.toUpperCase();
    const lowerCase = testAddress.toLowerCase();
    
    const result1 = getUserPredictions(upperCase, 10);
    const result2 = getUserPredictions(lowerCase, 10);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.predictions.length).toBe(result2.predictions.length);
  });

  it('should get leaderboard', () => {
    const result = getLeaderboard(10);
    expect(result.success).toBe(true);
    expect(result.leaderboard).toBeDefined();
    expect(Array.isArray(result.leaderboard)).toBe(true);
  });

  it('should save multiple predictions and update stats', () => {
    const prediction2 = {
      id: `test_pred_${Date.now()}_2`,
      userAddress: testAddress,
      marketId: 'market_test_456',
      marketTitle: 'Test Market 2: Will it snow?',
      side: 'NO',
      stakeWei: '2000000000000000000', // 2 ETH
      oddsBps: 3000, // 30%
      chainId: 56,
      txHash: `0x${Date.now()}def`,
      metadataUri: null,
      timestamp: Math.floor(Date.now() / 1000)
    };

    const result = savePrediction(prediction2);
    expect(result.success).toBe(true);

    const stats = getUserStats(testAddress);
    expect(stats.success).toBe(true);
    expect(stats.stats.total_predictions).toBeGreaterThanOrEqual(1);
  });
});

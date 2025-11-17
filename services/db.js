// Database service for prediction history and analytics
// Uses SQLite for simplicity - no external dependencies needed

import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/fourcast.db' 
  : path.join(process.cwd(), 'fourcast.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    user_address TEXT NOT NULL,
    market_id TEXT NOT NULL,
    market_title TEXT,
    side TEXT NOT NULL,
    stake_wei TEXT NOT NULL,
    odds_bps INTEGER NOT NULL,
    chain_id INTEGER NOT NULL,
    tx_hash TEXT,
    metadata_uri TEXT,
    timestamp INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_user_address ON predictions(user_address);
  CREATE INDEX IF NOT EXISTS idx_market_id ON predictions(market_id);
  CREATE INDEX IF NOT EXISTS idx_chain_id ON predictions(chain_id);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON predictions(timestamp DESC);

  CREATE TABLE IF NOT EXISTS market_outcomes (
    market_id TEXT PRIMARY KEY,
    resolved BOOLEAN DEFAULT 0,
    outcome TEXT,
    resolution_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    user_address TEXT PRIMARY KEY,
    total_predictions INTEGER DEFAULT 0,
    total_stake_wei TEXT DEFAULT '0',
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

// Prepared statements for performance
const statements = {
  insertPrediction: db.prepare(`
    INSERT INTO predictions (
      id, user_address, market_id, market_title, side, 
      stake_wei, odds_bps, chain_id, tx_hash, metadata_uri, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getPredictionsByUser: db.prepare(`
    SELECT * FROM predictions 
    WHERE user_address = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `),

  getPredictionsByMarket: db.prepare(`
    SELECT * FROM predictions 
    WHERE market_id = ? 
    ORDER BY timestamp DESC
  `),

  getUserStats: db.prepare(`
    SELECT * FROM user_stats 
    WHERE user_address = ?
  `),

  updateUserStats: db.prepare(`
    INSERT INTO user_stats (user_address, total_predictions, total_stake_wei)
    VALUES (?, 1, ?)
    ON CONFLICT(user_address) DO UPDATE SET
      total_predictions = total_predictions + 1,
      total_stake_wei = CAST(total_stake_wei AS INTEGER) + CAST(excluded.total_stake_wei AS INTEGER),
      updated_at = strftime('%s', 'now')
  `),

  setMarketOutcome: db.prepare(`
    INSERT INTO market_outcomes (market_id, resolved, outcome, resolution_time)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(market_id) DO UPDATE SET
      resolved = 1,
      outcome = excluded.outcome,
      resolution_time = excluded.resolution_time
  `),

  getRecentPredictions: db.prepare(`
    SELECT p.*, m.resolved, m.outcome
    FROM predictions p
    LEFT JOIN market_outcomes m ON p.market_id = m.market_id
    ORDER BY p.timestamp DESC
    LIMIT ?
  `),
};

/**
 * Save a prediction to the database
 */
export function savePrediction(prediction) {
  try {
    statements.insertPrediction.run(
      prediction.id,
      prediction.userAddress.toLowerCase(),
      prediction.marketId,
      prediction.marketTitle || null,
      prediction.side,
      prediction.stakeWei.toString(),
      prediction.oddsBps,
      prediction.chainId,
      prediction.txHash || null,
      prediction.metadataUri || null,
      prediction.timestamp
    );

    // Update user stats
    statements.updateUserStats.run(
      prediction.userAddress.toLowerCase(),
      prediction.stakeWei.toString()
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to save prediction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get predictions for a specific user
 */
export function getUserPredictions(userAddress, limit = 50) {
  try {
    const predictions = statements.getPredictionsByUser.all(
      userAddress.toLowerCase(),
      limit
    );
    return { success: true, predictions };
  } catch (error) {
    console.error('Failed to get user predictions:', error);
    return { success: false, error: error.message, predictions: [] };
  }
}

/**
 * Get predictions for a specific market
 */
export function getMarketPredictions(marketId) {
  try {
    const predictions = statements.getPredictionsByMarket.all(marketId);
    return { success: true, predictions };
  } catch (error) {
    console.error('Failed to get market predictions:', error);
    return { success: false, error: error.message, predictions: [] };
  }
}

/**
 * Get user statistics
 */
export function getUserStats(userAddress) {
  try {
    const stats = statements.getUserStats.get(userAddress.toLowerCase());
    return { 
      success: true, 
      stats: stats || {
        user_address: userAddress.toLowerCase(),
        total_predictions: 0,
        total_stake_wei: '0',
        win_count: 0,
        loss_count: 0
      }
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record market outcome
 */
export function setMarketOutcome(marketId, outcome) {
  try {
    statements.setMarketOutcome.run(
      marketId,
      outcome,
      Math.floor(Date.now() / 1000)
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to set market outcome:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent predictions with outcomes
 */
export function getRecentPredictions(limit = 20) {
  try {
    const predictions = statements.getRecentPredictions.all(limit);
    return { success: true, predictions };
  } catch (error) {
    console.error('Failed to get recent predictions:', error);
    return { success: false, error: error.message, predictions: [] };
  }
}

/**
 * Get leaderboard data
 */
export function getLeaderboard(limit = 10) {
  try {
    const leaderboard = db.prepare(`
      SELECT 
        user_address,
        total_predictions,
        total_stake_wei,
        win_count,
        loss_count,
        CASE 
          WHEN (win_count + loss_count) > 0 
          THEN CAST(win_count AS REAL) / (win_count + loss_count) 
          ELSE 0 
        END as win_rate
      FROM user_stats
      WHERE total_predictions >= 3
      ORDER BY win_rate DESC, total_predictions DESC
      LIMIT ?
    `).all(limit);

    return { success: true, leaderboard };
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return { success: false, error: error.message, leaderboard: [] };
  }
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase() {
  db.close();
}

// Export database instance for advanced queries if needed
export { db };

/**
 * Market Type Detector - Scalable approach for identifying futures bets
 *
 * Strategy:
 * 1. Use resolution date (>30 days = likely futures)
 * 2. Generic pattern matching (not sport-specific)
 * 3. Polymarket tags/metadata
 * 4. Odds analysis (very low odds often = futures)
 */

export class MarketTypeDetector {
  /**
   * Detect if a market is a futures bet (season-long, championship, etc.)
   * Returns: { isFutures: boolean, confidence: 'HIGH'|'MEDIUM'|'LOW', reason: string }
   */
  static detectMarketType(market) {
    const signals = [];
    let isFutures = false;
    let confidence = "LOW";

    // SIGNAL 1: Time-based (most reliable)
    const timeSignal = this.analyzeResolutionDate(market);
    if (timeSignal.score > 0) {
      signals.push(timeSignal);
      if (timeSignal.score >= 3) isFutures = true;
    }

    // SIGNAL 2: Generic language patterns
    const languageSignal = this.analyzeLanguagePatterns(market);
    if (languageSignal.score > 0) {
      signals.push(languageSignal);
      if (languageSignal.score >= 2) isFutures = true;
    }

    // SIGNAL 3: Odds analysis
    const oddsSignal = this.analyzeOdds(market);
    if (oddsSignal.score > 0) {
      signals.push(oddsSignal);
    }

    // SIGNAL 4: Polymarket metadata
    const metadataSignal = this.analyzeMetadata(market);
    if (metadataSignal.score > 0) {
      signals.push(metadataSignal);
      if (metadataSignal.score >= 3) isFutures = true;
    }

    // Calculate confidence
    const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
    if (totalScore >= 5) confidence = "HIGH";
    else if (totalScore >= 3) confidence = "MEDIUM";
    else confidence = "LOW";

    // Determine if futures
    if (totalScore >= 3) isFutures = true;

    return {
      isFutures,
      confidence,
      signals,
      totalScore,
      reason: this.generateReason(signals, isFutures),
    };
  }

  /**
   * SIGNAL 1: Analyze resolution date
   * Score: 0-5 (5 = definitely futures)
   * UPDATED: More lenient - only flag markets >60 days out as futures based on time alone
   */
  static analyzeResolutionDate(market) {
    const resolutionDate =
      market.resolutionDate || market.expiresAt || market.endDate;

    if (!resolutionDate) {
      return {
        signal: "resolution_date",
        score: 0,
        detail: "No resolution date",
      };
    }

    const daysUntilResolution =
      (new Date(resolutionDate) - new Date()) / (1000 * 60 * 60 * 24);

    if (daysUntilResolution >= 120) {
      return {
        signal: "resolution_date",
        score: 5,
        detail: `${Math.round(
          daysUntilResolution
        )} days away - definitely futures`,
      };
    } else if (daysUntilResolution > 60) {
      return {
        signal: "resolution_date",
        score: 3,
        detail: `${Math.round(daysUntilResolution)} days away - likely futures`,
      };
    } else if (daysUntilResolution > 30) {
      return {
        signal: "resolution_date",
        score: 1,
        detail: `${Math.round(
          daysUntilResolution
        )} days away - possibly futures`,
      };
    } else {
      return {
        signal: "resolution_date",
        score: 0,
        detail: `${Math.round(daysUntilResolution)} days away - single event`,
      };
    }
  }

  /**
   * SIGNAL 2: Generic language patterns (sport-agnostic)
   * Score: 0-3 (3 = strong futures signal)
   */
  static analyzeLanguagePatterns(market) {
    const title = (market.title || market.question || "").toLowerCase();
    const description = (market.description || "").toLowerCase();
    const combined = `${title} ${description}`;

    let score = 0;
    const patterns = [];

    // Generic futures patterns (not sport-specific)
    // UPDATED: More specific patterns to avoid false positives on single games
    const futuresPatterns = [
      {
        pattern:
          /will.*win(?:\s+(?:the|a))?\s+(championship|super bowl|world series|stanley cup|nba finals)/i,
        points: 3,
        name: "championship_language",
      },
      {
        pattern: /season winner|season champion|division winner/i,
        points: 3,
        name: "season_winner",
      },
      {
        pattern: /\b(202[5-9]|203[0-9])\b.*(season|championship)/i,
        points: 3,
        name: "future_season",
      },
      {
        pattern: /make (the )?playoffs/i,
        points: 3,
        name: "playoff_qualification",
      },
      {
        pattern:
          /finish (first|top|1st) in (the )?(division|conference|league)/i,
        points: 3,
        name: "season_standings",
      },
      {
        pattern: /by (end of|conclusion of) (season|year)/i,
        points: 2,
        name: "season_end",
      },
      {
        pattern:
          /\b(over|under) \d+(\.\d+)? (wins|points|goals|games) (this|next|the) season/i,
        points: 3,
        name: "season_totals",
      },
      {
        pattern:
          /win.*\b(nfc|afc|eastern|western) (east|west|north|south|conference)\b/i,
        points: 3,
        name: "division_winner",
      },
    ];

    for (const { pattern, points, name } of futuresPatterns) {
      if (pattern.test(combined)) {
        score += points;
        patterns.push(name);
        break; // Only count once
      }
    }

    return {
      signal: "language_patterns",
      score: Math.min(score, 3), // Cap at 3
      detail:
        patterns.length > 0
          ? `Matched: ${patterns.join(", ")}`
          : "No futures patterns",
    };
  }

  /**
   * SIGNAL 3: Odds analysis
   * Score: 0-2 (very low odds often indicate futures)
   */
  static analyzeOdds(market) {
    const odds = market.currentOdds || market.odds || {};
    const yesOdds =
      typeof odds.yes === "number" ? odds.yes : parseFloat(odds.yes || 0);
    const bid =
      typeof market.bid === "number" ? market.bid : parseFloat(market.bid || 0);
    const ask =
      typeof market.ask === "number" ? market.ask : parseFloat(market.ask || 0);

    const maxOdds = Math.max(yesOdds, bid, ask);

    // Very low odds (< 5%) often indicate one of many outcomes (like championship races)
    if (maxOdds > 0 && maxOdds <= 0.05) {
      return {
        signal: "odds_analysis",
        score: 2,
        detail: `Very low odds (${(maxOdds * 100).toFixed(
          1
        )}%) suggests multi-outcome futures`,
      };
    } else if (maxOdds > 0 && maxOdds < 0.15) {
      return {
        signal: "odds_analysis",
        score: 1,
        detail: `Low odds (${(maxOdds * 100).toFixed(
          1
        )}%) might indicate futures`,
      };
    }

    return { signal: "odds_analysis", score: 0, detail: "Odds inconclusive" };
  }

  /**
   * SIGNAL 4: Polymarket metadata/tags
   * Score: 0-3
   */
  static analyzeMetadata(market) {
    const tags = market.tags || [];
    const tagLabels = tags
      .map((t) => (typeof t === "string" ? t : t.label || ""))
      .join(" ")
      .toLowerCase();

    // Look for futures-specific tags
    if (
      tagLabels.includes("futures") ||
      tagLabels.includes("season winner") ||
      tagLabels.includes("championship")
    ) {
      return { signal: "metadata", score: 3, detail: "Futures tag detected" };
    }

    // Look for specific event tags that indicate single games
    if (
      tagLabels.includes("game") ||
      tagLabels.includes("match") ||
      tagLabels.includes("tonight")
    ) {
      return {
        signal: "metadata",
        score: -2,
        detail: "Single event tag detected",
      };
    }

    return { signal: "metadata", score: 0, detail: "No relevant tags" };
  }

  /**
   * Generate human-readable reason
   */
  static generateReason(signals, isFutures) {
    if (!isFutures) {
      return "Single event - weather analysis applicable";
    }

    const mainReasons = signals
      .filter((s) => s.score >= 2)
      .map((s) => s.detail)
      .join("; ");

    return mainReasons || "Futures bet detected";
  }

  /**
   * Quick check - just returns boolean
   */
  static isFuturesBet(market) {
    return this.detectMarketType(market).isFutures;
  }
}

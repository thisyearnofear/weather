/**
 * Trading Service - Handles wallet operations and order submission
 * Single source of truth for trading-related API calls
 * 
 * ENHANCED: Now uses comprehensive TradingValidator for all validations
 */

import { TradingValidator } from './validators/tradingValidator.js';

export const tradingService = {
  /**
   * Check wallet USDC balance and trading approval status
   */
  async checkWalletStatus(walletAddress, chainId) {
    if (!walletAddress) return null;

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, chainId })
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, wallet: data.wallet };
      }
      return { success: false, error: data.error || 'Unable to check wallet status' };
    } catch (err) {
      console.error('Wallet check failed:', err);
      return { success: false, error: 'Failed to check wallet status' };
    }
  },

  /**
   * Calculate order cost (BNB stake)
   * ENHANCED: Now uses TradingValidator with comprehensive cost calculation
   */
  calculateOrderCost(price, size, feeRateBps = 0) {
    return TradingValidator.calculateOrderCost(price, size, feeRateBps);
  },

  /**
   * Validate order before submission
   * ENHANCED: Now uses comprehensive TradingValidator with detailed validation
   */
  validateOrder(order, walletStatus, marketData = null) {
    // Use TradingValidator for comprehensive validation
    const validation = TradingValidator.validateTradingOperation('order', order, {
      walletStatus,
      marketData,
      userPreferences: {} // Can be extended with user preferences
    });

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.errors.join('; '),
        warnings: validation.warnings,
        details: {
          errors: validation.errors,
          warnings: validation.warnings,
          riskLevel: validation.riskLevel
        }
      };
    }

    return {
      valid: true,
      orderCost: validation.orderCost,
      riskLevel: validation.riskLevel,
      warnings: validation.warnings
    };
  },

  /**
   * Submit prediction to BNBChain (returns tx request or tx hash)
   * ENHANCED: Now includes market data validation and comprehensive error handling
   */
  async submitOrder(order, walletStatus, marketData = null) {
    // Enhanced validation with market data
    const validation = this.validateOrder(order, walletStatus, marketData);
    if (!validation.valid) {
      return { 
        success: false, 
        error: validation.error,
        warnings: validation.warnings,
        details: validation.details
      };
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketID: order.marketID,
          price: parseFloat(order.price),
          side: order.side,
          size: parseFloat(order.size),
          walletAddress: order.walletAddress,
          chainId: order.chainId
        })
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          orderID: data.txHash || data.orderID || 'client-sign',
          order: data.order,
          txRequest: data.txRequest,
          mode: data.mode,
          // Include validation results for client awareness
          orderCost: validation.orderCost,
          riskLevel: validation.riskLevel,
          warnings: validation.warnings
        };
      }
      return { success: false, error: data.error || 'Order submission failed' };
    } catch (err) {
      console.error('Order submission error:', err);
      return { success: false, error: 'Failed to submit order' };
    }
  },

  /**
   * NEW: Validate wallet status using TradingValidator
   */
  async validateWallet(walletAddress, chainId) {
    const validation = TradingValidator.validateTradingOperation('wallet', {
      address: walletAddress,
      chainId
    });

    return validation;
  },

  /**
   * NEW: Check market access permissions
   */
  async validateMarketAccess(userLocation, marketType, userAge = null) {
    const validation = TradingValidator.validateTradingOperation('market-access', {
      userLocation,
      marketType,
      userAge
    });

    return validation;
  },

  /**
   * NEW: Estimate price impact for large orders
   */
  async estimatePriceImpact(orderData, marketData) {
    const validation = TradingValidator.validateTradingOperation('price-impact', orderData, {
      marketData
    });

    return {
      estimatedImpact: validation.estimatedPriceImpact,
      warnings: validation.warnings,
      valid: validation.valid
    };
  }
};

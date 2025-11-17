/**
 * Trading Service - Handles wallet operations and order submission
 * Single source of truth for trading-related API calls
 */

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
   */
  calculateOrderCost(price, size) {
    if (!price || !size) return null;
    const baseCost = price * size;
    return {
      baseCost: baseCost.toFixed(6),
      total: baseCost.toFixed(6)
    };
  },

  /**
   * Validate order before submission
   */
  validateOrder(order, walletStatus) {
    const { price, size, walletAddress } = order;
    const orderCost = this.calculateOrderCost(price, size);

    if (!walletAddress) {
      return { valid: false, error: 'Wallet not connected' };
    }

    if (!price || !size) {
      return { valid: false, error: 'Missing price or size' };
    }

    if (walletStatus && parseFloat(walletStatus.balance.formatted) < parseFloat(orderCost.total)) {
      return {
        valid: false,
        error: `Insufficient balance. Need ${orderCost.total} BNB, have ${walletStatus.balance.formatted} BNB`
      };
    }

    return { valid: true };
  },

  /**
   * Submit prediction to BNBChain (returns tx request or tx hash)
   */
  async submitOrder(order, walletStatus) {
    const validation = this.validateOrder(order, walletStatus);
    if (!validation.valid) {
      return { success: false, error: validation.error };
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
          mode: data.mode
        };
      }
      return { success: false, error: data.error || 'Order submission failed' };
    } catch (err) {
      console.error('Order submission error:', err);
      return { success: false, error: 'Failed to submit order' };
    }
  }
};

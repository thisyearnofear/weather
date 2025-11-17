import { ethers } from 'ethers';

/**
 * Get ethers provider for BNBChain
 */
function getProvider(chainId) {
  const id = Number(chainId || 56);
  if (id === 42161 || id === 421614) {
    const rpcUrl = process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc';
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  if (id === 137 || id === 80001) {
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  const rpcUrl = process.env.NEXT_PUBLIC_BNB_RPC_URL || 'https://bsc-dataseed.binance.org';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Check native BNB balance for a wallet
 */
async function checkBalance(walletAddress, chainId) {
  try {
    const provider = getProvider(chainId);
    const balance = await provider.getBalance(walletAddress);
    const balanceFormatted = ethers.formatEther(balance);

    return {
      raw: balance.toString(),
      formatted: parseFloat(balanceFormatted).toFixed(6),
      decimals: 18
    };
  } catch (error) {
    console.error(`Error checking balance for ${walletAddress}:`, error.message);
    return null;
  }
}

// No allowance required for native BNB

/**
 * POST /api/wallet
 * Check balance and allowance for connected wallet
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { walletAddress, chainId } = body;

    if (!walletAddress) {
      return Response.json(
        {
          success: false,
          error: 'Wallet address is required'
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid wallet address'
        },
        { status: 400 }
      );
    }

    // Check balance
    const balanceData = await checkBalance(walletAddress, chainId);

    if (!balanceData) {
      return Response.json(
        {
          success: false,
          error: 'Unable to check wallet status. Network error.'
        },
        { status: 500 }
      );
    }

    const id = Number(chainId || 56);
    const symbol = id === 42161 || id === 421614 ? 'ETH' : id === 137 || id === 80001 ? 'MATIC' : 'BNB';

    return Response.json(
      {
        success: true,
        wallet: {
          address: walletAddress,
          balance: {
            raw: balanceData.raw,
            formatted: balanceData.formatted,
            symbol
          },
          canTrade: parseFloat(balanceData.formatted) > 0,
          needsApproval: false
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Wallet API Error:', error);

    return Response.json(
      {
        success: false,
        error: 'Wallet status check failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet
 * Return service status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = Number(searchParams.get('chainId') || 56);

    if (!address) {
      return Response.json({
        service: 'Wallet Status Service',
        status: 'available',
        capabilities: {
          checkBalance: true
        },
        usageExample: 'POST /api/wallet with { walletAddress: "0x..." }',
        networks: ['BNBChain']
      });
    }

    // Optional: Quick balance check with address param
    if (!ethers.isAddress(address)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid wallet address'
        },
        { status: 400 }
      );
    }

    const balance = await checkBalance(address, chainId);
    const symbol = chainId === 42161 || chainId === 421614 ? 'ETH' : chainId === 137 || chainId === 80001 ? 'MATIC' : 'BNB';
    return Response.json({
      success: true,
      wallet: address,
      balance: balance?.formatted || '0',
      symbol,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return Response.json(
      {
        success: false,
        error: 'Status check failed'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

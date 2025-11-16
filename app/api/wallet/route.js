import { ethers } from 'ethers';

/**
 * Get ethers provider for BNBChain
 */
function getProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_BNB_RPC_URL || 'https://bsc-testnet.publicnode.com';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Check native BNB balance for a wallet
 */
async function checkBalance(walletAddress) {
  try {
    const provider = getProvider();
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
    const { walletAddress } = body;

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
    const balanceData = await checkBalance(walletAddress);

    if (!balanceData) {
      return Response.json(
        {
          success: false,
          error: 'Unable to check wallet status. Network error.'
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        wallet: {
          address: walletAddress,
          balance: {
            raw: balanceData.raw,
            formatted: balanceData.formatted,
            symbol: 'BNB'
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

    const balance = await checkBalance(address);
    return Response.json({
      success: true,
      wallet: address,
      balance: balance?.formatted || '0',
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

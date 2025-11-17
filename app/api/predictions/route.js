import { ethers } from 'ethers'

const RATE_LIMIT = 50
const WINDOW_MS = 60 * 60 * 1000
const rateMap = new Map()

function identFromReq(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ua = request.headers.get('user-agent')
  return forwarded?.split(',')[0]?.trim() || realIp?.trim() || ua || 'unknown'
}

function checkLimit(id) {
  const now = Date.now()
  const arr = rateMap.get(id) || []
  const valid = arr.filter(t => now - t < WINDOW_MS)
  if (valid.length >= RATE_LIMIT) return false
  valid.push(now)
  rateMap.set(id, valid)
  return true
}

function getProvider(rpcUrl) {
  const url = rpcUrl || 'https://bsc-testnet.publicnode.com'
  return new ethers.JsonRpcProvider(url)
}

const CONTRACT_ABI = [
  'function placePrediction(uint256 marketId, string side, uint256 stakeWei, uint16 oddsBps, string uri) external payable returns (bytes32)'
]

function computeFee(stakeWei, bps) {
  const basis = BigInt(bps || 100)
  return (stakeWei * basis) / 10000n
}

function getChainConfig(chainId) {
  const id = Number(chainId || 0)
  if (id === 42161) {
    return {
      address: process.env.PREDICTION_CONTRACT_ADDRESS_ARBITRUM,
      feeBps: parseInt(process.env.PREDICTION_FEE_BPS_ARBITRUM || process.env.PREDICTION_FEE_BPS || '100', 10),
      rpcUrl: process.env.ARB_RPC_URL,
      signerKey: process.env.ARB_PRIVATE_KEY
    }
  }
  if (id === 56 || id === 97) {
    return {
      address: process.env.PREDICTION_CONTRACT_ADDRESS_BNB,
      feeBps: parseInt(process.env.PREDICTION_FEE_BPS_BNB || process.env.PREDICTION_FEE_BPS || '100', 10),
      rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL,
      signerKey: process.env.BNB_PRIVATE_KEY
    }
  }
  if (id === 137 || id === 80001) {
    return {
      address: process.env.PREDICTION_CONTRACT_ADDRESS_POLYGON,
      feeBps: parseInt(process.env.PREDICTION_FEE_BPS_POLYGON || '100', 10),
      rpcUrl: process.env.POLYGON_RPC_URL,
      signerKey: process.env.POLYGON_PRIVATE_KEY
    }
  }
  return {
    address: process.env.PREDICTION_CONTRACT_ADDRESS,
    feeBps: parseInt(process.env.PREDICTION_FEE_BPS || '100', 10),
    rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL,
    signerKey: process.env.BNB_PRIVATE_KEY
  }
}

function buildTxData(contractAddress, payload, feeBps) {
  const iface = new ethers.Interface(CONTRACT_ABI)
  const data = iface.encodeFunctionData('placePrediction', [
    payload.marketId,
    payload.side,
    payload.stakeWei,
    payload.oddsBps,
    payload.uri || ''
  ])
  const fee = computeFee(payload.stakeWei, feeBps)
  return { to: contractAddress, data, value: fee }
}

function serializeTxRequest(tx) {
  return {
    to: tx.to,
    data: tx.data,
    value: typeof tx.value === 'bigint' ? tx.value.toString() : tx.value
  }
}

export async function POST(request) {
  try {
    const id = identFromReq(request)
    if (!checkLimit(id)) {
      return Response.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json()
    const { marketID, price, side, size, walletAddress, metadataUri, chainId } = body

    if (!marketID || price === undefined || !side || !size || !walletAddress) {
      return Response.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const oddsBps = Math.max(0, Math.min(10000, Math.round(parseFloat(price) * 10000)))
    const stakeWei = ethers.parseEther(String(size))

    const cfg = getChainConfig(chainId)
    if (!cfg.address) {
      const txReq = buildTxData('0x0000000000000000000000000000000000000000', {
        marketId: Number(marketID),
        side,
        stakeWei,
        oddsBps,
        uri: metadataUri || ''
      }, cfg.feeBps)
      return Response.json({
        success: true,
        mode: 'client_signature_required',
        txRequest: serializeTxRequest(txReq),
        note: 'Set chain-specific prediction contract address to enable server-side address resolution'
      }, { status: 200 })
    }

    // Ensure feeBps aligns with on-chain contract config
    let effectiveFeeBps = cfg.feeBps
    try {
      const provider = getProvider(cfg.rpcUrl)
      const contract = new ethers.Contract(cfg.address, ['function feeBps() view returns (uint16)'], provider)
      const chainFee = await contract.feeBps()
      effectiveFeeBps = Number(chainFee)
    } catch (_) {}

    const txRequest = buildTxData(cfg.address, {
      marketId: Number(marketID),
      side,
      stakeWei,
      oddsBps,
      uri: metadataUri || ''
    }, effectiveFeeBps)

    const serverPk = cfg.signerKey
    if (!serverPk) {
      return Response.json({ success: true, txRequest: serializeTxRequest(txRequest), mode: 'client_signature_required' }, { status: 200 })
    }

    const provider = getProvider(cfg.rpcUrl)
    const wallet = new ethers.Wallet(serverPk, provider)
    const tx = await wallet.sendTransaction(txRequest)
    const receipt = await tx.wait()

    return Response.json({
      success: true,
      txHash: tx.hash,
      receipt,
      order: {
        marketID,
        side,
        price,
        size
      },
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({
    service: 'BNB Predictions',
    status: 'available',
    capabilities: { buildTxRequest: true, serverSubmit: !!process.env.BNB_PRIVATE_KEY },
    network: 'BNBChain',
    contract: process.env.PREDICTION_CONTRACT_ADDRESS_BNB || null,
    feeBps: parseInt(process.env.PREDICTION_FEE_BPS_BNB || process.env.PREDICTION_FEE_BPS || '100', 10)
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
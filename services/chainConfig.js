// Centralized chain configuration - single source of truth
import { ethers } from 'ethers'

const CHAIN_CONFIGS = {
  56: { // BNB Mainnet
    name: 'BNB Chain',
    addressKey: 'PREDICTION_CONTRACT_ADDRESS_BNB',
    feeBpsKey: 'PREDICTION_FEE_BPS_BNB',
    rpcUrlKey: 'NEXT_PUBLIC_BNB_RPC_URL',
    signerKeyKey: 'BNB_PRIVATE_KEY',
    fallbackRpc: 'https://bsc-dataseed.binance.org'
  },
  97: { // BNB Testnet
    name: 'BNB Testnet',
    addressKey: 'PREDICTION_CONTRACT_ADDRESS_BNB',
    feeBpsKey: 'PREDICTION_FEE_BPS_BNB',
    rpcUrlKey: 'NEXT_PUBLIC_BNB_RPC_URL',
    signerKeyKey: 'BNB_PRIVATE_KEY',
    fallbackRpc: 'https://bsc-testnet.publicnode.com'
  },
  137: { // Polygon
    name: 'Polygon',
    addressKey: 'PREDICTION_CONTRACT_ADDRESS_POLYGON',
    feeBpsKey: 'PREDICTION_FEE_BPS_POLYGON',
    rpcUrlKey: 'POLYGON_RPC_URL',
    signerKeyKey: 'POLYGON_PRIVATE_KEY',
    fallbackRpc: 'https://polygon-rpc.com'
  },
  80001: { // Polygon Mumbai
    name: 'Polygon Mumbai',
    addressKey: 'PREDICTION_CONTRACT_ADDRESS_POLYGON',
    feeBpsKey: 'PREDICTION_FEE_BPS_POLYGON',
    rpcUrlKey: 'POLYGON_RPC_URL',
    signerKeyKey: 'POLYGON_PRIVATE_KEY',
    fallbackRpc: 'https://rpc-mumbai.maticvigil.com'
  },
  42161: { // Arbitrum
    name: 'Arbitrum',
    addressKey: 'PREDICTION_CONTRACT_ADDRESS_ARBITRUM',
    feeBpsKey: 'PREDICTION_FEE_BPS_ARBITRUM',
    rpcUrlKey: 'ARB_RPC_URL',
    signerKeyKey: 'ARB_PRIVATE_KEY',
    fallbackRpc: 'https://arb1.arbitrum.io/rpc'
  }
}

export function getChainConfig(chainId) {
  const id = Number(chainId || 56)
  const config = CHAIN_CONFIGS[id]
  
  if (!config) {
    // Fallback to BNB
    return getChainConfig(56)
  }

  return {
    chainId: id,
    name: config.name,
    address: process.env[config.addressKey],
    feeBps: parseInt(process.env[config.feeBpsKey] || process.env.PREDICTION_FEE_BPS || '100', 10),
    rpcUrl: process.env[config.rpcUrlKey] || config.fallbackRpc,
    signerKey: process.env[config.signerKeyKey]
  }
}

// Cache healthy providers to avoid repeated health checks
const providerCache = new Map()
const PROVIDER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getHealthyProvider(chainId) {
  const config = getChainConfig(chainId)
  const cacheKey = `${chainId}_${config.rpcUrl}`
  
  // Check cache
  const cached = providerCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < PROVIDER_CACHE_TTL) {
    return cached.provider
  }

  // Try primary RPC
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl)
    await provider.getBlockNumber() // Health check
    providerCache.set(cacheKey, { provider, timestamp: Date.now() })
    return provider
  } catch (error) {
    console.warn(`Primary RPC failed for chain ${chainId}, using fallback`)
    const fallbackProvider = new ethers.JsonRpcProvider(config.fallbackRpc)
    providerCache.set(cacheKey, { provider: fallbackProvider, timestamp: Date.now() })
    return fallbackProvider
  }
}

export function getProvider(chainId) {
  const config = getChainConfig(chainId)
  return new ethers.JsonRpcProvider(config.rpcUrl)
}

export function getSigner(chainId) {
  const config = getChainConfig(chainId)
  if (!config.signerKey) return null
  
  const provider = getProvider(chainId)
  return new ethers.Wallet(config.signerKey, provider)
}

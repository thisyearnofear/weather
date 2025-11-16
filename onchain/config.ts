import { http, createConfig } from 'wagmi'
import { bsc, bscTestnet, arbitrum, arbitrumSepolia, polygon, polygonMumbai } from 'wagmi/chains'

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

export const config = createConfig({
    chains: [arbitrum, arbitrumSepolia, bsc, bscTestnet, polygon, polygonMumbai],
    transports: {
        [arbitrum.id]: http(process.env.ARB_RPC_URL),
        [arbitrumSepolia.id]: http(process.env.ARB_RPC_URL),
        [bsc.id]: http(process.env.NEXT_PUBLIC_BNB_RPC_URL),
        [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BNB_RPC_URL),
        [polygon.id]: http(process.env.POLYGON_RPC_URL),
        [polygonMumbai.id]: http(process.env.POLYGON_RPC_URL),
    },
})

export const metadata = {
    name: 'Weather Markets',
    description: 'Predict weather outcomes on Arbitrum, BNB, Polygon',
    url: 'https://weather.markets',
    icons: ['https://weather.markets/icon.png']
}

export const bnbChainId = { mainnet: 56, testnet: 97 }
export const arbitrumChainId = { mainnet: 42161, testnet: 421614 }
export const polygonChainId = { mainnet: 137, testnet: 80001 }

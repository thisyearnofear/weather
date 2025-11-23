# 🌤️ Fourcast: AI-Powered Weather Edge Analytics Platform

A multichain AI intelligence layer that analyzes weather forecasts to identify mispriced prediction markets. Built on a sophisticated infrastructure spanning multiple blockchains to optimize for trading, analytics, and reputation tracking.

## 🎯 Overview

Fourcast is an AI layer that joins real-time weather with prediction market data to surface mispricings. It aggregates markets, analyzes weather impact, and lets users publish signals on-chain.

## 🔗 Integrations

- **Polymarket (Polygon)**: Market discovery and trading links
- **Kalshi**: Integrated into the Markets feed with platform badges, filters, and deep links
- **Aptos (Devnet)**: On-chain signal publishing via dual wallet UX (MetaMask + Petra)

See [Architecture Guide](./docs/ARCHITECTURE.md) for technical details.

## 🚀 Features

- Date-first Markets UI (Today, Tomorrow, This Week, Later)
- Aggregated discovery across Polymarket and Kalshi with platform badges and filters
- Weather-aware AI analysis and confidence scoring
- Dual wallet UX: MetaMask (trading) and Petra (signals)
- On-chain signal publishing to Aptos with tx hash feedback
- Optional arbitrage banner showing cross-platform price discrepancies

## �️ Stack

- **Frontend**: Next.js, React, Tailwind, React Three Fiber
- **Data & AI**: WeatherAPI, Venice AI, Redis cache, SQLite
- **Web3**: Wagmi/ConnectKit, Aptos Wallet Standard, Move module on devnet

## 📁 Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   ├── global.css       # Global styles
│   ├── layout.js        # Root layout
│   └── page.js          # Homepage
├── components/          # React components
├── services/           # Weather & AI services
├── onchain/            # Blockchain integration
├── markets/            # Prediction market logic
├── docs/               # Documentation
└── public/             # Static assets
```

## 🛠️ Tech Stack

### **Multichain Infrastructure**

- **Polygon**: Polymarket integration, trading execution
- **BNB Chain**: Analytics contracts, performance tracking
- **Aptos**: Signal registry, reputation system (Move smart contracts)

### **Smart Contracts & Web3**

- **Solidity 0.8.20**: BNB Chain analytics contracts with OpenZeppelin
- **Move**: Aptos signal registry and reputation tracking
- **Web3 Integration**: Wagmi, ConnectKit, Aptos Wallet Standard
- **Wallets**: MetaMask (trading), Petra (signals), multi-wallet UX

### **Frontend & UX**

- **Framework**: Next.js 15, React 19, React Three Fiber
- **Styling**: Tailwind CSS, responsive design
- **3D Graphics**: Three.js, React Three Drei, postprocessing effects
- **State Management**: React hooks, Web3 context providers

### **AI & Data**

- **AI Engine**: Venice AI (qwen3-235b for deep reasoning)
- **Market Data**: Polymarket Gamma API, real-time odds
- **Weather Data**: WeatherAPI integration, forecast analysis
- **Backend**: Next.js API Routes, Redis caching, SQLite analytics

### **Infrastructure & Deployment**

- **Hosting**: Vercel (frontend), multichain contract deployment
- **Database**: SQLite for local analytics, on-chain for immutable records
- **APIs**: RESTful endpoints, streaming AI analysis, WebSocket connections

## 🚀 Quick Start

### Prerequisites

- Node.js 18.18+ or 20+
- npm or yarn
- MetaMask wallet (for trading on Polygon)
- Petra wallet (for signals on Aptos)
- API keys: WeatherAPI, Venice AI

### Installation

```bash
# Clone repository
git clone <repository-url>
cd fourcast

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Setup

```bash
# .env.local
# Weather & AI Services
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key
VENICE_API_KEY=your_venice_api_key

# Multichain Configuration
NEXT_PUBLIC_POLYMARKET_HOST=https://clob.polymarket.com
NEXT_PUBLIC_BNB_CHAIN_ID=56
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
NEXT_PUBLIC_APTOS_NETWORK=devnet

# Contract Addresses (update after deployment)
NEXT_PUBLIC_BNB_ANALYTICS_CONTRACT=0x...
NEXT_PUBLIC_APTOS_MODULE_ADDRESS=0x...
```

### Development

```bash
# Start development server
npm run dev -- --turbopack

# Build for production
npm run build

# Start production server
npm start
```

<!-- Removed extended code examples to keep README concise -->

<!-- Consolidated features above -->

## 📖 Documentation

Comprehensive documentation in 3 focused guides:

- **[Setup Guide](./docs/SETUP.md)** - Installation, configuration, and development workflow
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design, patterns, and scalability
- **[API Reference & Roadmap](./docs/API.md)** - Complete API documentation and product roadmap

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This platform is for educational and entertainment purposes. Weather prediction is inherently uncertain. Always trade responsibly and never risk more than you can afford to lose. This is a research intelligence tool, not an auto-betting system.

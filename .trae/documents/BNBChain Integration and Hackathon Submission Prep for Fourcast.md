# Fourcast — BNBChain Integration and Hackathon Submission Plan

## Objectives
- Meet submission requirements: public repo, working prototype, blockchain integration on BNBChain, basic tests, demo video, and concise descriptions.
- Preserve current weather-powered discovery and AI analysis while adding BNBChain prediction logging and fee economics.

## Current State
- Fullstack Next.js app with weather visualization and Polymarket market discovery.
- Web3 config targets Arbitrum in `onchain/config.ts:8` and Polygon USDC/Polymarket in wallet/orders APIs (`app/api/wallet/route.js:3–23`, `app/api/orders/route.js:61–91, 202–216`).
- AI integration via Venice (`services/aiService.js`).
- No test runner configured; Testing Library dev deps present in `package.json:35–51`.

## Technical Changes
### 1) Switch Wallet UX to BNBChain
- Update chains to `bsc` and `bscTestnet` in `onchain/config.ts:2,8–12`; change `metadata.description` to BNBChain.
- Enforce connected network = BNBChain in UI (guard in `app/layout.js:16–29` and connect modal text).
- Add `NEXT_PUBLIC_BNB_RPC_URL` and `NEXT_PUBLIC_BNB_CHAIN_ID` to `.env.local`.

### 2) Smart Contract MVP on BNBChain (testnet)
- Contract: `PredictionReceipt` with `placePrediction(marketId, outcome, stakeWei, oddsBps, uri)` and `event PredictionPlaced(...)`.
- Include `feeBps` (e.g., 100 = 1%) collected to `treasury` for revenue focus.
- Deploy to BSC Testnet; record `PREDICTION_CONTRACT_ADDRESS` in env.

### 3) Backend Routes (BNBChain path)
- New route `app/api/predictions/route.ts`:
  - Validate request and market from Polymarket catalog.
  - Build `oddsBps` and `stakeWei`; call contract via `ethers` provider to emit `PredictionPlaced`.
  - Return tx hash and normalized order summary.
- Keep existing `/api/orders` (Polymarket) as optional; default UI routes users to BNB predictions.

### 4) Frontend Flow Adjustments
- Update trading UI to support BNB stake input and show estimated fee.
- Replace balance/allowance checks with native BNB balance via `ethers.getBalance` or ERC20-USDT if desired.
- Add lightweight "My Predictions" view that reads `PredictionPlaced` events for the connected address.

### 5) Market Discovery & AI (reuse)
- Continue using `services/polymarketService.js` for discovery, edge scoring, and odds context.
- Keep `/api/markets` and `/api/analyze` unchanged; wire the new "Place Prediction" button to BNBChain route.

### 6) Tests
- Add Vitest + Testing Library:
  - Unit tests for `assessMarketWeatherEdge` in `services/polymarketService.js`.
  - Integration tests for `/api/markets` and `/api/analyze` with mocked axios.
  - Route test for `/api/predictions` mocking `ethers` provider/contract to assert payload and response shape.
- Add `npm test` script and CI sanity run.

### 7) Deployment
- Deploy to Vercel; ensure BNB RPC and contract address are set as env vars.
- Confirm wallet connect on BSC Testnet and end-to-end flow (discover → analyze → place prediction → see tx/event).

### 8) Submission Assets
- Demo video (≤5 min) outline:
  1. Intro and problem framing (prediction markets + weather edge).
  2. Connect wallet on BNB Testnet.
  3. Discover top weather-sensitive markets and run AI analysis.
  4. Place a BNB-backed prediction; show tx hash and event.
  5. Revenue model (1% fee to treasury) and roadmap.
- Project description (≤150 words): concise draft prepared after integration.
- Team info (≤150 words): brief roles and relevant experience.

## Environment
- `.env.local`: `NEXT_PUBLIC_BNB_RPC_URL`, `NEXT_PUBLIC_BNB_CHAIN_ID`, `PREDICTION_CONTRACT_ADDRESS`, `VENICE_API_KEY`, `NEXT_PUBLIC_WEATHER_API_KEY`.

## Milestones
- Day 1: BNBChain config + contract draft + route skeleton.
- Day 2: UI wiring + event reader + fee display.
- Day 3: Tests + Vercel deployment + polish.
- Day 4: Record demo video + finalize descriptions; submit on Dorahacks.

## Verification
- Run tests; manual wallet connect to BSC Testnet; place prediction and verify event indexed; confirm end-to-end UX and fee capture.

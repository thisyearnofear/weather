# Multi‑Chain Alignment Plan

## Goals
- Support distinct prediction receipt contract addresses and fee bps per chain (Arbitrum, BNB, optional Polygon).
- Frontend connects to multiple chains; backend selects the correct address/RPC/fee by `chainId`.

## Backend Changes
- Update `/api/predictions` to be chain‑aware:
  - Accept `chainId` in request body.
  - Map `chainId → { address, feeBps, rpcUrl, signerKey }` from env.
  - Build `txRequest` using chain‑specific `address` and fee (`stakeWei * feeBps / 10000`).
  - If signerKey exists for that chain, submit via the chain’s RPC; else return `txRequest` for client signature.
  - File: `app/api/predictions/route.js` — add mapping and `chainId` handling near the encoder `buildTxData` and provider selection (current encoder at lines 21–29).

## Frontend Changes
- Add Arbitrum chains back to wagmi config and keep BNB; optional Polygon:
  - File: `onchain/config.ts:1–13` — import `arbitrum` and `polygon`, set transports with env RPCs `ARB_RPC_URL`, `BNB_RPC_URL`, `POLYGON_RPC_URL`.
- Pass active `chainId` to the backend when placing predictions:
  - File: `services/tradingService.js:77–109` — include `chainId` in POST body.
  - Source for `chainId`: use wagmi hook (e.g., `useChainId` or `useNetwork`) in `app/ai/page.js:14–16` and thread it to `OrderForm` → `tradingService.submitOrder`.
- Fee display uses per‑chain `feeBps` from env (optional enhancement): show a dynamic preview based on the selected chain.

## Environment Variables
- Addresses:
  - `PREDICTION_CONTRACT_ADDRESS_ARBITRUM=0x64BAeF0d2F0eFAb7b42C19568A06aB9E76cd2310`
  - `PREDICTION_CONTRACT_ADDRESS_BNB=<set after deploy>`
  - `PREDICTION_CONTRACT_ADDRESS_POLYGON=<optional>`
- Fees:
  - `PREDICTION_FEE_BPS_ARBITRUM=500`
  - `PREDICTION_FEE_BPS_BNB=500`
  - `PREDICTION_FEE_BPS_POLYGON=<optional>`
- RPC URLs:
  - `ARB_RPC_URL`, `BNB_RPC_URL`, `POLYGON_RPC_URL`
- Optional server signers:
  - `ARB_PRIVATE_KEY`, `BNB_PRIVATE_KEY`, `POLYGON_PRIVATE_KEY`

## Tests
- Extend `tests/predictionsRoute.test.js` to set per‑chain env vars and verify that `chainId=42161` (Arbitrum) returns a `txRequest` with the correct `to` and fee value.
- Add a second case for `chainId=56` (BNB) using placeholder address/env to validate mapping.

## Verification
- Local: trigger `/api/predictions` with `chainId=42161` and confirm correct fee (`feeBps=500`) and `to=Arbitrum address`.
- Wallet: switch to Arbitrum in the UI, place a prediction, and confirm `PredictionPlaced` event.
- Repeat after BNB deployment with its address/fee.

## Delivery
- Implement the above changes, update `.env.local.example` with the new multi‑chain variables, and ensure frontend/route compile cleanly.
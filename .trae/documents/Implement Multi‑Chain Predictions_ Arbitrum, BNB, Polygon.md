# Planned Changes

## Backend
- Update `/api/predictions` to accept `chainId` and map to chain‑specific `{address, feeBps, rpc, signer}` via env.
- Build `txRequest` with fee‑only value from mapped `feeBps`; submit with chain‑specific signer if present.

## Frontend
- Add Arbitrum (and Polygon optional) to wagmi config; keep BNB.
- Pass active `chainId` from wagmi to `/api/predictions` via `tradingService`.

## Environment
- Add per‑chain envs: addresses, fee bps, RPCs, optional signer keys.

## Tests
- Extend predictions route test to validate per‑chain mapping for Arbitrum and BNB.

## Outcome
- Single UI with multi‑chain predictions flow aligned with your Arbitrum deployment and ready for BNB/Polygon.
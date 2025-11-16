# Differentiate Contract Address Per Chain

## Goals
- Use distinct contract addresses and fee bps per network (Arbitrum, BNB, optional Polygon).
- Ensure the backend selects the correct address and RPC based on the user’s connected chain.

## Environment Vars
- Add per‑chain vars:
  - `PREDICTION_CONTRACT_ADDRESS_ARBITRUM=0x64BAeF0d2F0eFAb7b42C19568A06aB9E76cd2310`
  - `PREDICTION_CONTRACT_ADDRESS_BNB=<after-deploy>`
  - `PREDICTION_CONTRACT_ADDRESS_POLYGON=<optional>`
  - `PREDICTION_FEE_BPS_ARBITRUM=500`, `PREDICTION_FEE_BPS_BNB=500`, `PREDICTION_FEE_BPS_POLYGON=<optional>`
  - Optional server signers: `ARB_PRIVATE_KEY`, `BNB_PRIVATE_KEY`, `POLYGON_PRIVATE_KEY`
  - RPCs: `ARB_RPC_URL`, `BNB_RPC_URL`, `POLYGON_RPC_URL`

## Backend Route Update (`/api/predictions`)
- Accept `chainId` (or network key) from client.
- Map `chainId → {address, feeBps, rpc}`; build `txRequest` using the correct `address` and fee calculation.
- If server signer exists for that chain, submit; otherwise return `txRequest` for client signature.

## Frontend
- Add Arbitrum back to wagmi chains; keep BNB; optional Polygon.
- Pass the active `chainId` from wallet to `/api/predictions`.
- Show fee preview based on chain‑specific `feeBps`.

## Fallbacks & Safety
- If a chain’s address is missing, return `client_signature_required` with a helpful message.
- Validate `chainId` to prevent misrouting; fail closed if unmapped.

## Deliverables
- Env additions documented.
- Backend selection logic per chain.
- Frontend passes `chainId` and displays accurate fee.

## Verification
- Test on Arbitrum with your deployed address; confirm event emission.
- Dry‑run on BNB after deployment using the mapped address; confirm fee math and logs.
- Optional Polygon ERC20 variant mapping if used.
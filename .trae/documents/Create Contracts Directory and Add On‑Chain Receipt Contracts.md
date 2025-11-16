# Add `contracts/` and Wire Prediction Receipt Contracts

## Objectives
- Create a top-level `contracts/` directory so judges can quickly find the smart contracts.
- Add two audited-pattern receipt contracts (native coin, ERC20) using OpenZeppelin modules.
- Keep function signatures aligned with the app’s `/api/predictions` route for seamless integration.

## Files to Add
- `contracts/PredictionReceipt.sol` (BNB/Arbitrum native coin):
  - Ownable, Pausable, ReentrancyGuard from OpenZeppelin.
  - `placePrediction(uint256 marketId, string side, uint256 stakeWei, uint16 oddsBps, string uri)`; fee-only native payment to contract; emits `PredictionPlaced`.
  - Configurable `feeBps` and `treasury`; withdraw fees to treasury.
- `contracts/PredictionReceiptERC20.sol` (Polygon USDC or other ERC20):
  - Ownable, Pausable, ReentrancyGuard; uses `IERC20`.
  - `placePredictionToken(uint256 marketId, string side, uint256 stakeUnits, uint16 oddsBps, string uri)`; transfers fee to treasury via `transferFrom`; emits `PredictionPlaced`.
  - Configurable `feeBps`, `treasury`, and immutable `token` address.

## Integration Compatibility
- Matches the backend route encoder used by the app (`/api/predictions`) expecting `placePrediction(...)` with the same parameter ordering.
- ERC20 variant available for Polygon/USDC to align with Polymarket’s native chain.

## Deployment Notes (Remix)
- Compiler: `0.8.20`, optimizer: enabled, 200 runs.
- Libraries: Import OpenZeppelin via Remix `@openzeppelin/contracts/...`.
- Constructor params per chain:
  - `treasury`: multisig/treasury address
  - `feeBps`: recommended `100` (1%) with a hard cap of `1000`
  - `token` (ERC20 variant only): e.g., Polygon USDC `0x2791Bca1f2de4661ED88A928C4bc8b36c3d969E5`
- Verify on-chain via Remix/Block Explorer for transparency.

## After Deployment
- Set env vars to wire the app: `PREDICTION_CONTRACT_ADDRESS` per chain.
- Optional server signer: `BNB_PRIVATE_KEY` (or chain-specific) if you want server-submitted transactions; otherwise client signs.
- Validate end-to-end with wallet on BNB/Arbitrum/Polygon and ensure events are indexed.

## Next Steps
- Add the `contracts/` folder and both `.sol` files exactly as specified (no extra comments), then push.
- Run a quick local build and sanity tests; check the live site’s client-side error and resolve any env or runtime issues post-merge.
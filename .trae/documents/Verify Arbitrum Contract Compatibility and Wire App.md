# Compatibility Review Plan for Arbitrum Contract

## What I’ll Verify
- ABI/function signature matches the app expectations: `placePrediction(uint256,string,uint256,uint16,string)` payable.
- Event compatibility: `PredictionPlaced(address indexed user,uint256 indexed marketId,bytes32 indexed id,string,uint256,uint16,string,uint256)`.
- Fee model alignment: msg.value equals `(stakeWei * feeBps) / 10000` and does not custody stake.
- Admin surfaces: `feeBps`, `treasury`, pause/unpause, fee withdrawal.

## App Wiring
- Set `PREDICTION_CONTRACT_ADDRESS=0x64BAeF0d2F0eFAb7b42C19568A06aB9E76cd2310` and `PREDICTION_FEE_BPS` to your deployed value.
- Validate backend route build: `app/api/predictions/route.js` uses fee-only msg.value and the same parameter ordering.
- Confirm front-end flows (OrderForm) still compute stake and cost consistently for Arbitrum labeling.

## Validation Steps
- Check Arbiscan verified source/ABI for the address and compare to expected signature.
- Dry-run encoding locally (no broadcast): confirm the `encodeFunctionData` matches the deployed ABI.
- Send a small test transaction with fee-only value; confirm event emission and readable logs.

## Outcome
- If signatures and fee semantics match, the contract works with our current system without further code changes.
- If there’s any mismatch (parameter order or non-payable), I’ll list exact deltas and the minimal app-side adjustments needed.

## Next
- After confirmation on Arbitrum, deploy the same contract on BNBChain with the same `feeBps/treasury`.
- Optionally deploy ERC20 version on Polygon to align with Polymarket USDC if desired.
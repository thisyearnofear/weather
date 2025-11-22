/**
 * Aptos Signal Publisher Service
 * 
 * Handles publishing signals to Aptos blockchain using user wallet connection.
 * 
 * Architecture:
 * - User wallet signs transactions (no backend private keys)
 * - Signals stored on-chain in user's account
 * - Events emitted for indexing
 * - Graceful fallback to SQLite if Aptos fails
 */

import { AptosClient, Types } from 'aptos';

const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1';
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_APTOS_MODULE_ADDRESS || '0x1'; // Will be set after deployment

export class AptosSignalPublisher {
    constructor() {
        this.client = new AptosClient(APTOS_NODE_URL);
    }

    /**
     * Prepare transaction payload for publishing a signal
     * User's wallet will sign this transaction
     */
    preparePublishSignalPayload(signalData) {
        const {
            event_id,
            market_title,
            venue = '',
            event_time = 0,
            market_snapshot_hash,
            weather_json = {},
            ai_digest = '',
            confidence = 'UNKNOWN',
            odds_efficiency = 'UNKNOWN',
        } = signalData;

        return {
            type: 'entry_function_payload',
            function: `${MODULE_ADDRESS}::signal_registry::publish_signal`,
            type_arguments: [],
            arguments: [
                event_id,
                market_title,
                venue,
                event_time.toString(),
                market_snapshot_hash,
                JSON.stringify(weather_json),
                ai_digest,
                confidence,
                odds_efficiency,
            ],
        };
    }

    /**
     * Get signal count for an account
     */
    async getSignalCount(accountAddress) {
        try {
            const payload = {
                function: `${MODULE_ADDRESS}::signal_registry::get_signal_count`,
                type_arguments: [],
                arguments: [accountAddress],
            };

            const result = await this.client.view(payload);
            return parseInt(result[0]);
        } catch (error) {
            console.error('Failed to get signal count:', error);
            return 0;
        }
    }

    /**
     * Check if transaction was successful
     */
    async waitForTransaction(txHash) {
        try {
            await this.client.waitForTransaction(txHash);
            const txn = await this.client.getTransactionByHash(txHash);
            return {
                success: txn.success,
                tx_hash: txHash,
                vm_status: txn.vm_status,
            };
        } catch (error) {
            console.error('Transaction failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export const aptosPublisher = new AptosSignalPublisher();
